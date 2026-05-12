import LotusLoader from '@/components/ui/LotusLoader';
import { useTheme } from '@/hooks/useTheme';
import {
    DHARMA_COINS_UPDATED_EVENT,
    fetchDharmaCoinBalance,
} from '@/lib/dharmaCoins';
import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { DeviceEventEmitter, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

type Props = {
  compact?: boolean;
};

export default function DharmaCoinPill({ compact = false }: Props) {
  const theme = useTheme();
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const scale = useSharedValue(1);

  const refresh = useCallback(async () => {
    const value = await fetchDharmaCoinBalance();
    setBalance(value);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
      return () => {};
    }, [refresh])
  );

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(DHARMA_COINS_UPDATED_EVENT, (total: number) => {
      setBalance(total);
      scale.value = withSequence(
        withTiming(1.18, { duration: 180 }),
        withTiming(1, { duration: 220 })
      );
    });
    return () => sub.remove();
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => router.push('/dharma-coins')}
        style={[
          styles.pill,
          compact && styles.pillCompact,
        ]}
      >
        <View style={[styles.coinWrap, compact && styles.coinWrapCompact]}>
          <Image
            source={require('@/assets/images/coin.png')}
            style={[styles.coin, compact && styles.coinCompact]}
            contentFit="contain"
            transition={0}
          />
        </View>
        {isLoading ? (
          <View style={styles.loaderWrap}>
            <LotusLoader size={18} color={theme.primary} strokeWidth={2.2} duration={1100} />
          </View>
        ) : (
          <Text style={[styles.value, { color: theme.primary }]} numberOfLines={1}>
            {balance.toLocaleString()}
          </Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pillCompact: {
    gap: 6,
  },
  coinWrap: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinWrapCompact: {
    width: 24,
    height: 24,
  },
  coin: {
    width: 34,
    height: 34,
  },
  coinCompact: {
    width: 24,
    height: 24,
  },
  value: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
    minWidth: 18,
  },
  loaderWrap: {
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
