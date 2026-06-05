import { GitaColors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import {
  DHARMA_COIN_EARN_METHODS,
  type DharmaCoinEarnMethod,
} from '@/lib/dharmaCoins';
import { Image } from 'expo-image';
import { BookOpen, Flame, Music, type LucideIcon } from 'lucide-react-native';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

const ICONS: Record<DharmaCoinEarnMethod['key'], LucideIcon> = {
  streak: Flame,
  prayer: Music,
  lotus_level: BookOpen,
};

type Tone = 'auto' | 'dark';

type Palette = {
  surface: string;
  border: string;
  text: string;
  subtext: string;
  muted: string;
};

/**
 * The list of ways to earn Dharma Coins, rendered as cards. Reused by the
 * Dharma Coins "ways to earn" popup (tone="auto", follows the theme) and the
 * onboarding flow (tone="dark", reads well over the dark video background).
 */
export default function DharmaCoinEarnMethods({ tone = 'auto' }: { tone?: Tone }) {
  const theme = useTheme();

  const palette: Palette = useMemo(() => {
    if (tone === 'dark') {
      return {
        surface: 'rgba(255,255,255,0.06)',
        border: 'rgba(255,255,255,0.12)',
        text: '#F8FAFC',
        subtext: 'rgba(248,250,252,0.72)',
        muted: 'rgba(248,250,252,0.5)',
      };
    }
    return {
      surface: theme.surface,
      border: theme.border,
      text: theme.text,
      subtext: theme.subtext,
      muted: theme.subtextMuted,
    };
  }, [tone, theme]);

  return (
    <View style={styles.wrap}>
      {DHARMA_COIN_EARN_METHODS.map((method) => {
        const Icon = ICONS[method.key];
        return (
          <View
            key={method.key}
            style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}
          >
            <View style={styles.iconWrap}>
              <Icon size={20} color={GitaColors.gold} strokeWidth={2} />
            </View>

            <View style={styles.body}>
              <Text style={[styles.title, { color: palette.text }]}>{method.title}</Text>
              <Text style={[styles.desc, { color: palette.subtext }]}>{method.description}</Text>
              <Text style={[styles.cadence, { color: palette.muted }]}>{method.cadence}</Text>
            </View>

            <View style={styles.amountPill}>
              <Text style={styles.amountText}>+{method.amount}</Text>
              <Image
                source={require('@/assets/images/coin.png')}
                style={styles.amountCoin}
                contentFit="contain"
                transition={0}
              />
            </View>
          </View>
        );
      })}

    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 11 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(251,191,36,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, minWidth: 0 },
  title: { fontSize: 15, fontWeight: '800', letterSpacing: 0.1 },
  desc: { fontSize: 12.5, lineHeight: 18, marginTop: 3 },
  cadence: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 5,
  },
  amountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(251,191,36,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.4)',
  },
  amountText: { color: GitaColors.gold, fontSize: 15, fontWeight: '900' },
  amountCoin: { width: 15, height: 15 },
});
