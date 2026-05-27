import * as Haptics from 'expo-haptics';
import { Lock } from 'lucide-react-native';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

interface SunflowerLevelProps {
  level: number;
  isCompleted: boolean;
  isLocked: boolean;
  isActive: boolean;
  onPress: (level: number) => void;
  allowPressWhenLocked?: boolean;
}

const PETAL_ANGLES = Array.from({ length: 16 }, (_, index) => index * 22.5);
const INNER_PETAL_ANGLES = Array.from({ length: 8 }, (_, index) => index * 45 + 22.5);
const SEED_DOT_ANGLES = Array.from({ length: 12 }, (_, index) => index * 30);

function SunflowerLevel({
  level,
  isCompleted,
  isLocked,
  isActive,
  onPress,
  allowPressWhenLocked = false,
}: SunflowerLevelProps) {
  const palette = isCompleted
    ? {
        petalOuter: '#FDE68A',
        petalInner: '#FBBF24',
        petalAccent: '#F59E0B',
        center: '#78350F',
        centerInner: '#92400E',
        seed: '#FDE68A',
        stem: '#15803D',
        leaf: '#22C55E',
        leafShade: '#16A34A',
        text: '#FEF3C7',
        glow: 'rgba(34,197,94,0.26)',
      }
    : isActive
      ? {
          petalOuter: '#FEF08A',
          petalInner: '#FACC15',
          petalAccent: '#EAB308',
          center: '#713F12',
          centerInner: '#854D0E',
          seed: '#FEF3C7',
          stem: '#16A34A',
          leaf: '#4ADE80',
          leafShade: '#22C55E',
          text: '#FEF3C7',
          glow: 'rgba(250,204,21,0.34)',
        }
      : {
          petalOuter: '#FDE68A',
          petalInner: '#FACC15',
          petalAccent: '#D97706',
          center: '#57534E',
          centerInner: '#713F12',
          seed: '#FEF3C7',
          stem: '#15803D',
          leaf: '#22C55E',
          leafShade: '#16A34A',
          text: '#FEF3C7',
          glow: 'rgba(250,204,21,0.16)',
        };

  return (
    <Pressable
      onPress={
        isLocked && !allowPressWhenLocked
          ? undefined
          : () => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onPress(level);
            }
      }
      style={({ pressed }) => [
        styles.container,
        pressed && (!isLocked || allowPressWhenLocked) && styles.pressed,
      ]}
      disabled={isLocked && !allowPressWhenLocked}
    >
      <View
        style={[
          styles.flowerWrap,
          (isActive || isCompleted) && styles.lifted,
          isLocked && styles.locked,
        ]}
      >
        <View style={[styles.glow, { backgroundColor: palette.glow }]} />
        <Svg width={80} height={80} viewBox="0 0 80 80">
          <Path
            d="M 39 47 C 39 57 38 66 37 75"
            stroke={palette.stem}
            strokeWidth={5}
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M 39 60 C 25 54 18 60 15 70 C 27 73 36 69 39 60 Z"
            fill={palette.leaf}
          />
          <Path
            d="M 40 63 C 54 55 62 61 65 71 C 52 73 43 70 40 63 Z"
            fill={palette.leafShade}
          />
          <Ellipse cx={40} cy={74} rx={25} ry={5} fill="#064E3B" opacity={0.28} />

          {PETAL_ANGLES.map((angle, index) => (
            <Ellipse
              key={`sunflower-petal-${angle}`}
              cx={40}
              cy={18}
              rx={6.8}
              ry={15.8}
              fill={index % 2 === 0 ? palette.petalOuter : palette.petalInner}
              stroke={palette.petalAccent}
              strokeWidth={0.55}
              transform={`rotate(${angle} 40 35)`}
            />
          ))}

          {INNER_PETAL_ANGLES.map((angle) => (
            <Ellipse
              key={`sunflower-inner-petal-${angle}`}
              cx={40}
              cy={23}
              rx={5}
              ry={11.5}
              fill={palette.petalInner}
              opacity={0.96}
              transform={`rotate(${angle} 40 35)`}
            />
          ))}

          <Circle cx={40} cy={35} r={16} fill={palette.center} />
          <Circle cx={40} cy={35} r={11.5} fill={palette.centerInner} opacity={0.96} />
          {SEED_DOT_ANGLES.map((angle) => {
            const radians = (angle * Math.PI) / 180;
            return (
              <Circle
                key={`sunflower-seed-${angle}`}
                cx={40 + 7.5 * Math.cos(radians)}
                cy={35 + 7.5 * Math.sin(radians)}
                r={1.35}
                fill={palette.seed}
                opacity={0.8}
              />
            );
          })}
          <Circle cx={40} cy={35} r={3.2} fill={palette.seed} opacity={0.76} />
        </Svg>

        <View style={styles.overlay}>
          {isLocked ? (
            <Lock size={14} color="rgba(254,243,199,0.86)" />
          ) : (
            <Text style={[styles.levelNumber, { color: palette.text }]} allowFontScaling={false}>
              {level}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

function areEqual(prev: SunflowerLevelProps, next: SunflowerLevelProps) {
  return (
    prev.level === next.level &&
    prev.isCompleted === next.isCompleted &&
    prev.isLocked === next.isLocked &&
    prev.isActive === next.isActive &&
    prev.allowPressWhenLocked === next.allowPressWhenLocked &&
    prev.onPress === next.onPress
  );
}

export default memo(SunflowerLevel, areEqual);

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.96 }],
  },
  flowerWrap: {
    position: 'relative',
    width: 80,
    height: 80,
  },
  lifted: {
    shadowColor: '#FACC15',
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 5,
  },
  locked: {
    opacity: 0.74,
  },
  glow: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: 74,
    height: 74,
    borderRadius: 37,
  },
  overlay: {
    position: 'absolute',
    top: 25,
    left: 26,
    width: 28,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    elevation: 10,
  },
  levelNumber: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0,
    textShadowColor: 'rgba(68,30,10,0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
