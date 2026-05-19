import * as Haptics from 'expo-haptics';
import { Lock } from 'lucide-react-native';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Polygon, Rect, Line, Circle } from 'react-native-svg';

interface MountainShrineProps {
  level: number;
  isCompleted: boolean;
  isLocked: boolean;
  isActive: boolean;
  isWisdomGate?: boolean;
  onPress: (level: number) => void;
  allowPressWhenLocked?: boolean;
}

// A small stone shrine / temple — roof + body + lock-or-number medallion + pennant flag.
// Sits on a snowy stone ledge. Inspired by mountain temple silhouettes.
function MountainShrine({
  level,
  isCompleted,
  isLocked,
  isActive,
  isWisdomGate = false,
  onPress,
  allowPressWhenLocked = false,
}: MountainShrineProps) {
  const palette = isCompleted
    ? {
        stone: '#FBBF24',
        stoneDark: '#B45309',
        roof: '#F59E0B',
        roofShadow: '#92400E',
        snow: '#FEF3C7',
        flag: '#FBBF24',
        medallion: '#FDE68A',
        medallionRing: '#F59E0B',
        numberText: '#78350F',
      }
    : isActive
    ? {
        stone: '#94A3B8',
        stoneDark: '#475569',
        roof: '#CBD5E1',
        roofShadow: '#334155',
        snow: '#FFFFFF',
        flag: '#FBBF24',
        medallion: '#FBBF24',
        medallionRing: '#F59E0B',
        numberText: '#1E293B',
      }
    : {
        stone: '#64748B',
        stoneDark: '#334155',
        roof: '#475569',
        roofShadow: '#1E293B',
        snow: 'rgba(255,255,255,0.85)',
        flag: '#64748B',
        medallion: '#334155',
        medallionRing: '#1E293B',
        numberText: '#94A3B8',
      };

  const W = 80;
  const H = 88;

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
        { width: W, height: H },
        pressed && (!isLocked || allowPressWhenLocked) && styles.pressed,
      ]}
      disabled={isLocked && !allowPressWhenLocked}
    >
      <View style={[styles.svgWrap, isLocked && styles.locked]}>
        <Svg width={W} height={H} viewBox="0 0 80 88">
          {/* Snow / stone ledge under the shrine */}
          <Path
            d="M 8 80 Q 14 72 22 73 Q 30 68 42 70 Q 56 68 64 73 Q 72 74 76 82 L 72 86 L 10 86 Z"
            fill={palette.snow}
            opacity={0.95}
          />
          <Path
            d="M 10 82 Q 18 78 26 79 Q 38 76 50 78 Q 60 78 70 82 L 68 86 L 12 86 Z"
            fill={palette.stoneDark}
            opacity={0.6}
          />

          {/* Flag pole */}
          <Line
            x1={isWisdomGate ? 40 : 31}
            y1={isWisdomGate ? 4 : 8}
            x2={isWisdomGate ? 40 : 31}
            y2={28}
            stroke={palette.stoneDark}
            strokeWidth={1.2}
          />
          {/* Pennant flag */}
          <Polygon
            points={
              isWisdomGate
                ? '40,4 52,8 40,12'
                : '31,8 42,12 31,16'
            }
            fill={palette.flag}
          />

          {/* Roof — pointed temple roof */}
          {isWisdomGate ? (
            // Wider, taller, dual-tiered roof for the Wisdom Gate
            <>
              <Polygon points="14,30 40,12 66,30 60,32 20,32" fill={palette.roof} />
              <Polygon points="20,32 40,20 60,32 56,34 24,34" fill={palette.roofShadow} opacity={0.6} />
              <Rect x={14} y={30} width={52} height={4} fill={palette.roofShadow} />
            </>
          ) : (
            <>
              <Polygon points="14,34 40,14 66,34" fill={palette.roof} />
              <Polygon points="20,34 40,22 60,34" fill={palette.roofShadow} opacity={0.55} />
              <Rect x={14} y={33} width={52} height={3.5} fill={palette.roofShadow} />
            </>
          )}

          {/* Snow on roof */}
          <Path
            d={
              isWisdomGate
                ? 'M 18 30 Q 30 26 40 28 Q 50 26 62 30 L 60 32 L 20 32 Z'
                : 'M 18 34 Q 30 30 40 32 Q 50 30 62 34 L 60 35 L 20 35 Z'
            }
            fill={palette.snow}
            opacity={0.9}
          />

          {/* Body — stone block */}
          <Rect
            x={18}
            y={isWisdomGate ? 34 : 36}
            width={44}
            height={isWisdomGate ? 44 : 40}
            rx={3}
            fill={palette.stone}
          />
          {/* Body shadow band */}
          <Rect
            x={18}
            y={isWisdomGate ? 70 : 70}
            width={44}
            height={isWisdomGate ? 8 : 6}
            fill={palette.stoneDark}
            opacity={0.55}
          />
          {/* Stone block lines */}
          <Line x1={18} y1={isWisdomGate ? 50 : 52} x2={62} y2={isWisdomGate ? 50 : 52} stroke={palette.stoneDark} strokeWidth={0.6} opacity={0.45} />
          <Line x1={40} y1={isWisdomGate ? 34 : 36} x2={40} y2={isWisdomGate ? 50 : 52} stroke={palette.stoneDark} strokeWidth={0.6} opacity={0.45} />
          <Line x1={28} y1={isWisdomGate ? 50 : 52} x2={28} y2={isWisdomGate ? 64 : 64} stroke={palette.stoneDark} strokeWidth={0.6} opacity={0.45} />
          <Line x1={52} y1={isWisdomGate ? 50 : 52} x2={52} y2={isWisdomGate ? 64 : 64} stroke={palette.stoneDark} strokeWidth={0.6} opacity={0.45} />

          {/* Door arch (darker recess) */}
          <Path
            d={
              isWisdomGate
                ? 'M 32 78 L 32 56 Q 32 46 40 46 Q 48 46 48 56 L 48 78 Z'
                : 'M 33 76 L 33 58 Q 33 50 40 50 Q 47 50 47 58 L 47 76 Z'
            }
            fill={palette.stoneDark}
            opacity={0.6}
          />

          {/* Medallion — circle with number or lock */}
          <Circle
            cx={40}
            cy={isWisdomGate ? 60 : 60}
            r={isWisdomGate ? 11 : 9.5}
            fill={palette.medallion}
            stroke={palette.medallionRing}
            strokeWidth={1.2}
          />
        </Svg>

        {/* Number / lock overlay positioned over medallion */}
        <View style={[styles.medallionOverlay, isWisdomGate && styles.medallionOverlayGate]}>
          {isLocked ? (
            <Lock size={isWisdomGate ? 14 : 12} color={palette.numberText} />
          ) : isWisdomGate ? (
            <Text style={[styles.gateGlyph, { color: palette.numberText }]}>ॐ</Text>
          ) : (
            <Text style={[styles.numberText, { color: palette.numberText }]}>{level}</Text>
          )}
        </View>
      </View>

      {isCompleted && <View style={styles.completedGlow} />}
      {isActive && !isCompleted && <View style={styles.activeGlow} />}
    </Pressable>
  );
}

function areEqual(prev: MountainShrineProps, next: MountainShrineProps) {
  return (
    prev.level === next.level &&
    prev.isCompleted === next.isCompleted &&
    prev.isLocked === next.isLocked &&
    prev.isActive === next.isActive &&
    prev.isWisdomGate === next.isWisdomGate &&
    prev.allowPressWhenLocked === next.allowPressWhenLocked &&
    prev.onPress === next.onPress
  );
}

export default memo(MountainShrine, areEqual);

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.95 }],
  },
  svgWrap: {
    position: 'relative',
  },
  locked: {
    opacity: 0.6,
  },
  medallionOverlay: {
    position: 'absolute',
    top: 50,
    left: 30,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medallionOverlayGate: {
    top: 49,
    left: 28,
    width: 24,
    height: 24,
  },
  numberText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0,
  },
  gateGlyph: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0,
  },
  completedGlow: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 9999,
    backgroundColor: 'rgba(251,191,36,0.35)',
    zIndex: -1,
  },
  activeGlow: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 9999,
    backgroundColor: 'rgba(186,230,253,0.30)',
    zIndex: -1,
  },
});
