import { supabase } from '@/lib/supabase';
import { DeviceEventEmitter } from 'react-native';

export const DHARMA_COINS_UPDATED_EVENT = 'gitaDaily.dharmaCoinsUpdated.v1';
export const DHARMA_COINS_EARNED_EVENT = 'gitaDaily.dharmaCoinsEarned.v1';

export type DharmaCoinSource =
  | 'streak'
  | 'prayer'
  | 'lotus_level'
  | 'redemption'
  | 'bonus'
  | 'world_level'
  | 'wisdom_gate';

export type DharmaCoinTransaction = {
  id: string;
  user_id: string;
  source: DharmaCoinSource;
  source_ref: string | null;
  base_amount: number;
  multiplier: number;
  amount: number;
  streak_at_award: number | null;
  earned_at_date: string;
  created_at: string;
};

export type AwardResult = {
  awarded: number;
  base: number;
  multiplier: number;
  total: number;
  reason:
    | 'awarded'
    | 'already_today_streak'
    | 'already_today_prayer'
    | 'lotus_cap_reached'
    | 'lotus_level_already_claimed'
    | 'unauthenticated'
    | 'unknown_source';
  streak: number;
};

export type DharmaCoinEarnedPayload = {
  amount: number;
  base: number;
  multiplier: number;
  source: DharmaCoinSource;
};

const getLocalTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};

export const streakMultiplier = (streak: number): number => {
  if (streak >= 90) return 2.0;
  if (streak >= 30) return 1.5;
  if (streak >= 7) return 1.25;
  return 1.0;
};

export const streakTierLabel = (streak: number): string => {
  if (streak >= 90) return 'Master';
  if (streak >= 30) return 'Devoted';
  if (streak >= 7) return 'Steadfast';
  return 'Beginner';
};

export const fetchDharmaCoinBalance = async (userId?: string): Promise<number> => {
  let uid = userId;
  if (!uid) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;
    uid = user.id;
  }

  const { data, error } = await supabase
    .from('dharma_coin_balances')
    .select('total_coins')
    .eq('user_id', uid)
    .maybeSingle();

  if (error) {
    console.warn('Failed to fetch dharma coin balance', error);
    return 0;
  }

  return data?.total_coins ?? 0;
};

export const fetchDharmaCoinTransactions = async (
  userId?: string,
  limit = 100
): Promise<DharmaCoinTransaction[]> => {
  let uid = userId;
  if (!uid) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    uid = user.id;
  }

  const { data, error } = await supabase
    .from('dharma_coin_transactions')
    .select('*')
    .eq('user_id', uid)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.warn('Failed to fetch dharma coin transactions', error);
    return [];
  }

  return (data ?? []) as DharmaCoinTransaction[];
};

export const awardDharmaCoins = async (
  source: DharmaCoinSource,
  sourceRef?: string | null
): Promise<AwardResult | null> => {
  const { data, error } = await supabase.rpc('award_dharma_coins', {
    p_source: source,
    p_source_ref: sourceRef ?? null,
    p_user_timezone: getLocalTimezone(),
  });

  if (error) {
    console.warn('award_dharma_coins failed', error);
    return null;
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;

  const result: AwardResult = {
    awarded: Number(row.awarded ?? 0),
    base: Number(row.base ?? 0),
    multiplier: Number(row.multiplier ?? 1),
    total: Number(row.total ?? 0),
    reason: (row.reason ?? 'unknown_source') as AwardResult['reason'],
    streak: Number(row.streak ?? 0),
  };

  if (result.awarded > 0) {
    DeviceEventEmitter.emit(DHARMA_COINS_UPDATED_EVENT, result.total);
    const payload: DharmaCoinEarnedPayload = {
      amount: result.awarded,
      base: result.base,
      multiplier: result.multiplier,
      source,
    };
    DeviceEventEmitter.emit(DHARMA_COINS_EARNED_EVENT, payload);
  }

  return result;
};

/**
 * The user-facing ways to earn Dharma Coins, with the base amounts awarded by
 * the `award_dharma_coins` RPC. Shared by the Dharma Coins "ways to earn" popup
 * and the onboarding flow so both stay in sync with the server rules.
 */
export type DharmaCoinEarnMethod = {
  key: 'streak' | 'prayer' | 'lotus_level';
  title: string;
  amount: number;
  cadence: string;
  description: string;
};

export const DHARMA_COIN_EARN_METHODS: DharmaCoinEarnMethod[] = [
  {
    key: 'streak',
    title: 'Keep your daily streak',
    amount: 1,
    cadence: 'Once a day',
    description: 'Open Dharma Daily and read your verse of the day to keep your streak going.',
  },
  {
    key: 'prayer',
    title: 'Complete a prayer',
    amount: 2,
    cadence: 'Once a day',
    description: 'Listen to any prayer all the way through to the end.',
  },
  {
    key: 'lotus_level',
    title: 'Pass a learning level',
    amount: 2,
    cadence: 'Up to 3 a day per path',
    description: 'Complete a level on the Lotus, World, Garden, or Mountain path (or a Wisdom Gate) and pass its quiz.',
  },
];

export const DHARMA_COIN_MULTIPLIER_NOTE =
  'Your streak multiplier (up to 2×) boosts every coin you earn.';

// ── Spending: skip a level ────────────────────────────────────────────────────
// A user can spend a fixed number of coins to skip the level they are currently
// on. The deduction and the level advance happen atomically in the
// `skip_level_with_coins` RPC (see scripts/skip_level_with_coins_migration.sql).

export const SKIP_LEVEL_COST = 5;

// The playable paths that support skipping (matches PLAYABLE_PATH_ORDER).
export type SkipLevelPath = 'lotus' | 'mountain' | 'garden' | 'forest';

export type SkipLevelReason =
  | 'skipped'
  | 'insufficient_coins'
  | 'not_current_level'
  | 'cannot_skip_gate'
  | 'unknown_path'
  | 'no_profile'
  | 'unauthenticated'
  | 'error';

export type SkipLevelResult = {
  ok: boolean;
  reason: SkipLevelReason;
  newBalance: number;
  newLevel: number;
  cost: number;
};

export const skipLevelWithCoins = async (
  path: SkipLevelPath,
  level: number,
): Promise<SkipLevelResult> => {
  const fallback: SkipLevelResult = {
    ok: false,
    reason: 'error',
    newBalance: 0,
    newLevel: level,
    cost: SKIP_LEVEL_COST,
  };

  const { data, error } = await supabase.rpc('skip_level_with_coins', {
    p_path: path,
    p_level: level,
    p_user_timezone: getLocalTimezone(),
  });

  if (error) {
    console.warn('skip_level_with_coins failed', error);
    return fallback;
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return fallback;

  const result: SkipLevelResult = {
    ok: !!row.ok,
    reason: (row.reason ?? 'error') as SkipLevelReason,
    newBalance: Number(row.new_balance ?? 0),
    newLevel: Number(row.new_level ?? level),
    cost: Number(row.cost ?? SKIP_LEVEL_COST),
  };

  // Keep the coin pill (and anything else listening) in sync after a spend.
  if (result.ok) {
    DeviceEventEmitter.emit(DHARMA_COINS_UPDATED_EVENT, result.newBalance);
  }

  return result;
};

export const sourceDisplayName = (source: DharmaCoinSource): string => {
  switch (source) {
    case 'streak':
      return 'Daily Streak';
    case 'prayer':
      return 'Prayer Completion';
    case 'lotus_level':
    case 'world_level':
      return 'Level Completion';
    case 'wisdom_gate':
      return 'Wisdom Gate';
    case 'redemption':
      return 'Redemption';
    case 'bonus':
      return 'Bonus';
    default:
      return source;
  }
};

// Label for a single history row. Spends are named by what they bought
// (via source_ref) — e.g. a skip-level redemption reads "Level Skip" — and
// everything else falls back to the source's display name.
export const transactionDisplayName = (
  source: DharmaCoinSource,
  sourceRef?: string | null,
): string => {
  if (source === 'redemption' && sourceRef?.startsWith('skip:')) {
    return 'Level Skip';
  }
  return sourceDisplayName(source);
};
