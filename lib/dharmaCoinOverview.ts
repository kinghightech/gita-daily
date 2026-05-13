import {
  DharmaCoinTransaction,
  fetchDharmaCoinBalance,
  fetchDharmaCoinTransactions,
} from '@/lib/dharmaCoins';
import { fetchCurrentUserAndProfile } from '@/lib/profile';

export type DharmaCoinOverviewSnapshot = {
  balance: number;
  streak: number;
  transactions: DharmaCoinTransaction[];
  cachedAt: number;
  hasFullOverview: boolean;
};

let cachedOverview: DharmaCoinOverviewSnapshot | null = null;

export const getCachedDharmaCoinOverview = (): DharmaCoinOverviewSnapshot | null => cachedOverview;

export const getCachedDharmaCoinBalance = (): number | null => cachedOverview?.balance ?? null;

export const updateCachedDharmaCoinBalance = (balance: number) => {
  cachedOverview = {
    balance,
    streak: cachedOverview?.streak ?? 0,
    transactions: cachedOverview?.transactions ?? [],
    cachedAt: Date.now(),
    hasFullOverview: cachedOverview?.hasFullOverview ?? false,
  };
};

export const fetchDharmaCoinOverview = async (
  limit = 100
): Promise<DharmaCoinOverviewSnapshot> => {
  const profileResult = await fetchCurrentUserAndProfile();
  const userId = profileResult.user?.id;

  if (!userId) {
    const emptySnapshot: DharmaCoinOverviewSnapshot = {
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
    fetchDharmaCoinBalance(userId),
    fetchDharmaCoinTransactions(userId, limit),
  ]);

  const snapshot: DharmaCoinOverviewSnapshot = {
    balance,
    streak: profileResult.profile?.streak_count ?? 0,
    transactions,
    cachedAt: Date.now(),
    hasFullOverview: true,
  };

  cachedOverview = snapshot;
  return snapshot;
};
