import React, { useMemo, useRef } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';

(function suppressLibraryWarnings() {
  const orig = console.warn.bind(console);
  console.warn = (...args: unknown[]) => {
    const msg = String(args[0]);
    if (
      msg.includes('THREE.Clock') ||
      msg.includes('EXT_color_buffer_float') ||
      msg.includes('not read by fragment shader')
    ) return;
    orig(...args);
  };
})();

const RADIUS = 0.7;

const VERT = /* glsl */ `
  varying vec3 vLocalPos;
  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;

  void main() {
    vLocalPos = position;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// ---------------------------------------------------------------------------
// Planet fragment shader — 7-octave FBM, double domain warp, specular sheen,
// polar ice caps, Fresnel atmosphere, night-side glow.
// ---------------------------------------------------------------------------
const PLANET_FRAG = /* glsl */ `
  precision highp float;

  varying vec3 vLocalPos;
  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;
  uniform vec3 uSunDir;

  float hash(vec2 p) {
    p = fract(p * vec2(127.1, 311.7));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i),                hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0, amp = 0.5;
    mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
    for (int i = 0; i < 7; i++) {
      v   += amp * vnoise(p);
      p    = rot * p * 2.07 + vec2(7.1, 3.7);
      amp *= 0.46;
    }
    return v;
  }

  void main() {
    vec3  p   = normalize(vLocalPos);
    float lon = atan(p.z, p.x);
    float lat = asin(clamp(p.y, -1.0, 1.0));
    vec2  uv  = vec2(lon * 0.15915 + 0.5, lat * 0.31831 + 0.5);

    vec2 q = vec2(fbm(uv * 4.5), fbm(uv * 4.5 + vec2(5.2, 1.3)));
    vec2 r = vec2(
      fbm(uv * 3.0 + 4.5 * q + vec2(1.7, 9.2)),
      fbm(uv * 3.0 + 4.5 * q + vec2(8.3, 2.8))
    );
    float f = fbm(uv * 2.5 + 4.5 * r);

    float t = clamp(f * 2.3 - 0.42, 0.0, 1.0);
    t = t * t * (3.0 - 2.0 * t);

    vec3 abyss  = vec3(0.00, 0.01, 0.14);
    vec3 deep   = vec3(0.00, 0.08, 0.45);
    vec3 royal  = vec3(0.02, 0.26, 0.88);
    vec3 bright = vec3(0.08, 0.55, 1.00);
    vec3 ice    = vec3(0.60, 0.92, 1.00);

    vec3 col;
    if      (t < 0.25) col = mix(abyss,  deep,   t * 4.0);
    else if (t < 0.50) col = mix(deep,   royal,  (t - 0.25) * 4.0);
    else if (t < 0.75) col = mix(royal,  bright, (t - 0.50) * 4.0);
    else               col = mix(bright, ice,    (t - 0.75) * 4.0);

    float iceMask = smoothstep(0.72, 0.92, abs(p.y));
    col = mix(col, vec3(0.82, 0.94, 1.00), iceMask * 0.88);

    vec3  N    = normalize(vWorldNormal);
    vec3  L    = normalize(uSunDir);
    vec3  V    = normalize(cameraPosition - vWorldPos);
    float diff = max(0.0, dot(N, L));

    col *= 0.07 + 0.93 * diff;

    vec3  H    = normalize(L + V);
    float spec = pow(max(0.0, dot(N, H)), 96.0);
    col += spec * smoothstep(0.25, 0.65, t) * vec3(0.25, 0.55, 1.00) * diff * 1.2;

    float fresnel = pow(1.0 - max(0.0, dot(N, V)), 3.5);
    col += fresnel * vec3(0.04, 0.38, 1.00) * 3.5;

    float night = 1.0 - smoothstep(0.0, 0.25, diff);
    col += night * vec3(0.00, 0.04, 0.18) * 0.6;

    gl_FragColor = vec4(col, 1.0);
  }
`;

// ---------------------------------------------------------------------------
// Section lines
// ---------------------------------------------------------------------------
const GC_NORMALS: [number, number, number][] = [
  [0, 1, 0],
  [1, 0, 0],
  [0, 0, 1],
  [0.5774, 0.5774, 0.5774],
  [-0.5774, 0.5774, 0.5774],
  [0.5774, 0.5774, -0.5774],
];

function buildPositions(nx: number, ny: number, nz: number, radius: number): Float32Array {
  const n = new THREE.Vector3(nx, ny, nz).normalize();
  let tmp = new THREE.Vector3(0, 1, 0);
  if (Math.abs(n.dot(tmp)) > 0.95) tmp.set(1, 0, 0);
  const u = new THREE.Vector3().crossVectors(tmp, n).normalize();
  const v = new THREE.Vector3().crossVectors(n, u).normalize();

  const SEGS = 128;
  const arr = new Float32Array((SEGS + 1) * 3);
  for (let i = 0; i <= SEGS; i++) {
    const t = (i / SEGS) * Math.PI * 2;
    const c = Math.cos(t) * radius;
    const s = Math.sin(t) * radius;
    arr[i * 3]     = c * u.x + s * v.x;
    arr[i * 3 + 1] = c * u.y + s * v.y;
    arr[i * 3 + 2] = c * u.z + s * v.z;
  }
  return arr;
}

function GreatCircleLine({
  nx, ny, nz, radius,
}: {
  nx: number; ny: number; nz: number; radius: number;
}) {
  const lineRef = useRef<THREE.Line>(null);
  const computed = useRef(false);

  const positions = useMemo(
    () => buildPositions(nx, ny, nz, radius),
    [nx, ny, nz, radius],
  );

  useFrame(() => {
    if (!computed.current && lineRef.current) {
      lineRef.current.computeLineDistances();
      computed.current = true;
    }
  });

  return (
    <line ref={lineRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={(positions.length / 3) | 0}
          itemSize={3}
        />
      </bufferGeometry>
      <lineDashedMaterial
        color={0xe2b94a}
        linewidth={2}
        dashSize={0.07}
        gapSize={0.04}
        transparent
        opacity={0.85}
      />
    </line>
  );
}

function SectionLines({ radius }: { radius: number }) {
  return (
    <>
      {GC_NORMALS.map(([x, y, z], i) => (
        <GreatCircleLine key={i} nx={x} ny={y} nz={z} radius={radius + 0.015} />
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------
function PlanetScene({
  rotationRef,
}: {
  rotationRef: React.MutableRefObject<{ x: number; y: number }>;
}) {
  const groupRef = useRef<THREE.Group>(null);

  const planetMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: PLANET_FRAG,
        uniforms: {
          uSunDir: { value: new THREE.Vector3(0.6, 0.4, 0.7).normalize() },
        },
      }),
    [],
  );

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.x = rotationRef.current.x;
      groupRef.current.rotation.y = rotationRef.current.y;
    }
  });

  return (
    <>
      {/* Rotating planet group */}
      <group ref={groupRef}>
        <mesh>
          <sphereGeometry args={[RADIUS, 80, 80]} />
          <primitive object={planetMat} attach="material" />
        </mesh>
        <SectionLines radius={RADIUS} />
      </group>

      {/* Inner atmosphere — thin haze just above surface */}
      <mesh>
        <sphereGeometry args={[RADIUS + 0.05, 32, 32]} />
        <meshBasicMaterial color="#1d4ed8" transparent opacity={0.10} depthWrite={false} />
      </mesh>

      {/* Outer glow halo */}
      <mesh>
        <sphereGeometry args={[RADIUS + 0.55, 32, 32]} />
        <meshBasicMaterial color="#2563eb" transparent opacity={0.07} side={THREE.BackSide} depthWrite={false} />
      </mesh>
    </>
  );
}

// ---------------------------------------------------------------------------
// Exported component
// ---------------------------------------------------------------------------
export default function HinduismPlanet() {
  const rotationRef = useRef({ x: 0.3, y: 0.4 });
  const startRef    = useRef({ x: 0.3, y: 0.4 });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderGrant: () => {
        startRef.current = { ...rotationRef.current };
      },
      onPanResponderMove: (_evt, gesture) => {
        rotationRef.current = {
          x: startRef.current.x + gesture.dy * 0.008,
          y: startRef.current.y + gesture.dx * 0.008,
        };
      },
    }),
  ).current;

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <Canvas camera={{ position: [0, 0, 4], fov: 45 }}>
        <PlanetScene rotationRef={rotationRef} />
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
