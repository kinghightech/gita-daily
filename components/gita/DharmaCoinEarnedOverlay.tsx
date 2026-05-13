import { APP_TOAST_EVENT, type AppToastPayload } from '@/lib/appToast';
import {
  DHARMA_COINS_EARNED_EVENT,
  type DharmaCoinEarnedPayload,
} from '@/lib/dharmaCoins';
import { useCallback, useEffect, useState } from 'react';
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

type CoinToastState = DharmaCoinEarnedPayload & { id: number; kind: 'coins' };
type MessageToastState = AppToastPayload & { id: number; kind: 'message' };
type ToastState = CoinToastState | MessageToastState | null;

export default function DharmaCoinEarnedOverlay() {
  const [toast, setToast] = useState<ToastState>(null);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);
  const scale = useSharedValue(0.9);

  const showToast = useCallback((nextToast: ToastState) => {
    if (!nextToast) return;

    setToast(nextToast);

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
  }, [opacity, scale, translateY]);

  useEffect(() => {
    const coinSub = DeviceEventEmitter.addListener(
      DHARMA_COINS_EARNED_EVENT,
      (payload: DharmaCoinEarnedPayload) => {
        if (!payload || payload.amount <= 0) return;

        showToast({ ...payload, id: Date.now(), kind: 'coins' });
      }
    );

    const messageSub = DeviceEventEmitter.addListener(
      APP_TOAST_EVENT,
      (payload: AppToastPayload) => {
        if (!payload?.title) return;
        showToast({ ...payload, id: Date.now(), kind: 'message' });
      }
    );

    return () => {
      coinSub.remove();
      messageSub.remove();
    };
  }, [showToast]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  if (!toast) return null;

  const showMultiplier = toast.kind === 'coins' && toast.multiplier > 1;

  return (
    <View pointerEvents="none" style={styles.overlay}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <Animated.View style={[styles.toast, animatedStyle]}>
          {toast.kind === 'coins' ? (
            <>
              <Image
                source={require('@/assets/images/coin.png')}
                style={styles.coin}
                resizeMode="contain"
              />
              <Text style={styles.amountText}>+{toast.amount} Dharma Coins</Text>
            </>
          ) : (
            <View style={styles.messageWrap}>
              <Text style={styles.messageTitle}>{toast.title}</Text>
              {toast.message ? <Text style={styles.messageText}>{toast.message}</Text> : null}
            </View>
          )}
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
    maxWidth: '92%',
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
  messageWrap: {
    flexShrink: 1,
  },
  messageTitle: {
    color: '#FBBF24',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  messageText: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
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
