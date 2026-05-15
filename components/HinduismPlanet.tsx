import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Image, PanResponder, StyleSheet, View } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber/native';
import { Asset } from 'expo-asset';
import * as THREE from 'three';

type Rotation = { x: number; y: number };
type RotationRef = React.MutableRefObject<Rotation>;
type DragRef = React.MutableRefObject<boolean>;

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
const LINE_RADIUS = RADIUS + 0.014;
const INITIAL_ROTATION: Rotation = { x: -0.14, y: 0.52 };
const DRAG_SENSITIVITY = 0.0075;
const MAX_TILT = 1.12;
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

const SECTION_NODES: [number, number][] = [
  [64, -42],
  [48, 34],
  [36, 112],
  [8, -120],
  [10, -32],
  [12, 58],
  [-8, 132],
  [-34, -80],
  [-32, 10],
  [-42, 86],
  [54, -142],
  [-4, -174],
  [34, -78],
  [-58, -12],
  [-12, -18],
  [26, 164],
];

const SECTION_EDGES: [number, number][] = [
  [10, 0],
  [10, 3],
  [0, 12],
  [0, 1],
  [12, 4],
  [3, 4],
  [3, 11],
  [11, 7],
  [7, 8],
  [7, 13],
  [4, 14],
  [14, 8],
  [14, 5],
  [1, 4],
  [1, 5],
  [5, 2],
  [5, 6],
  [2, 15],
  [15, 6],
  [6, 9],
  [8, 9],
  [8, 13],
  [9, 13],
];

function pointOnSphere(latDeg: number, lonDeg: number) {
  const lat = (latDeg * Math.PI) / 180;
  const lon = (lonDeg * Math.PI) / 180;
  const cosLat = Math.cos(lat);

  return new THREE.Vector3(
    Math.cos(lon) * cosLat,
    Math.sin(lat),
    Math.sin(lon) * cosLat,
  ).normalize();
}

function slerpOnSphere(start: THREE.Vector3, end: THREE.Vector3, t: number) {
  const dot = clamp(start.dot(end), -0.999, 0.999);
  const omega = Math.acos(dot);
  const sinOmega = Math.sin(omega);
  const startScale = Math.sin((1 - t) * omega) / sinOmega;
  const endScale = Math.sin(t * omega) / sinOmega;

  return new THREE.Vector3()
    .addScaledVector(start, startScale)
    .addScaledVector(end, endScale)
    .normalize();
}

function pathPoint(start: THREE.Vector3, end: THREE.Vector3, t: number, edgeIndex: number) {
  const base = slerpOnSphere(start, end, t);
  const lateral = new THREE.Vector3().crossVectors(start, end).normalize();
  const wobble =
    Math.sin(t * Math.PI * 2 + edgeIndex * 1.37) * 0.010 +
    Math.sin(t * Math.PI * 5 + edgeIndex * 0.61) * 0.004;

  return base.addScaledVector(lateral, wobble).normalize();
}

function createDashedPathMesh({
  dashRadius,
  opacity,
  color,
  scaleBoost,
  renderOrder,
}: {
  dashRadius: number;
  opacity: number;
  color: number;
  scaleBoost: number;
  renderOrder: number;
}) {
  const nodeVectors = SECTION_NODES.map(([lat, lon]) => pointOnSphere(lat, lon));
  const dashSegments = SECTION_EDGES.flatMap(([startIndex, endIndex], edgeIndex) => {
    const start = nodeVectors[startIndex];
    const end = nodeVectors[endIndex];
    const arc = Math.acos(clamp(start.dot(end), -0.999, 0.999));
    const dashStep = 0.118;
    const dashSize = 0.065;
    const dashCount = Math.max(3, Math.floor(arc / dashStep));

    return Array.from({ length: dashCount }, (_, dashIndex) => {
      const startT = (dashIndex + 0.08) / dashCount;
      const endT = Math.min(startT + dashSize / arc, (dashIndex + 0.72) / dashCount);

      return {
        start: pathPoint(start, end, startT, edgeIndex),
        end: pathPoint(start, end, endT, edgeIndex),
      };
    });
  });
  const geometry = new THREE.CylinderGeometry(dashRadius, dashRadius, 1, 8, 1, false);
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthTest: true,
    depthWrite: false,
  });
  const mesh = new THREE.InstancedMesh(geometry, material, dashSegments.length);
  const dummy = new THREE.Object3D();
  const yAxis = new THREE.Vector3(0, 1, 0);

  dashSegments.forEach((segment, index) => {
    const start = segment.start.clone().multiplyScalar(LINE_RADIUS);
    const end = segment.end.clone().multiplyScalar(LINE_RADIUS);
    const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();

    dummy.position.copy(midpoint);
    dummy.quaternion.setFromUnitVectors(yAxis, direction.normalize());
    dummy.scale.set(scaleBoost, length, scaleBoost);
    dummy.updateMatrix();
    mesh.setMatrixAt(index, dummy.matrix);
  });

  mesh.instanceMatrix.needsUpdate = true;
  mesh.renderOrder = renderOrder;

  return mesh;
}

function DottedGoldSections() {
  const glowMesh = useMemo(
    () =>
      createDashedPathMesh({
        dashRadius: 0.009,
        opacity: 0.22,
        color: 0xffb833,
        scaleBoost: 1.65,
        renderOrder: 3,
      }),
    [],
  );
  const dashedMesh = useMemo(
    () =>
      createDashedPathMesh({
        dashRadius: 0.0048,
        opacity: 0.98,
        color: 0xffd166,
        scaleBoost: 1,
        renderOrder: 4,
      }),
    [],
  );

  return (
    <>
      <primitive object={glowMesh} />
      <primitive object={dashedMesh} />
    </>
  );
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
}: {
  targetRotationRef: RotationRef;
  isDraggingRef: DragRef;
  velocityRef: RotationRef;
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

    if (planetRef.current) {
      planetRef.current.rotation.set(current.x, current.y, 0);
    }
  });

  return (
    <group ref={planetRef}>
      <PlanetSurface />

      <DottedGoldSections />

      <mesh scale={1.075}>
        <sphereGeometry args={[RADIUS, 72, 54]} />
        <primitive object={atmosphereMaterial} attach="material" />
      </mesh>
    </group>
  );
}

export default function HinduismPlanet() {
  const targetRotationRef = useRef<Rotation>({ ...INITIAL_ROTATION });
  const startRotationRef = useRef<Rotation>({ ...INITIAL_ROTATION });
  const velocityRef = useRef<Rotation>({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);

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
    <View style={styles.container} {...panResponder.panHandlers}>
      <Canvas
        camera={{ position: [0, 0, 4], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#020617']} />
        <ambientLight intensity={0.45} />
        <directionalLight position={[3.5, 2.4, 4.2]} intensity={1.35} color="#dff4ff" />
        <directionalLight position={[-3.0, -1.8, -2.5]} intensity={0.28} color="#2563eb" />
        <PlanetScene
          targetRotationRef={targetRotationRef}
          isDraggingRef={isDraggingRef}
          velocityRef={velocityRef}
        />
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
});
