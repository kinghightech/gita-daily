import * as Haptics from 'expo-haptics';
import { Lock } from 'lucide-react-native';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse } from 'react-native-svg';

interface MountainShrineProps {
  level: number;
  side?: 'left' | 'right';
  isCompleted: boolean;
  isLocked: boolean;
  isActive: boolean;
  isWisdomGate?: boolean;
  onPress: (level: number) => void;
  allowPressWhenLocked?: boolean;
}

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
        glow: '#22C55E',
        ring: '#BBF7D0',
        face: '#F8FAFC',
        inner: '#DCFCE7',
        text: '#14532D',
        stroke: '#22C55E',
      }
    : isActive
    ? {
        glow: '#BAE6FD',
        ring: '#F8FAFC',
        face: '#E0F2FE',
        inner: '#F8FAFC',
        text: '#0F172A',
        stroke: '#38BDF8',
      }
    : {
        glow: '#64748B',
        ring: '#E2E8F0',
        face: '#CBD5E1',
        inner: '#F8FAFC',
        text: '#0F172A',
        stroke: '#64748B',
      };

  const W = 80;
  const H = 80;

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
          styles.marker,
          isActive && styles.activeShadow,
          isCompleted && styles.completedShadow,
          isWisdomGate && styles.gateShadow,
          isLocked && styles.locked,
        ]}
      >
        <Svg width={W} height={H} viewBox="0 0 80 80">
          <Ellipse cx={40} cy={70} rx={25} ry={6} fill="#020617" opacity={0.22} />
          {(isActive || isCompleted || isWisdomGate) && (
            <Circle cx={40} cy={36} r={36} fill={palette.glow} opacity={isWisdomGate ? 0.22 : 0.18} />
          )}
          <Circle cx={40} cy={36} r={31} fill={palette.ring} opacity={isLocked ? 0.74 : 0.98} />
          <Circle cx={40} cy={36} r={25} fill={palette.face} stroke={palette.stroke} strokeWidth={2.4} />
          <Circle cx={32} cy={27} r={7} fill="#FFFFFF" opacity={isLocked ? 0.42 : 0.62} />
          <Circle cx={49} cy={47} r={10} fill="#BAE6FD" opacity={isLocked ? 0.22 : 0.3} />
          <Circle cx={40} cy={36} r={13} fill={palette.inner} opacity={0.92} />
        </Svg>

        <View style={styles.content}>
          {isLocked ? (
            <Lock size={16} color={palette.text} />
          ) : isWisdomGate ? (
            <Text style={[styles.gateText, { color: palette.text }]}>✦</Text>
          ) : (
            <Text
              style={[styles.numberText, { color: palette.text }]}
              allowFontScaling={false}
            >
              {level}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

function areEqual(prev: MountainShrineProps, next: MountainShrineProps) {
  return (
    prev.level === next.level &&
    prev.side === next.side &&
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
    opacity: 0.86,
    transform: [{ scale: 0.96 }],
  },
  marker: {
    position: 'relative',
  },
  activeShadow: {
    shadowColor: '#BAE6FD',
    shadowOpacity: 0.5,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 0 },
  },
  completedShadow: {
    shadowColor: '#FBBF24',
    shadowOpacity: 0.5,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 0 },
  },
  gateShadow: {
    shadowColor: '#FBBF24',
    shadowOpacity: 0.68,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
  },
  locked: {
    opacity: 0.72,
  },
  content: {
    position: 'absolute',
    top: 23,
    left: 23,
    width: 34,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    elevation: 20,
  },
  numberText: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 24,
    textAlign: 'center',
    textShadowColor: 'rgba(255,255,255,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  gateText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0,
  },
});
