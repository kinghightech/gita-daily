import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface LearnBackgroundProps {
  children: React.ReactNode;
}

// ── Ripple config ──
const RIPPLES = Array.from({ length: 6 }, (_, i) => ({
  width: 200 + i * 100,
  height: 80 + i * 30,
  left: `${10 + i * 12}%` as const,
  top: `${50 + (i % 3) * 15}%` as const,
  duration: 4000 + i * 1000,
  delay: i * 500,
}));

// ── Lily pad config ──
const LILY_PADS = [
  { x: 5, y: 70, size: 40 },
  { x: 85, y: 65, size: 50 },
  { x: 10, y: 85, size: 35 },
  { x: 80, y: 82, size: 45 },
];

export default function LearnBackground({ children }: LearnBackgroundProps) {
  // ── Ripple animations ──
  const rippleAnims = useRef(
    RIPPLES.map(() => new Animated.Value(0))
  ).current;

  // ── Light sweep animation ──
  const sweepAnim = useRef(new Animated.Value(-1)).current;

  // ── Lily pad animations ──
  const lilyAnims = useRef(
    LILY_PADS.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    // Start ripple loops
    rippleAnims.forEach((anim, i) => {
      const ripple = RIPPLES[i];
      Animated.loop(
        Animated.sequence([
          Animated.delay(ripple.delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: ripple.duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: ripple.duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    });

    // Light sweep loop
    Animated.loop(
      Animated.timing(sweepAnim, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Lily pad float loops
    lilyAnims.forEach((anim, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: (3000 + i * 1000),
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: (3000 + i * 1000),
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, [rippleAnims, sweepAnim, lilyAnims]);

  return (
    <View style={styles.root}>
      {/* ── Layer 1: Base gradient (dark bottom → mid blue → lighter teal-blue top) ── */}
      <LinearGradient
        colors={['#172354', '#1a3070', '#1e4a8a', '#296072']}
        locations={[0, 0.35, 0.65, 1]}
        start={{ x: 0.5, y: 1 }}
        end={{ x: 0.5, y: 0 }}
        style={StyleSheet.absoluteFill}
      />

      {/* ── Subtle top-center radial glow to break up the flat top ── */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient
          colors={['rgba(103,232,249,0.14)', 'rgba(103,232,249,0.04)', 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.4 }}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* ── Layer 2: Water texture — very subtle radial center glow ── */}
      <View style={[StyleSheet.absoluteFill, { opacity: 0.1 }]} pointerEvents="none">
        <LinearGradient
          colors={[
            'rgba(103,232,249,0.06)',
            'transparent',
            'transparent',
          ]}
          start={{ x: 0.5, y: 0.3 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.centerGlow}
        />
      </View>

      {/* ── Layer 3: Animated water ripples (6 expanding ellipses) ── */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {RIPPLES.map((ripple, i) => {
          const scale = rippleAnims[i].interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [1, 1.1, 1],
          });
          const opacity = rippleAnims[i].interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0.3, 0.1, 0.3],
          });

          return (
            <Animated.View
              key={`ripple-${i}`}
              style={[
                styles.ripple,
                {
                  width: ripple.width,
                  height: ripple.height,
                  left: ripple.left,
                  top: ripple.top,
                  transform: [{ scale }],
                  opacity,
                },
              ]}
            />
          );
        })}
      </View>

      {/* ── Layer 4: Horizontal light sweep ── */}
      <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]} pointerEvents="none">
        <Animated.View
          style={[
            styles.lightSweep,
            {
              transform: [
                {
                  translateX: sweepAnim.interpolate({
                    inputRange: [-1, 0, 1],
                    outputRange: [-600, 0, 600],
                  }),
                },
              ],
            },
          ]}>
          <LinearGradient
            colors={[
              'transparent',
              'rgba(103,232,249,0.10)',
              'transparent',
            ]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>

      {/* ── Layer 5: Floating lily pads ── */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {LILY_PADS.map((pad, i) => {
          const translateY = lilyAnims[i].interpolate({
            inputRange: [0, 1],
            outputRange: [0, -3],
          });
          const rotate = lilyAnims[i].interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '2deg'],
          });

          return (
            <Animated.View
              key={`lily-${i}`}
              style={{
                position: 'absolute',
                left: `${pad.x}%`,
                top: `${pad.y}%`,
                transform: [{ translateY }, { rotate }],
              }}>
              <View
                style={{
                  width: pad.size,
                  height: pad.size * 0.4,
                  borderRadius: pad.size,
                  backgroundColor: 'rgba(4,120,87,0.6)',
                  borderWidth: 1,
                  borderColor: 'rgba(16,185,129,0.3)',
                }}
              />
            </Animated.View>
          );
        })}
      </View>

      {/* ── Content ── */}
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {children}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  centerGlow: {
    position: 'absolute',
    top: '20%',
    left: '10%',
    width: '80%',
    height: '40%',
    borderRadius: 9999,
    opacity: 0.3,
  },
  ripple: {
    position: 'absolute',
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(103,232,249,0.08)',
  },
  lightSweep: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
});
