import LotusLoader from '@/components/ui/LotusLoader';
import { Fonts, GitaColors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import {
    fetchDharmaCoinOverview,
    getCachedDharmaCoinOverview,
    updateCachedDharmaCoinBalance,
} from '@/lib/dharmaCoinOverview';
import {
    DHARMA_COINS_UPDATED_EVENT,
    DharmaCoinTransaction,
    streakMultiplier,
    streakTierLabel,
    transactionDisplayName,
} from '@/lib/dharmaCoins';
import type { Theme } from '@/theme/colors';
import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import { ArrowLeft, Eye, Flame, X } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    DeviceEventEmitter,
    FlatList,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import DharmaCoinEarnMethods from '@/components/gita/DharmaCoinEarnMethods';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const TIERS = [
  { min: 0, label: 'Beginner', multiplier: 1.0 },
  { min: 7, label: 'Steadfast', multiplier: 1.25 },
  { min: 30, label: 'Devoted', multiplier: 1.5 },
  { min: 90, label: 'Master', multiplier: 2.0 },
];

const formatRelative = (iso: string): string => {
  try {
    const then = new Date(iso).getTime();
    const now = Date.now();
    const diff = Math.max(0, Math.floor((now - then) / 1000));
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(iso).toLocaleDateString();
  } catch {
    return '';
  }
};

export default function DharmaCoinsScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const initialSnapshot = useRef(getCachedDharmaCoinOverview()).current;
  const hasInitialOverview = initialSnapshot?.hasFullOverview === true;
  const skipNextFocusRefresh = useRef(true);

  const [balance, setBalance] = useState(initialSnapshot?.balance ?? 0);
  const [streak, setStreak] = useState(hasInitialOverview ? initialSnapshot.streak : 0);
  const [transactions, setTransactions] = useState<DharmaCoinTransaction[]>(
    hasInitialOverview ? initialSnapshot.transactions : []
  );
  const [isLoading, setIsLoading] = useState(!hasInitialOverview);
  const [showEarnInfo, setShowEarnInfo] = useState(false);

  const applySnapshot = useCallback((snapshot: {
    balance: number;
    streak: number;
    transactions: DharmaCoinTransaction[];
  }) => {
    setBalance(snapshot.balance);
    setStreak(snapshot.streak);
    setTransactions(snapshot.transactions);
  }, []);

  const refresh = useCallback(async (options?: { showLoader?: boolean }) => {
    if (options?.showLoader) {
      setIsLoading(true);
    }

    const snapshot = await fetchDharmaCoinOverview(100);
    applySnapshot(snapshot);
    setIsLoading(false);
  }, [applySnapshot]);

  useEffect(() => {
    void refresh({ showLoader: !hasInitialOverview });
  }, [hasInitialOverview, refresh]);

  useFocusEffect(
    useCallback(() => {
      if (skipNextFocusRefresh.current) {
        skipNextFocusRefresh.current = false;
        return () => {};
      }

      void refresh();
      return () => {};
    }, [refresh])
  );

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(DHARMA_COINS_UPDATED_EVENT, (total?: number) => {
      if (typeof total === 'number') {
        updateCachedDharmaCoinBalance(total);
        setBalance(total);
      }
      void refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  const currentMultiplier = streakMultiplier(streak);
  const currentTierLabel = streakTierLabel(streak);

  const nextTier = TIERS.find((t) => t.min > streak);
  const daysToNextTier = nextTier ? nextTier.min - streak : 0;

  const Header = (
    <View>
      <Animated.View entering={FadeIn} style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <Image
            source={require('@/assets/images/coin.png')}
            style={styles.heroCoin}
            contentFit="contain"
            transition={0}
          />
          <View style={styles.heroLabels}>
            <Text style={styles.heroLabel}>TOTAL DHARMA COINS</Text>
            {isLoading ? (
              <View style={styles.heroLoader}>
                <LotusLoader size={42} color={GitaColors.gold} strokeWidth={2.6} duration={1200} />
              </View>
            ) : (
              <Text style={styles.heroValue}>{balance.toLocaleString()}</Text>
            )}
          </View>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(80)} style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <X size={14} color={GitaColors.gold} />
            <Text style={styles.statLabel}>MULTIPLIER</Text>
          </View>
          <Text style={styles.statValue}>{currentMultiplier.toFixed(2)}×</Text>
          <Text style={styles.statSub}>{currentTierLabel} tier</Text>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Flame size={14} color={GitaColors.gold} />
            <Text style={styles.statLabel}>STREAK</Text>
          </View>
          <Text style={styles.statValue}>{streak} days</Text>
          <Text style={styles.statSub}>
            {nextTier
              ? `${daysToNextTier} day${daysToNextTier === 1 ? '' : 's'} to ${nextTier.multiplier}×`
              : 'Max tier reached'}
          </Text>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(140)} style={styles.tiersCard}>
        <Text style={styles.tiersHeader}>STREAK MULTIPLIER TIERS</Text>
        {TIERS.map((tier) => {
          const isActive = streak >= tier.min && (!TIERS.find((t) => t.min > tier.min && streak >= t.min));
          return (
            <View
              key={tier.label}
              style={[
                styles.tierRow,
                isActive && styles.tierRowActive,
              ]}
            >
              <View style={styles.tierLeft}>
                <Text style={[styles.tierLabel, isActive && styles.tierLabelActive]}>
                  {tier.label}
                </Text>
                <Text style={styles.tierRange}>
                  {tier.min === 0
                    ? 'Days 1–6'
                    : tier.min === 7
                    ? 'Days 7–29'
                    : tier.min === 30
                    ? 'Days 30–89'
                    : 'Days 90+'}
                </Text>
              </View>
              <Text style={[styles.tierMultiplier, isActive && styles.tierMultiplierActive]}>
                {tier.multiplier}×
              </Text>
            </View>
          );
        })}
      </Animated.View>

      <View style={styles.historyHeader}>
        <Text style={styles.historyHeaderText}>HISTORY</Text>
        <Text style={styles.historySubtext}>
          {transactions.length} {transactions.length === 1 ? 'transaction' : 'transactions'}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.navBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <ArrowLeft size={22} color={theme.text} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Dharma Coins</Text>
          <TouchableOpacity
            onPress={() => setShowEarnInfo(true)}
            style={styles.backBtn}
            activeOpacity={0.7}
            accessibilityLabel="Ways to earn Dharma Coins"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Eye size={20} color={GitaColors.gold} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={Header}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.txRow}>
              <View style={styles.txLeft}>
                <View>
                  <Text style={styles.txSource}>{transactionDisplayName(item.source, item.source_ref)}</Text>
                  <Text style={styles.txMeta}>
                    {formatRelative(item.created_at)}
                    {item.multiplier > 1 ? `  •  ${Number(item.multiplier).toFixed(2)}×` : ''}
                  </Text>
                </View>
              </View>
              <View style={styles.txRight}>
                <Text
                  style={[
                    styles.txAmount,
                    item.amount < 0 && styles.txAmountNegative,
                  ]}
                >
                  {item.amount > 0 ? '+' : ''}
                  {item.amount}
                </Text>
                <Image
                  source={require('@/assets/images/coin.png')}
                  style={styles.txCoinRight}
                  contentFit="contain"
                  transition={0}
                />
              </View>
            </View>
          )}
          ListEmptyComponent={
            !isLoading ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No transactions yet</Text>
                <Text style={styles.emptySub}>
                  Complete a daily streak, prayer, or Lotus Path level to earn your first coins.
                </Text>
              </View>
            ) : null
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </SafeAreaView>

      <Modal
        visible={showEarnInfo}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEarnInfo(false)}
        statusBarTranslucent
      >
        <View style={styles.earnOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowEarnInfo(false)} />
          <SafeAreaView edges={['bottom']} style={styles.earnSheet}>
            <View style={styles.earnHandle} />
            <View style={styles.earnHeader}>
              <View style={styles.earnHeaderLeft}>
                <Image
                  source={require('@/assets/images/coin.png')}
                  style={styles.earnHeaderCoin}
                  contentFit="contain"
                  transition={0}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.earnTitle}>Ways to Earn</Text>
                  <Text style={styles.earnSubtitle}>
                    Collect Dharma Coins to unlock rewards (coming soon).
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowEarnInfo(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.7}
                style={styles.earnClose}
              >
                <X size={20} color={theme.subtext} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.earnScroll}
              contentContainerStyle={styles.earnScrollContent}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <DharmaCoinEarnMethods tone="auto" />
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    navBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 12,
    },
    backBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surface,
    },
    navTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: theme.text,
      letterSpacing: 0.2,
    },
    listContent: {
      paddingHorizontal: 16,
      paddingBottom: 48,
    },
    heroCard: {
      borderRadius: 22,
      padding: 22,
      backgroundColor: 'rgba(251,191,36,0.10)',
      borderWidth: 1,
      borderColor: 'rgba(251,191,36,0.32)',
      marginBottom: 14,
    },
    heroTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    heroCoin: {
      width: 60,
      height: 60,
      transform: [{ scale: 1.6 }],
      marginLeft: 10,
      marginRight: 6,
    },
    heroLabels: {
      flex: 1,
    },
    heroLabel: {
      color: GitaColors.goldMuted,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1.8,
      marginBottom: 4,
    },
    heroValue: {
      color: GitaColors.gold,
      fontSize: 38,
      fontWeight: '900',
      lineHeight: 42,
      fontFamily: Fonts.serif,
    },
    heroLoader: {
      height: 42,
      justifyContent: 'center',
      alignItems: 'flex-start',
    },
    statsRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 14,
    },
    statCard: {
      flex: 1,
      backgroundColor: theme.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 14,
    },
    statHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 8,
    },
    statLabel: {
      color: theme.subtextMuted,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.4,
    },
    statValue: {
      color: theme.text,
      fontSize: 26,
      fontWeight: '900',
      fontFamily: Fonts.serif,
    },
    statSub: {
      color: theme.subtext,
      fontSize: 12,
      marginTop: 4,
    },
    tiersCard: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 14,
      marginBottom: 18,
    },
    tiersHeader: {
      color: theme.subtextMuted,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1.4,
      marginBottom: 10,
    },
    tierRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 12,
    },
    tierRowActive: {
      backgroundColor: 'rgba(251,191,36,0.08)',
      borderWidth: 1,
      borderColor: 'rgba(251,191,36,0.35)',
    },
    tierLeft: {
      gap: 2,
    },
    tierLabel: {
      color: theme.text,
      fontSize: 14,
      fontWeight: '700',
    },
    tierLabelActive: {
      color: GitaColors.gold,
    },
    tierRange: {
      color: theme.subtext,
      fontSize: 12,
    },
    tierMultiplier: {
      color: theme.subtext,
      fontSize: 16,
      fontWeight: '800',
    },
    tierMultiplierActive: {
      color: GitaColors.gold,
    },
    historyHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      paddingHorizontal: 4,
      marginBottom: 8,
    },
    historyHeaderText: {
      color: theme.subtextMuted,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1.6,
    },
    historySubtext: {
      color: theme.subtext,
      fontSize: 12,
    },
    txRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      paddingHorizontal: 4,
    },
    txLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    txRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    txCoinRight: {
      width: 24,
      height: 24,
    },
    txSource: {
      color: theme.text,
      fontSize: 15,
      fontWeight: '700',
    },
    txMeta: {
      color: theme.subtext,
      fontSize: 12,
      marginTop: 2,
    },
    txAmount: {
      color: GitaColors.gold,
      fontSize: 17,
      fontWeight: '800',
    },
    txAmountNegative: {
      color: '#EF4444',
    },
    separator: {
      height: 1,
      backgroundColor: theme.border,
    },
    emptyState: {
      paddingVertical: 40,
      alignItems: 'center',
    },
    emptyTitle: {
      color: theme.text,
      fontSize: 17,
      fontWeight: '700',
      marginBottom: 6,
    },
    emptySub: {
      color: theme.subtext,
      fontSize: 14,
      textAlign: 'center',
      paddingHorizontal: 24,
      lineHeight: 20,
    },
    earnOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    earnSheet: {
      backgroundColor: theme.background,
      borderTopLeftRadius: 26,
      borderTopRightRadius: 26,
      paddingHorizontal: 20,
      paddingTop: 10,
      maxHeight: '86%',
      borderWidth: 1,
      borderColor: theme.border,
      borderBottomWidth: 0,
    },
    earnHandle: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.subtextMuted,
      opacity: 0.5,
      marginBottom: 16,
    },
    earnHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      marginBottom: 16,
    },
    earnHeaderLeft: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    earnHeaderCoin: {
      width: 40,
      height: 40,
    },
    earnTitle: {
      color: theme.text,
      fontSize: 20,
      fontWeight: '900',
      letterSpacing: 0.2,
    },
    earnSubtitle: {
      color: theme.subtext,
      fontSize: 12.5,
      lineHeight: 17,
      marginTop: 2,
    },
    earnClose: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    earnScroll: {
      flexGrow: 0,
    },
    earnScrollContent: {
      paddingBottom: 16,
    },
  });
