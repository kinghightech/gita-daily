import * as Haptics from 'expo-haptics';
import { Lock } from 'lucide-react-native';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, Line, Path, Polygon, Rect } from 'react-native-svg';

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

  const W = 88;
  const H = 96;

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
      <View
        style={[
          styles.svgWrap,
          isActive && styles.activeShrineShadow,
          isCompleted && styles.completedShrineShadow,
          isWisdomGate && styles.gateShrineShadow,
          isLocked && styles.locked,
        ]}
      >
        <Svg width={W} height={H} viewBox="0 0 88 96">
          <Ellipse cx={44} cy={80} rx={28} ry={7} fill="#020617" opacity={0.28} />
          {(isActive || isCompleted || isWisdomGate) && (
            <>
              <Circle cx={44} cy={40} r={32} fill={isCompleted ? '#FBBF24' : '#BAE6FD'} opacity={isWisdomGate ? 0.16 : 0.11} />
              <Circle cx={44} cy={40} r={22} fill={isCompleted ? '#FDE68A' : '#F8FAFC'} opacity={isWisdomGate ? 0.14 : 0.09} />
            </>
          )}
          {/* Snow / stone ledge under the shrine */}
          <Path
            d="M 12 70 Q 20 62 30 64 Q 40 59 52 63 Q 64 62 76 70 L 70 82 L 16 82 Z"
            fill={palette.snow}
            opacity={0.95}
          />
          <Path
            d="M 16 72 Q 28 68 42 69 Q 56 68 72 72 L 68 82 L 18 82 Z"
            fill={palette.stoneDark}
            opacity={0.6}
          />

          {/* Flag pole */}
          <Line x1={44} y1={16} x2={44} y2={64} stroke={palette.stoneDark} strokeWidth={1.4} opacity={0.26} />
          {/* Pennant flag */}
          <Polygon points="44,12 64,24 58,54 44,66 30,54 24,24" fill={palette.stoneDark} opacity={0.45} />

          {/* Roof — pointed temple roof */}
          <Circle cx={44} cy={38} r={28} fill={palette.stone} stroke={palette.stoneDark} strokeWidth={3} />
          <Circle cx={44} cy={38} r={21} fill={palette.medallion} stroke={palette.medallionRing} strokeWidth={2} />
          <Polygon points="44,18 54,37 44,32 34,37" fill={palette.snow} opacity={0.9} />
          <Polygon points="30,50 39,37 44,45 51,34 61,50" fill={palette.stoneDark} opacity={0.38} />
          <Line x1={28} y1={58} x2={60} y2={58} stroke={palette.stoneDark} strokeWidth={1.2} opacity={0.28} />

          {/* Snow on roof */}
          <Rect x={30} y={62} width={28} height={7} rx={3.5} fill={palette.stoneDark} opacity={0.5} />

          {/* Body — stone block */}
          <Rect x={28} y={20} width={10} height={24} rx={5} fill="#FFFFFF" opacity={0.12} />
          {/* Body shadow band */}
          <Path d="M 61 23 Q 71 39 59 56 Q 68 38 54 18" fill={palette.stoneDark} opacity={0.18} />
          {/* Stone block lines */}
          <Line x1={31} y1={28} x2={57} y2={28} stroke={palette.stoneDark} strokeWidth={0.8} opacity={0.3} />
          <Line x1={30} y1={48} x2={58} y2={48} stroke={palette.stoneDark} strokeWidth={0.8} opacity={0.3} />

          {/* Door arch (darker recess) */}
          <Circle cx={44} cy={38} r={12} fill={palette.stoneDark} opacity={isLocked ? 0.42 : 0.18} />

          {/* Medallion — circle with number or lock */}
          <Circle
            cx={44}
            cy={38}
            r={isWisdomGate ? 14 : 12}
            fill={isLocked ? palette.stoneDark : palette.medallion}
            stroke={palette.medallionRing}
            strokeWidth={1.4}
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
  activeShrineShadow: {
    shadowColor: '#BAE6FD',
    shadowOpacity: 0.55,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },
  completedShrineShadow: {
    shadowColor: '#FBBF24',
    shadowOpacity: 0.55,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },
  gateShrineShadow: {
    shadowColor: '#FBBF24',
    shadowOpacity: 0.7,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
  },
  locked: {
    opacity: 0.6,
  },
  medallionOverlay: {
    position: 'absolute',
    top: 28,
    left: 34,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medallionOverlayGate: {
    top: 26,
    left: 32,
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
