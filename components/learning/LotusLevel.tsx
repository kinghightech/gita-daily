import { Lock } from 'lucide-react-native';
import { memo, useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse } from 'react-native-svg';

interface LotusLevelProps {
  level: number;
  isCompleted: boolean;
  isLocked: boolean;
  isActive: boolean;
  onPress: (level: number) => void;
  allowPressWhenLocked?: boolean;
  size?: 'lg' | 'sm';
}

const OUTER_ANGLES = [-40, -25, -10, 10, 25, 40];
const MID_ANGLES = [-30, -15, 0, 15, 30];
const INNER_ANGLES = [-20, -7, 7, 20];
const CENTER_ANGLES = [-12, 0, 12];
const DOT_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

function LotusLevel({
  level,
  isCompleted,
  isLocked,
  isActive,
  onPress,
  allowPressWhenLocked = false,
  size = 'lg',
}: LotusLevelProps) {
  const rippleAnim1 = useRef(new Animated.Value(1)).current;
  const rippleAnim2 = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(1)).current;
  const rippleLoop1Ref = useRef<Animated.CompositeAnimation | null>(null);
  const rippleLoop2Ref = useRef<Animated.CompositeAnimation | null>(null);
  const glowLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    rippleAnim1.setValue(1);
    rippleAnim2.setValue(1);
    glowAnim.setValue(1.1); // Slight static glow for active levels

    return () => {
      // Nothing to cleanup as we've removed loops
    };
  }, [isLocked, isActive, isCompleted, glowAnim, rippleAnim1, rippleAnim2]);

  const containerSize = size === 'lg' ? 80 : 56;
  const svgSize = size === 'lg' ? 80 : 56;

  // Color scheme based on state
  const getPetalColors = () => {
    if (isCompleted) {
      return {
        outer: '#fde68a', // amber-200
        mid: '#fcd34d',   // amber-300
        inner: '#fbbf24', // amber-400
        center: '#f59e0b', // amber-500
        core: '#fbbf24',  // yellow-400
      };
    }
    if (isActive) {
      return {
        outer: '#fbcfe8', // pink-200
        mid: '#f9a8d4',   // pink-300
        inner: '#f472b6', // pink-400
        center: '#ec4899', // pink-500
        core: '#fde047',  // yellow-300
      };
    }
    return {
      outer: '#fce7f3', // pink-50
      mid: '#fbcfe8',   // pink-100
      inner: '#f9a8d4', // pink-200
      center: '#f472b6', // pink-300
      core: '#fef08a',  // yellow-200
    };
  };

  const colors = getPetalColors();
  const leafColor = isCompleted ? '#6ee7b7' : '#34d399'; // emerald-300 or emerald-400

  return (
    <Pressable
      onPressIn={
        isLocked && !allowPressWhenLocked
          ? undefined
          : () => onPress(level)
      }
      style={({ pressed }) => [
        styles.container,
        { width: containerSize, height: containerSize },
        pressed && (!isLocked || allowPressWhenLocked) && styles.pressed,
      ]}
      disabled={isLocked && !allowPressWhenLocked}
    >
      {/* Water ripple effect */}
      {!isLocked && (
        <>
          <Animated.View
            style={[
              styles.ripple,
              {
                transform: [
                  { scale: rippleAnim1 },
                ],
                opacity: rippleAnim1.interpolate({
                  inputRange: [1, 1.5],
                  outputRange: [0.4, 0],
                }),
              },
            ]}
          />
          <Animated.View
            style={[
              styles.ripple,
              {
                transform: [
                  { scale: rippleAnim2 },
                ],
                opacity: rippleAnim2.interpolate({
                  inputRange: [1, 1.8],
                  outputRange: [0.3, 0],
                }),
              },
            ]}
          />
        </>
      )}

      {/* Lotus flower SVG */}
      <View
        style={[
          styles.lotusContainer,
          { width: svgSize, height: svgSize },
          isLocked && styles.locked,
        ]}
      >
        <Svg viewBox="0 0 100 90" width={svgSize} height={svgSize * 0.9}>
          {/* Lily pad / leaf base */}
          <Ellipse cx="50" cy="78" rx="38" ry="10" fill={leafColor} />
          <Ellipse
            cx="50"
            cy="78"
            rx="28"
            ry="7"
            fill={leafColor}
            opacity="0.7"
          />

          {/* Outer petals */}
          {OUTER_ANGLES.map((angle, i) => (
            <Ellipse
              key={`outer-${i}`}
              cx="50"
              cy="48"
              rx="8"
              ry="28"
              fill={colors.outer}
              transform={`rotate(${angle} 50 65)`}
            />
          ))}

          {/* Middle petals */}
          {MID_ANGLES.map((angle, i) => (
            <Ellipse
              key={`mid-${i}`}
              cx="50"
              cy="45"
              rx="7"
              ry="24"
              fill={colors.mid}
              transform={`rotate(${angle} 50 62)`}
            />
          ))}

          {/* Inner petals */}
          {INNER_ANGLES.map((angle, i) => (
            <Ellipse
              key={`inner-${i}`}
              cx="50"
              cy="42"
              rx="6"
              ry="20"
              fill={colors.inner}
              transform={`rotate(${angle} 50 58)`}
            />
          ))}

          {/* Center petals */}
          {CENTER_ANGLES.map((angle, i) => (
            <Ellipse
              key={`center-${i}`}
              cx="50"
              cy="40"
              rx="5"
              ry="16"
              fill={colors.center}
              transform={`rotate(${angle} 50 54)`}
            />
          ))}

          {/* Center */}
          <Circle cx="50" cy="45" r="10" fill={colors.core} />

          {/* Center details */}
          {DOT_ANGLES.map((angle, i) => {
            const radians = (angle * Math.PI) / 180;
            return (
              <Circle
                key={`dot-${i}`}
                cx={50 + 5 * Math.cos(radians)}
                cy={45 + 5 * Math.sin(radians)}
                r="1.5"
                fill="#d97706"
              />
            );
          })}
        </Svg>

        {/* Level number or lock overlay */}
        <View style={styles.overlay}>
          {isLocked ? (
            <Lock size={size === 'lg' ? 16 : 12} color="rgba(148,163,184,0.8)" />
          ) : (
            <Text
              style={[
                styles.levelNumber,
                { fontSize: size === 'lg' ? 14 : 11 },
                isCompleted && styles.levelNumberCompleted,
              ]}
            >
              {level}
            </Text>
          )}
        </View>
      </View>

      {/* Completed glow */}
      {isCompleted && <View style={styles.completedGlow} />}

      {/* Active glow */}
      {isActive && !isCompleted && (
        <Animated.View
          style={[
            styles.activeGlow,
            {
              transform: [{ scale: glowAnim }],
              opacity: glowAnim.interpolate({
                inputRange: [1, 1.2],
                outputRange: [0.4, 0.6],
              }),
            },
          ]}
        />
      )}
    </Pressable>
  );
}

function areEqual(prev: LotusLevelProps, next: LotusLevelProps) {
  return (
    prev.level === next.level &&
    prev.isCompleted === next.isCompleted &&
    prev.isLocked === next.isLocked &&
    prev.isActive === next.isActive &&
    prev.allowPressWhenLocked === next.allowPressWhenLocked &&
    prev.size === next.size &&
    prev.onPress === next.onPress
  );
}

export default memo(LotusLevel, areEqual);

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
  ripple: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 9999,
    backgroundColor: 'rgba(103,232,249,0.3)',
  },
  lotusContainer: {
    position: 'relative',
  },
  locked: {
    opacity: 0.5,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -6,
  },
  levelNumber: {
    fontWeight: '700',
    color: '#831843', // pink-900
  },
  levelNumberCompleted: {
    color: '#78350f', // amber-900
  },
  completedGlow: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 9999,
    backgroundColor: 'rgba(251,191,36,0.5)',
    zIndex: -1,
  },
  activeGlow: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 9999,
    backgroundColor: 'rgba(244,114,182,0.4)',
    zIndex: -1,
  },
});