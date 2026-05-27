import * as Haptics from 'expo-haptics';
import { Lock } from 'lucide-react-native';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

const TILE_SIZE = 80;
const DOT_ANGLES = Array.from({ length: 12 }, (_, index) => index * 30);
const PETAL_ANGLES = Array.from({ length: 8 }, (_, index) => index * 45);

interface TempleTileLevelProps {
  level: number;
  isCompleted: boolean;
  isLocked: boolean;
  isActive: boolean;
  onPress: (level: number) => void;
  allowPressWhenLocked?: boolean;
}

function TempleTileLevel({
  level,
  isCompleted,
  isLocked,
  isActive,
  onPress,
  allowPressWhenLocked = false,
}: TempleTileLevelProps) {
  const palette = isCompleted
    ? {
        rim: '#5C3A1E',
        tile: '#B9976A',
        line: '#F8E7B8',
        accent: '#22C55E',
        text: '#FEF3C7',
        glow: 'rgba(34,197,94,0.24)',
      }
    : isActive
      ? {
          rim: '#78350F',
          tile: '#B86E32',
          line: '#FFF2C2',
          accent: '#FBBF24',
          text: '#FFF7D6',
          glow: 'rgba(251,146,60,0.34)',
        }
      : {
          rim: '#4A3525',
          tile: '#8A6B45',
          line: 'rgba(255,242,194,0.5)',
          accent: '#A68153',
          text: 'rgba(254,243,199,0.72)',
          glow: 'rgba(255,214,128,0.08)',
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
          styles.tileWrap,
          isActive && styles.activeShadow,
          isCompleted && styles.completedShadow,
          isLocked && styles.locked,
        ]}
      >
        <View style={[styles.glow, { backgroundColor: palette.glow }]} />
        <Svg width={TILE_SIZE} height={TILE_SIZE} viewBox="0 0 80 80">
          <Ellipse cx={40} cy={71} rx={30} ry={6} fill="#1C1009" opacity={0.22} />

          {isActive ? (
            <>
              <Circle cx={40} cy={40} r={35} fill="#5A2B17" opacity={0.58} />
              <Circle cx={40} cy={40} r={31} fill="#9A5A2B" stroke={palette.accent} strokeWidth={1.8} opacity={0.78} />
              <Circle cx={40} cy={31} r={23} fill="#FBBF24" opacity={0.13} />
              <Path d="M 17 45 C 27 57 53 57 63 45 C 58 66 22 66 17 45 Z" fill="#7C2D12" />
              <Path d="M 24 44 C 32 50 48 50 56 44 C 51 54 29 54 24 44 Z" fill="#F59E0B" opacity={0.9} />
              <Path d="M 40 11 C 54 27 46 40 39 43 C 29 34 31 22 40 11 Z" fill="#FFF2C2" />
              <Path d="M 40 22 C 47 31 43 38 39 40 C 35 34 35 28 40 22 Z" fill="#FB923C" />
            </>
          ) : (
            <>
              <Circle cx={40} cy={40} r={35} fill={palette.rim} opacity={0.9} />
              <Circle cx={40} cy={40} r={30} fill={palette.tile} stroke={palette.accent} strokeWidth={1.8} />
              {PETAL_ANGLES.map((angle) => (
                <Ellipse
                  key={`temple-rangoli-petal-${angle}`}
                  cx={40}
                  cy={20}
                  rx={4.2}
                  ry={11.8}
                  fill={palette.line}
                  opacity={isLocked ? 0.34 : 0.62}
                  transform={`rotate(${angle} 40 40)`}
                />
              ))}
              <Circle cx={40} cy={40} r={19} fill="none" stroke={palette.line} strokeWidth={1.3} opacity={0.74} />
              <Circle cx={40} cy={40} r={9} fill="none" stroke={palette.line} strokeWidth={1.2} opacity={0.64} />
              {DOT_ANGLES.map((angle) => {
                const radians = (angle * Math.PI) / 180;
                return (
                  <Circle
                    key={`temple-rangoli-dot-${angle}`}
                    cx={40 + 25 * Math.cos(radians)}
                    cy={40 + 25 * Math.sin(radians)}
                    r={1.25}
                    fill={palette.line}
                    opacity={0.68}
                  />
                );
              })}
            </>
          )}
        </Svg>

        <View style={[styles.content, isActive && styles.activeContent]}>
          {isLocked ? (
            <Lock size={16} color={palette.text} strokeWidth={2.6} />
          ) : (
            <Text style={[styles.numberText, isActive && styles.activeNumber, { color: palette.text }]} allowFontScaling={false}>
              {level}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

function areEqual(prev: TempleTileLevelProps, next: TempleTileLevelProps) {
  return (
    prev.level === next.level &&
    prev.isCompleted === next.isCompleted &&
    prev.isLocked === next.isLocked &&
    prev.isActive === next.isActive &&
    prev.allowPressWhenLocked === next.allowPressWhenLocked &&
    prev.onPress === next.onPress
  );
}

export default memo(TempleTileLevel, areEqual);

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: TILE_SIZE,
    height: TILE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.96 }],
  },
  tileWrap: {
    position: 'relative',
    width: TILE_SIZE,
    height: TILE_SIZE,
  },
  activeShadow: {
    shadowColor: '#F59E0B',
    shadowOpacity: 0.6,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  completedShadow: {
    shadowColor: '#22C55E',
    shadowOpacity: 0.42,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  locked: {
    opacity: 0.64,
  },
  glow: {
    position: 'absolute',
    top: -8,
    left: -8,
    width: TILE_SIZE + 16,
    height: TILE_SIZE + 16,
    borderRadius: (TILE_SIZE + 16) / 2,
  },
  content: {
    position: 'absolute',
    top: 27,
    left: 0,
    width: TILE_SIZE,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    elevation: 20,
  },
  activeContent: {
    top: 53,
  },
  numberText: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0,
  },
  activeNumber: {
    fontSize: 18,
    textShadowColor: 'rgba(61,36,18,0.84)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
