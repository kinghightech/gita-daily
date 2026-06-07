import { GitaColors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { showAppToast } from '@/lib/appToast';
import {
  SKIP_LEVEL_COST,
  fetchDharmaCoinBalance,
  skipLevelWithCoins,
  type SkipLevelPath,
  type SkipLevelReason,
} from '@/lib/dharmaCoins';
import { getCachedDharmaCoinBalance } from '@/lib/dharmaCoinOverview';
import type { Theme } from '@/theme/colors';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const COIN = require('@/assets/images/coin.png');

type Props = {
  path: SkipLevelPath;
  level: number;
  // Called after a successful skip. Usually navigates back to the path map so it
  // re-fetches progress (the level advance already happened server-side).
  onSkipped: () => void;
};

const failureMessage = (reason: SkipLevelReason, cost: number): string => {
  switch (reason) {
    case 'insufficient_coins':
      return `You don't have enough Dharma Coins. Skipping costs ${cost}.`;
    case 'cannot_skip_gate':
      return "The Wisdom Gate can't be skipped — it has to be earned.";
    case 'not_current_level':
      return "This level can't be skipped right now.";
    default:
      return 'Something went wrong. Please try again.';
  }
};

export default function SkipLevelButton({ path, level, onSkipped }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [balance, setBalance] = useState<number | null>(getCachedDharmaCoinBalance());

  const canAfford = balance == null ? true : balance >= SKIP_LEVEL_COST;

  const openModal = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBalance(getCachedDharmaCoinBalance());
    setOpen(true);
    // Refresh the real balance so the sheet always shows the live number.
    void fetchDharmaCoinBalance().then(setBalance).catch(() => {});
  };

  const close = () => {
    if (!busy) setOpen(false);
  };

  const runSkip = async () => {
    if (busy || !canAfford) return;
    setBusy(true);
    const result = await skipLevelWithCoins(path, level);
    setBusy(false);

    if (result.ok) {
      setOpen(false);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showAppToast({ title: 'Level skipped', message: `−${result.cost} Dharma Coins` });
      onSkipped();
      return;
    }

    // Keep the live balance in sync, then surface the reason in-app.
    setBalance(result.newBalance);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    showAppToast({
      title: result.reason === 'insufficient_coins' ? 'Not enough coins' : "Couldn't skip",
      message: failureMessage(result.reason, result.cost),
    });
    if (result.reason !== 'insufficient_coins') setOpen(false);
  };

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={openModal}
        hitSlop={8}
        style={styles.pill}
      >
        <Text style={styles.pillText}>Skip · {SKIP_LEVEL_COST}</Text>
        <Image source={COIN} style={styles.pillCoin} contentFit="contain" transition={0} />
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={close}
        statusBarTranslucent
      >
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={close} />
          <View style={styles.card}>
            <View style={styles.coinBadge}>
              <Image source={COIN} style={styles.cardCoin} contentFit="contain" transition={0} />
            </View>

            <Text style={styles.title}>Skip this level?</Text>
            <Text style={styles.body}>
              Spend {SKIP_LEVEL_COST} Dharma Coins to complete this level and unlock the next
              one. You won&apos;t earn the level&apos;s reward coins.
            </Text>

            <View style={styles.balanceCard}>
              <View style={styles.balanceRow}>
                <Text style={styles.balanceLabel}>Your balance</Text>
                <View style={styles.balanceValueWrap}>
                  <Text style={styles.balanceValue}>
                    {balance == null ? '—' : balance.toLocaleString()}
                  </Text>
                  <Image source={COIN} style={styles.rowCoin} contentFit="contain" transition={0} />
                </View>
              </View>
              {canAfford && balance != null && (
                <View style={[styles.balanceRow, styles.balanceRowLast]}>
                  <Text style={styles.balanceLabel}>After skip</Text>
                  <View style={styles.balanceValueWrap}>
                    <Text style={styles.balanceValue}>
                      {(balance - SKIP_LEVEL_COST).toLocaleString()}
                    </Text>
                    <Image source={COIN} style={styles.rowCoin} contentFit="contain" transition={0} />
                  </View>
                </View>
              )}
            </View>

            {!canAfford && (
              <Text style={styles.warning}>
                You need {SKIP_LEVEL_COST} coins to skip. Keep your streak and pass levels to
                earn more.
              </Text>
            )}

            <View style={styles.actions}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={close}
                disabled={busy}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => void runSkip()}
                disabled={busy || !canAfford}
                style={[styles.confirmBtn, (busy || !canAfford) && styles.confirmBtnDisabled]}
              >
                {busy ? (
                  <ActivityIndicator size="small" color="#0F172A" />
                ) : (
                  <View style={styles.confirmInner}>
                    <Text style={styles.confirmText}>Skip · {SKIP_LEVEL_COST}</Text>
                    <Image source={COIN} style={styles.confirmCoin} contentFit="contain" transition={0} />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    // ── Header pill (trigger) ────────────────────────────────────────────────
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      height: 36,
      paddingHorizontal: 12,
      borderRadius: 999,
      backgroundColor: 'rgba(251,191,36,0.12)',
      borderWidth: 1,
      borderColor: 'rgba(251,191,36,0.34)',
    },
    pillText: {
      color: GitaColors.gold,
      fontSize: 14,
      fontWeight: '800',
      letterSpacing: 0.2,
    },
    pillCoin: {
      width: 22,
      height: 22,
    },

    // ── Confirm modal ────────────────────────────────────────────────────────
    overlay: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 28,
      backgroundColor: 'rgba(0,0,0,0.6)',
    },
    card: {
      width: '100%',
      maxWidth: 380,
      backgroundColor: theme.background,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 24,
      paddingTop: 24,
      paddingBottom: 20,
      alignItems: 'center',
    },
    coinBadge: {
      width: 76,
      height: 76,
      borderRadius: 38,
      backgroundColor: 'rgba(251,191,36,0.1)',
      borderWidth: 1,
      borderColor: 'rgba(251,191,36,0.3)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    cardCoin: {
      width: 46,
      height: 46,
    },
    title: {
      color: theme.text,
      fontSize: 22,
      fontWeight: '900',
      textAlign: 'center',
      marginBottom: 8,
    },
    body: {
      color: theme.subtext,
      fontSize: 14.5,
      lineHeight: 21,
      textAlign: 'center',
      marginBottom: 18,
    },
    balanceCard: {
      width: '100%',
      backgroundColor: theme.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 16,
      marginBottom: 14,
    },
    balanceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 13,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.border,
    },
    balanceRowLast: {
      borderBottomWidth: 0,
    },
    balanceLabel: {
      color: theme.subtext,
      fontSize: 14,
      fontWeight: '600',
    },
    balanceValueWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    balanceValue: {
      color: theme.text,
      fontSize: 16,
      fontWeight: '800',
    },
    rowCoin: {
      width: 20,
      height: 20,
    },
    warning: {
      color: '#FCA5A5',
      fontSize: 13,
      lineHeight: 19,
      textAlign: 'center',
      marginBottom: 14,
    },
    actions: {
      flexDirection: 'row',
      gap: 12,
      width: '100%',
      marginTop: 4,
    },
    cancelBtn: {
      flex: 1,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: theme.border,
      paddingVertical: 15,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelText: {
      color: theme.subtext,
      fontSize: 16,
      fontWeight: '700',
    },
    confirmBtn: {
      flex: 1.4,
      borderRadius: 14,
      backgroundColor: GitaColors.gold,
      paddingVertical: 15,
      alignItems: 'center',
      justifyContent: 'center',
    },
    confirmBtnDisabled: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    confirmInner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    confirmText: {
      color: '#0F172A',
      fontSize: 16,
      fontWeight: '900',
      letterSpacing: 0.2,
    },
    confirmCoin: {
      width: 20,
      height: 20,
    },
  });
