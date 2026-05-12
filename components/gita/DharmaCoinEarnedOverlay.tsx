import {
  DHARMA_COINS_EARNED_EVENT,
  type DharmaCoinEarnedPayload,
} from '@/lib/dharmaCoins';
import { useEffect, useState } from 'react';
import { DeviceEventEmitter, Image, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

type ToastState = (DharmaCoinEarnedPayload & { id: number }) | null;

export default function DharmaCoinEarnedOverlay() {
  const [toast, setToast] = useState<ToastState>(null);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(
      DHARMA_COINS_EARNED_EVENT,
      (payload: DharmaCoinEarnedPayload) => {
        if (!payload || payload.amount <= 0) return;

        setToast({ ...payload, id: Date.now() });

        opacity.value = 0;
        translateY.value = 12;
        scale.value = 0.9;

        opacity.value = withSequence(
          withTiming(1, { duration: 240, easing: Easing.out(Easing.cubic) }),
          withDelay(1600, withTiming(0, { duration: 320 }, (finished) => {
            if (finished) {
              runOnJS(setToast)(null);
            }
          }))
        );
        translateY.value = withTiming(0, { duration: 280, easing: Easing.out(Easing.cubic) });
        scale.value = withSequence(
          withTiming(1.06, { duration: 260, easing: Easing.out(Easing.cubic) }),
          withTiming(1, { duration: 220 })
        );
      }
    );
    return () => sub.remove();
  }, [opacity, scale, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  if (!toast) return null;

  const showMultiplier = toast.multiplier > 1;

  return (
    <View pointerEvents="none" style={styles.overlay}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <Animated.View style={[styles.toast, animatedStyle]}>
          <Image
            source={require('@/assets/images/coin.png')}
            style={styles.coin}
            resizeMode="contain"
          />
          <Text style={styles.amountText}>+{toast.amount} Dharma Coins</Text>
          {showMultiplier && (
            <View style={styles.multiplierChip}>
              <Text style={styles.multiplierText}>{toast.multiplier.toFixed(2)}x</Text>
            </View>
          )}
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
  safe: {
    flex: 1,
    alignItems: 'center',
  },
  toast: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: 'rgba(15,23,42,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.55)',
    shadowColor: '#FBBF24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 12,
  },
  coin: {
    width: 24,
    height: 24,
  },
  amountText: {
    color: '#FBBF24',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  multiplierChip: {
    marginLeft: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(251,191,36,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.45)',
  },
  multiplierText: {
    color: '#FBBF24',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
