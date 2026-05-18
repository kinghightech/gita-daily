import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  type LayoutChangeEvent,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber/native';
import { Asset } from 'expo-asset';
import * as THREE from 'three';
import type { WorldPath } from '@/lib/worldPaths';

type Rotation = { x: number; y: number };
type RotationRef = React.MutableRefObject<Rotation>;
type DragRef = React.MutableRefObject<boolean>;
type PlanetMarker = Pick<WorldPath, 'slug' | 'title' | 'shortTitle' | 'accent' | 'bounds'>;
type PlanetLayout = { width: number; height: number };
type ProjectedMarker = {
  marker: PlanetMarker;
  left: number;
  top: number;
  opacity: number;
  scale: number;
};

const EMPTY_MARKERS: PlanetMarker[] = [];
const warningPatchKey = '__dharmaThreeWarningPatch';
const globalWithPatch = globalThis as typeof globalThis & Record<string, boolean>;

if (!globalWithPatch[warningPatchKey]) {
  globalWithPatch[warningPatchKey] = true;
  const originalWarn = console.warn.bind(console);
  const originalLog = console.log.bind(console);

  console.warn = (...args: unknown[]) => {
    const message = String(args[0]);

    if (
      message.includes('THREE.Clock') ||
      message.includes('EXT_color_buffer_float') ||
      message.includes('not read by fragment shader')
    ) {
      return;
    }

    originalWarn(...args);
  };

  console.log = (...args: unknown[]) => {
    const message = String(args[0]);

    if (message.includes("EXGL: gl.pixelStorei() doesn't support this parameter yet")) {
      return;
    }

    originalLog(...args);
  };
}

const RADIUS = 0.72;
const INITIAL_ROTATION: Rotation = { x: -0.14, y: 0.52 };
const DRAG_SENSITIVITY = 0.0075;
const MAX_TILT = 1.12;
const CAMERA_Z = 4;
const CAMERA_FOV = 45;
const MARKER_POSITION_EPSILON = 0.1;
const MARKER_WIDTH = 124;
const MARKER_HEIGHT = 36;
const PLANET_TEXTURE = require('../assets/images/hinduism-planet-map.png');

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const ATMOSPHERE_VERTEX = /* glsl */ `
  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;

  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ATMOSPHERE_FRAGMENT = /* glsl */ `
  precision highp float;

  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;

  void main() {
    vec3 N = normalize(vWorldNormal);
    vec3 V = normalize(cameraPosition - vWorldPos);
    float rim = pow(1.0 - max(dot(N, V), 0.0), 2.8);
    float alpha = smoothstep(0.10, 0.92, rim) * 0.46;

    gl_FragColor = vec4(0.02, 0.34, 1.00, alpha);
  }
`;

function markerToSpherePoint(marker: PlanetMarker) {
  const u = (marker.bounds.left + marker.bounds.width / 2) / 100;
  const v = (marker.bounds.top + marker.bounds.height / 2) / 100;
  const phi = u * Math.PI * 2;
  const theta = v * Math.PI;
  const sinTheta = Math.sin(theta);

  return new THREE.Vector3(
    -Math.cos(phi) * sinTheta,
    Math.cos(theta),
    Math.sin(phi) * sinTheta,
  ).normalize();
}

function projectMarker(marker: PlanetMarker, rotation: Rotation, layout: PlanetLayout) {
  const point = markerToSpherePoint(marker);
  point.applyEuler(new THREE.Euler(rotation.x, rotation.y, 0, 'XYZ'));

  if (point.z < -0.08) {
    return null;
  }

  const aspect = layout.width / layout.height;
  const tanHalfFov = Math.tan((CAMERA_FOV * Math.PI) / 360);
  const depth = CAMERA_Z - point.z * RADIUS;
  const xNdc = (point.x * RADIUS) / (depth * tanHalfFov * aspect);
  const yNdc = (point.y * RADIUS) / (depth * tanHalfFov);
  const frontness = clamp((point.z + 0.08) / 1.08, 0, 1);

  return {
    marker,
    left: (xNdc * 0.5 + 0.5) * layout.width,
    top: (-yNdc * 0.5 + 0.5) * layout.height,
    opacity: 0.42 + frontness * 0.58,
    scale: 0.84 + frontness * 0.2,
  };
}

function projectMarkers(markers: PlanetMarker[], rotation: Rotation, layout: PlanetLayout) {
  return markers
    .map((marker) => projectMarker(marker, rotation, layout))
    .filter((marker): marker is ProjectedMarker => marker !== null);
}

function projectedMarkersAreEqual(previous: ProjectedMarker[], next: ProjectedMarker[]) {
  if (previous.length !== next.length) {
    return false;
  }

  return previous.every((previousMarker, index) => {
    const nextMarker = next[index];

    return (
      previousMarker.marker.slug === nextMarker.marker.slug &&
      Math.abs(previousMarker.left - nextMarker.left) < MARKER_POSITION_EPSILON &&
      Math.abs(previousMarker.top - nextMarker.top) < MARKER_POSITION_EPSILON &&
      Math.abs(previousMarker.opacity - nextMarker.opacity) < 0.01 &&
      Math.abs(previousMarker.scale - nextMarker.scale) < 0.01
    );
  });
}

function PlanetSurface() {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadPlanetTexture() {
      const asset = Asset.fromModule(PLANET_TEXTURE);
      await asset.downloadAsync();
      const uri = asset.localUri ?? asset.uri;
      const size = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        Image.getSize(uri, (width, height) => resolve({ width, height }), reject);
      });
      const loadedTexture = new THREE.Texture({
        data: asset,
        width: size.width,
        height: size.height,
      });

      // Expo GL uploads this object shape directly.
      (loadedTexture as THREE.Texture & { isDataTexture: boolean }).isDataTexture = true;
      loadedTexture.flipY = true;
      loadedTexture.wrapS = THREE.ClampToEdgeWrapping;
      loadedTexture.wrapT = THREE.ClampToEdgeWrapping;
      loadedTexture.generateMipmaps = false;
      loadedTexture.minFilter = THREE.LinearFilter;
      loadedTexture.magFilter = THREE.LinearFilter;
      loadedTexture.colorSpace = THREE.SRGBColorSpace;
      loadedTexture.needsUpdate = true;

      return loadedTexture;
    }

    loadPlanetTexture()
      .then((loadedTexture) => {
        if (!mounted) {
          loadedTexture.dispose();
          return;
        }

        setTexture(loadedTexture);
      })
      .catch((error) => {
        console.warn('Failed to load Hinduism planet texture', error);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <mesh>
      <sphereGeometry args={[RADIUS, 128, 96]} />
      <meshStandardMaterial
        key={texture ? 'hinduism-planet-textured' : 'hinduism-planet-loading'}
        map={texture ?? undefined}
        color={texture ? '#ffffff' : '#0757c8'}
        emissive={texture ? '#00122f' : '#063f9e'}
        emissiveIntensity={texture ? 0.12 : 0.38}
        roughness={0.58}
        metalness={0.02}
      />
    </mesh>
  );
}

function PlanetScene({
  targetRotationRef,
  isDraggingRef,
  velocityRef,
  displayRotationRef,
}: {
  targetRotationRef: RotationRef;
  isDraggingRef: DragRef;
  velocityRef: RotationRef;
  displayRotationRef: RotationRef;
}) {
  const planetRef = useRef<THREE.Group>(null);
  const smoothedRotationRef = useRef<Rotation>({ ...INITIAL_ROTATION });

  const atmosphereMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: ATMOSPHERE_VERTEX,
        fragmentShader: ATMOSPHERE_FRAGMENT,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.FrontSide,
      }),
    [],
  );

  useFrame((_, delta) => {
    const frameDelta = Math.min(delta, 0.033);
    const target = targetRotationRef.current;

    if (!isDraggingRef.current) {
      target.y += (0.12 + velocityRef.current.y) * frameDelta;
      target.x = clamp(target.x + velocityRef.current.x * frameDelta, -MAX_TILT, MAX_TILT);

      velocityRef.current.x *= 0.91;
      velocityRef.current.y *= 0.91;
    }

    const current = smoothedRotationRef.current;
    const ease = 1 - Math.pow(0.0008, frameDelta);

    current.x += (target.x - current.x) * ease;
    current.y += (target.y - current.y) * ease;
    displayRotationRef.current = { x: current.x, y: current.y };

    if (planetRef.current) {
      planetRef.current.rotation.set(current.x, current.y, 0);
    }
  });

  return (
    <group ref={planetRef}>
      <PlanetSurface />

      <mesh scale={1.075}>
        <sphereGeometry args={[RADIUS, 72, 54]} />
        <primitive object={atmosphereMaterial} attach="material" />
      </mesh>
    </group>
  );
}

function PlanetMarkerLayer({
  markers,
  layout,
  displayRotationRef,
  onMarkerPress,
}: {
  markers: PlanetMarker[];
  layout: PlanetLayout;
  displayRotationRef: RotationRef;
  onMarkerPress?: (marker: PlanetMarker) => void;
}) {
  const [projectedMarkers, setProjectedMarkers] = useState<ProjectedMarker[]>([]);

  useEffect(() => {
    if (!markers.length || layout.width === 0 || layout.height === 0) {
      setProjectedMarkers([]);
      return;
    }

    let animationFrame = 0;
    let isActive = true;

    const updateMarkers = () => {
      if (!isActive) {
        return;
      }

      const nextMarkers = projectMarkers(markers, displayRotationRef.current, layout);
      setProjectedMarkers((previousMarkers) =>
        projectedMarkersAreEqual(previousMarkers, nextMarkers) ? previousMarkers : nextMarkers,
      );
      animationFrame = requestAnimationFrame(updateMarkers);
    };

    animationFrame = requestAnimationFrame(updateMarkers);

    return () => {
      isActive = false;
      cancelAnimationFrame(animationFrame);
    };
  }, [displayRotationRef, layout, markers]);

  return (
    <View pointerEvents="box-none" style={styles.markerLayer}>
      {projectedMarkers.map(({ marker, left, top, opacity, scale }) => (
        <Pressable
          key={marker.slug}
          accessibilityRole="button"
          accessibilityLabel={`Open ${marker.title}`}
          hitSlop={6}
          onPress={() => onMarkerPress?.(marker)}
          style={({ pressed }) => [
            styles.markerButton,
            {
              left,
              top,
              opacity,
              borderColor: marker.accent,
              backgroundColor: pressed ? `${marker.accent}38` : 'rgba(15,23,42,0.72)',
              transform: [
                { translateX: -MARKER_WIDTH / 2 },
                { translateY: -MARKER_HEIGHT / 2 },
                { scale: pressed ? scale * 0.96 : scale },
              ],
            },
          ]}
        >
          <View style={[styles.markerDot, { backgroundColor: marker.accent }]} />
          <Text style={styles.markerText} numberOfLines={1}>
            {marker.shortTitle}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function HinduismPlanet({
  markers = EMPTY_MARKERS,
  onMarkerPress,
}: {
  markers?: PlanetMarker[];
  onMarkerPress?: (marker: PlanetMarker) => void;
}) {
  const targetRotationRef = useRef<Rotation>({ ...INITIAL_ROTATION });
  const startRotationRef = useRef<Rotation>({ ...INITIAL_ROTATION });
  const velocityRef = useRef<Rotation>({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const displayRotationRef = useRef<Rotation>({ ...INITIAL_ROTATION });
  const [layout, setLayout] = useState<PlanetLayout>({ width: 0, height: 0 });

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setLayout((previousLayout) =>
      previousLayout.width === width && previousLayout.height === height
        ? previousLayout
        : { width, height },
    );
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        isDraggingRef.current = true;
        velocityRef.current = { x: 0, y: 0 };
        startRotationRef.current = { ...targetRotationRef.current };
      },
      onPanResponderMove: (_event, gesture) => {
        targetRotationRef.current = {
          x: clamp(startRotationRef.current.x + gesture.dy * DRAG_SENSITIVITY, -MAX_TILT, MAX_TILT),
          y: startRotationRef.current.y + gesture.dx * DRAG_SENSITIVITY,
        };
      },
      onPanResponderRelease: (_event, gesture) => {
        isDraggingRef.current = false;
        velocityRef.current = {
          x: clamp(gesture.vy * DRAG_SENSITIVITY * 7.0, -0.75, 0.75),
          y: clamp(gesture.vx * DRAG_SENSITIVITY * 7.0, -1.05, 1.05),
        };
      },
      onPanResponderTerminate: () => {
        isDraggingRef.current = false;
      },
    }),
  ).current;

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <View style={styles.canvasLayer} {...panResponder.panHandlers}>
        <Canvas
          camera={{ position: [0, 0, CAMERA_Z], fov: CAMERA_FOV }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        >
          <ambientLight intensity={0.45} />
          <directionalLight position={[3.5, 2.4, 4.2]} intensity={1.35} color="#dff4ff" />
          <directionalLight position={[-3.0, -1.8, -2.5]} intensity={0.28} color="#2563eb" />
          <PlanetScene
            targetRotationRef={targetRotationRef}
            isDraggingRef={isDraggingRef}
            velocityRef={velocityRef}
            displayRotationRef={displayRotationRef}
          />
        </Canvas>
      </View>

      <PlanetMarkerLayer
        markers={markers}
        layout={layout}
        displayRotationRef={displayRotationRef}
        onMarkerPress={onMarkerPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  canvasLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  markerLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  markerButton: {
    position: 'absolute',
    width: MARKER_WIDTH,
    height: MARKER_HEIGHT,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 8,
  },
  markerDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  markerText: {
    flexShrink: 1,
    color: '#FEF3C7',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0,
  },
});
