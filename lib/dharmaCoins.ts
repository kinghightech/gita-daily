import { supabase } from '@/lib/supabase';
import { DeviceEventEmitter } from 'react-native';

export const DHARMA_COINS_UPDATED_EVENT = 'gitaDaily.dharmaCoinsUpdated.v1';
export const DHARMA_COINS_EARNED_EVENT = 'gitaDaily.dharmaCoinsEarned.v1';

export type DharmaCoinSource = 'streak' | 'prayer' | 'lotus_level' | 'redemption' | 'bonus';

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

export const sourceDisplayName = (source: DharmaCoinSource): string => {
  switch (source) {
    case 'streak':
      return 'Daily Streak';
    case 'prayer':
      return 'Prayer Completion';
    case 'lotus_level':
      return 'Lotus Path Level';
    case 'redemption':
      return 'Redemption';
    case 'bonus':
      return 'Bonus';
    default:
      return source;
  }
};
