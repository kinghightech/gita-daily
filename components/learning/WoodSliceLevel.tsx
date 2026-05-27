import * as Haptics from 'expo-haptics';
import { Lock } from 'lucide-react-native';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

const SLICE_SIZE = 96;

interface WoodSliceLevelProps {
  level: number;
  isCompleted: boolean;
  isLocked: boolean;
  isActive: boolean;
  onPress: (level: number) => void;
  allowPressWhenLocked?: boolean;
}

function WoodSliceLevel({
  level,
  isCompleted,
  isLocked,
  isActive,
  onPress,
  allowPressWhenLocked = false,
}: WoodSliceLevelProps) {
  const palette = isCompleted
    ? {
        bark: '#4A2A16',
        edge: '#8B5A2B',
        face: '#C98B4C',
        ring: '#F5C77D',
        text: '#FEF3C7',
        stroke: '#22C55E',
        glow: 'rgba(34,197,94,0.28)',
      }
    : isActive
      ? {
          bark: '#5A3218',
          edge: '#B86D2B',
          face: '#DDA15E',
          ring: '#FDE68A',
          text: '#3A2414',
          stroke: '#FBBF24',
          glow: 'rgba(251,191,36,0.38)',
        }
      : {
          bark: '#24160D',
          edge: '#5A3720',
          face: '#8A5A35',
          ring: 'rgba(253,230,138,0.44)',
          text: 'rgba(254,243,199,0.72)',
          stroke: '#6B4425',
          glow: 'rgba(21,128,61,0.1)',
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
          styles.sliceWrap,
          isActive && styles.activeShadow,
          isCompleted && styles.completedShadow,
          isLocked && styles.locked,
        ]}
      >
        <View style={[styles.glow, { backgroundColor: palette.glow }]} />
        <Svg width={SLICE_SIZE} height={SLICE_SIZE} viewBox="0 0 96 96">
          <Ellipse cx={48} cy={84} rx={31} ry={7} fill="#020617" opacity={0.3} />
          <Circle cx={48} cy={45} r={39} fill={palette.bark} />
          <Circle cx={47} cy={44} r={34} fill={palette.edge} />
          <Circle cx={48} cy={45} r={29} fill={palette.face} stroke={palette.stroke} strokeWidth={2.8} />

          <Circle cx={48} cy={45} r={22} fill="none" stroke={palette.ring} strokeWidth={1.7} opacity={0.86} />
          <Circle cx={48} cy={45} r={14} fill="none" stroke={palette.ring} strokeWidth={1.35} opacity={0.72} />
          <Circle cx={48} cy={45} r={7} fill="none" stroke={palette.ring} strokeWidth={1.15} opacity={0.62} />

          <Path
            d="M 24 43 C 31 37 38 39 44 34 C 52 28 61 33 70 27"
            stroke="rgba(74,42,22,0.42)"
            strokeWidth={1.7}
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M 27 58 C 37 53 43 60 53 53 C 59 49 65 51 70 46"
            stroke="rgba(74,42,22,0.34)"
            strokeWidth={1.5}
            strokeLinecap="round"
            fill="none"
          />
          <Circle cx={35} cy={32} r={5.5} fill="#FEF3C7" opacity={isLocked ? 0.12 : 0.2} />
          <Circle cx={65} cy={62} r={6.6} fill="#3A2414" opacity={isLocked ? 0.16 : 0.12} />
        </Svg>

        <View style={styles.content}>
          {isLocked ? (
            <Lock size={16} color={palette.text} />
          ) : (
            <Text style={[styles.numberText, { color: palette.text }]} allowFontScaling={false}>
              {level}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

function areEqual(prev: WoodSliceLevelProps, next: WoodSliceLevelProps) {
  return (
    prev.level === next.level &&
    prev.isCompleted === next.isCompleted &&
    prev.isLocked === next.isLocked &&
    prev.isActive === next.isActive &&
    prev.allowPressWhenLocked === next.allowPressWhenLocked &&
    prev.onPress === next.onPress
  );
}

export default memo(WoodSliceLevel, areEqual);

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: SLICE_SIZE,
    height: SLICE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.96 }],
  },
  sliceWrap: {
    position: 'relative',
    width: SLICE_SIZE,
    height: SLICE_SIZE,
  },
  activeShadow: {
    shadowColor: '#FBBF24',
    shadowOpacity: 0.62,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  completedShadow: {
    shadowColor: '#22C55E',
    shadowOpacity: 0.44,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  locked: {
    opacity: 0.66,
  },
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SLICE_SIZE,
    height: SLICE_SIZE,
    borderRadius: SLICE_SIZE / 2,
  },
  content: {
    position: 'absolute',
    top: 32,
    left: 29,
    width: 38,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    elevation: 20,
  },
  numberText: {
    fontSize: 23,
    lineHeight: 27,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0,
    textShadowColor: 'rgba(254,243,199,0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
