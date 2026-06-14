import {
  OmCoinTransaction,
  fetchOmCoinBalance,
  fetchOmCoinTransactions,
} from '@/lib/omCoins';
import { fetchCurrentUserAndProfile } from '@/lib/profile';

export type OmCoinOverviewSnapshot = {
  balance: number;
  streak: number;
  transactions: OmCoinTransaction[];
  cachedAt: number;
  hasFullOverview: boolean;
};

let cachedOverview: OmCoinOverviewSnapshot | null = null;

export const getCachedOmCoinOverview = (): OmCoinOverviewSnapshot | null => cachedOverview;

export const getCachedOmCoinBalance = (): number | null => cachedOverview?.balance ?? null;

export const updateCachedOmCoinBalance = (balance: number) => {
  cachedOverview = {
    balance,
    streak: cachedOverview?.streak ?? 0,
    transactions: cachedOverview?.transactions ?? [],
    cachedAt: Date.now(),
    hasFullOverview: cachedOverview?.hasFullOverview ?? false,
  };
};

export const fetchOmCoinOverview = async (
  limit = 100
): Promise<OmCoinOverviewSnapshot> => {
  const profileResult = await fetchCurrentUserAndProfile();
  const userId = profileResult.user?.id;

  if (!userId) {
    const emptySnapshot: OmCoinOverviewSnapshot = {
      balance: 0,
      streak: 0,
      transactions: [],
      cachedAt: Date.now(),
      hasFullOverview: true,
    };
    cachedOverview = emptySnapshot;
    return emptySnapshot;
  }

  const [balance, transactions] = await Promise.all([
    fetchOmCoinBalance(userId),
    fetchOmCoinTransactions(userId, limit),
  ]);

  const snapshot: OmCoinOverviewSnapshot = {
    balance,
    streak: profileResult.profile?.streak_count ?? 0,
    transactions,
    cachedAt: Date.now(),
    hasFullOverview: true,
  };

  cachedOverview = snapshot;
  return snapshot;
};
