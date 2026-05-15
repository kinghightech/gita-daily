import { Canvas, useFrame } from '@react-three/fiber/native';
import React, { useRef } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';
import type { Mesh } from 'three';

type RotationRef = React.MutableRefObject<{ x: number; y: number }>;

function SphereScene({ rotationRef }: { rotationRef: RotationRef }) {
  const groupRef = useRef<Mesh>(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.x = rotationRef.current.x;
      groupRef.current.rotation.y = rotationRef.current.y;
    }
  });

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[5, 6, 5]} intensity={1.1} />
      <directionalLight position={[-4, -2, -3]} intensity={0.3} color="#93c5fd" />
      <mesh ref={groupRef}>
        <sphereGeometry args={[1.5, 64, 64]} />
        <meshStandardMaterial color="#2563eb" roughness={0.35} metalness={0.15} />

        {/* FRONT marker: bright white raised cap on +Z */}
        <mesh position={[0, 0, 1.45]}>
          <sphereGeometry args={[0.35, 32, 32]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#ffffff"
            emissiveIntensity={0.35}
            roughness={0.3}
          />
        </mesh>

        {/* BACK marker: deep red raised cap on -Z */}
        <mesh position={[0, 0, -1.45]}>
          <sphereGeometry args={[0.35, 32, 32]} />
          <meshStandardMaterial
            color="#dc2626"
            emissive="#7f1d1d"
            emissiveIntensity={0.4}
            roughness={0.4}
          />
        </mesh>
      </mesh>
    </>
  );
}

export default function WorldSphereTest() {
  const rotationRef = useRef({ x: 0, y: 0 });
  const startRef = useRef({ x: 0, y: 0 });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startRef.current = { ...rotationRef.current };
      },
      onPanResponderMove: (_evt, gesture) => {
        rotationRef.current = {
          x: startRef.current.x + gesture.dy * 0.01,
          y: startRef.current.y + gesture.dx * 0.01,
        };
      },
    })
  ).current;

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <SphereScene rotationRef={rotationRef} />
      </Canvas>
      <View pointerEvents="none" style={styles.legend}>
        <View style={styles.legendRow}>
          <View style={[styles.dot, { backgroundColor: '#ffffff' }]} />
          <Text style={styles.legendText}>FRONT</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.dot, { backgroundColor: '#dc2626' }]} />
          <Text style={styles.legendText}>BACK</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  legend: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    backgroundColor: 'rgba(15,23,42,0.7)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    color: '#FEF3C7',
    fontSize: 12,
    fontWeight: '600',
  },
});
