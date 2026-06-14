import { supabase } from './supabase';
import { fetchUserFavorites, fetchUserFestivalFavorites } from './favorites';
import { fetchUserNotes } from './notes';
import { PATH_WISDOM_GATE_LEVEL } from './pathProgress';
import { fetchUserPrayerVerses } from './prayerFavorites';
import { fetchProfileByUserId, getCurrentAuthUserWithRetry } from './profile';
import {
  BadgeCheck,
  BookHeart,
  BookOpen,
  Calendar,
  CalendarCheck,
  Feather,
  Flame,
  Flower2,
  Footprints,
  GraduationCap,
  Library,
  Map,
  Mountain,
  NotebookPen,
  ScrollText,
  Send,
  Sprout,
  TreePine,
  Trophy,
} from 'lucide-react-native';

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  criteria: (stats: UserStats) => boolean;
}

export interface UserStats {
  streakCount: number;
  levelCount: number;
  favQuotesCount: number;
  favFestivalsCount: number;
  savedPrayerVersesCount: number;
  lessonsDoneCount: number;
  notesCount: number;
  sharesCount: number;
  lotusPathComplete: boolean;
  mountainPathComplete: boolean;
  gardenPathComplete: boolean;
  forestPathComplete: boolean;
  allPlayablePathsComplete: boolean;
}

const completedCountForCurrentLevel = (currentLevel: number | null | undefined, gateLevel: number) => {
  const normalized = Number.isFinite(currentLevel) ? Math.max(1, Math.floor(currentLevel ?? 1)) : 1;
  return Math.max(0, Math.min(normalized - 1, gateLevel));
};

const isCompleteForCurrentLevel = (
  currentLevel: number | null | undefined,
  gateLevel: number,
) => {
  const normalized = Number.isFinite(currentLevel) ? Math.max(1, Math.floor(currentLevel ?? 1)) : 1;
  return normalized > gateLevel;
};

export const BADGE_DEFINITIONS: Badge[] = [
  {
    id: 'welcome',
    title: 'Welcome',
    description: 'Began your Om Daily journey.',
    icon: 'BadgeCheck',
    criteria: () => true,
  },
  {
    id: 'explorer',
    title: 'First Step',
    description: 'Completed your first lesson.',
    icon: 'Footprints',
    criteria: (s) => s.lessonsDoneCount >= 1,
  },
  {
    id: 'streak_7',
    title: '7-Day Streak',
    description: 'Read the Gita seven days in a row.',
    icon: 'Flame',
    criteria: (s) => s.streakCount >= 7,
  },
  {
    id: 'streak_30',
    title: '30-Day Streak',
    description: 'A month of daily devotion.',
    icon: 'CalendarCheck',
    criteria: (s) => s.streakCount >= 30,
  },
  {
    id: 'centurion',
    title: '100-Day Streak',
    description: 'One hundred consecutive days of practice.',
    icon: 'Trophy',
    criteria: (s) => s.streakCount >= 100,
  },
  {
    id: 'levels_10',
    title: 'Dedicated Scholar',
    description: 'Completed ten learning levels.',
    icon: 'GraduationCap',
    criteria: (s) => s.levelCount >= 10,
  },
  {
    id: 'levels_25',
    title: 'Steady Student',
    description: 'Completed twenty-five learning levels.',
    icon: 'BookOpen',
    criteria: (s) => s.levelCount >= 25,
  },
  {
    id: 'sage',
    title: 'Lotus Path Complete',
    description: 'Passed the Lotus Path Wisdom Gate.',
    icon: 'Flower2',
    criteria: (s) => s.lotusPathComplete,
  },
  {
    id: 'mountain_path_complete',
    title: 'Mountain Path Complete',
    description: 'Passed the Mountain Path Wisdom Gate.',
    icon: 'Mountain',
    criteria: (s) => s.mountainPathComplete,
  },
  {
    id: 'garden_path_complete',
    title: 'Garden Path Complete',
    description: 'Passed the Garden Path Wisdom Gate.',
    icon: 'Sprout',
    criteria: (s) => s.gardenPathComplete,
  },
  {
    id: 'forest_path_complete',
    title: 'Forest Path Complete',
    description: 'Passed the Forest Path Wisdom Gate.',
    icon: 'TreePine',
    criteria: (s) => s.forestPathComplete,
  },
  {
    id: 'world_walker',
    title: 'World Walker',
    description: 'Completed every currently available learning path.',
    icon: 'Map',
    criteria: (s) => s.allPlayablePathsComplete,
  },
  {
    id: 'gnostic',
    title: 'Quote Lover',
    description: 'Saved your first five favorite verses.',
    icon: 'BookHeart',
    criteria: (s) => s.favQuotesCount >= 5,
  },
  {
    id: 'collector',
    title: 'Quote Collector',
    description: 'Saved twenty-five favorite verses.',
    icon: 'Library',
    criteria: (s) => s.favQuotesCount >= 25,
  },
  {
    id: 'festivity',
    title: 'Festival Saver',
    description: 'Saved your first festival.',
    icon: 'Calendar',
    criteria: (s) => s.favFestivalsCount >= 1,
  },
  {
    id: 'historian',
    title: 'Festival Devotee',
    description: 'Saved ten festivals.',
    icon: 'ScrollText',
    criteria: (s) => s.favFestivalsCount >= 10,
  },
  {
    id: 'philosopher',
    title: 'Reflective Mind',
    description: 'Wrote five personal reflections.',
    icon: 'NotebookPen',
    criteria: (s) => s.notesCount >= 5,
  },
  {
    id: 'prayer_keeper',
    title: 'Prayer Keeper',
    description: 'Saved your first prayer verse.',
    icon: 'Feather',
    criteria: (s) => s.savedPrayerVersesCount >= 1,
  },
  {
    id: 'prayer_archive',
    title: 'Prayer Archive',
    description: 'Saved ten prayer verses.',
    icon: 'ScrollText',
    criteria: (s) => s.savedPrayerVersesCount >= 10,
  },
  {
    id: 'messenger',
    title: 'Wisdom Sharer',
    description: 'Shared five verses with the world.',
    icon: 'Send',
    criteria: (s) => s.sharesCount >= 5,
  },
];

export const BADGE_ICONS: Record<string, any> = {
  BadgeCheck,
  BookHeart,
  BookOpen,
  Calendar,
  CalendarCheck,
  Feather,
  Flame,
  Flower2,
  Footprints,
  GraduationCap,
  Library,
  Map,
  Mountain,
  NotebookPen,
  ScrollText,
  Send,
  Sprout,
  TreePine,
  Trophy,
};

export const fetchUserBadgeStats = async (userId: string): Promise<UserStats> => {
  const [profile, favIds, favFestivalIds, notes, prayerVerses] = await Promise.all([
    fetchProfileByUserId(userId).catch((error) => {
      console.warn('Failed to fetch badge profile stats', error);
      return null;
    }),
    fetchUserFavorites(userId),
    fetchUserFestivalFavorites(userId),
    fetchUserNotes(userId),
    fetchUserPrayerVerses(userId),
  ]);

  const legacyLotusCompletedCount = Math.max(0, (profile?.current_lotus_level ?? 1) - 1);
  const lotusCompletedCount = completedCountForCurrentLevel(
    profile?.current_world_lotus_level,
    PATH_WISDOM_GATE_LEVEL.lotus,
  );
  const mountainCompletedCount = completedCountForCurrentLevel(
    profile?.current_mountain_path_level,
    PATH_WISDOM_GATE_LEVEL.mountain,
  );
  const gardenCompletedCount = completedCountForCurrentLevel(
    profile?.current_garden_path_level,
    PATH_WISDOM_GATE_LEVEL.garden,
  );
  const forestCompletedCount = completedCountForCurrentLevel(
    profile?.current_forest_path_level,
    PATH_WISDOM_GATE_LEVEL.forest,
  );
  const learningLevelCount =
    legacyLotusCompletedCount +
    lotusCompletedCount +
    mountainCompletedCount +
    gardenCompletedCount +
    forestCompletedCount;
  const lotusPathComplete = isCompleteForCurrentLevel(
    profile?.current_world_lotus_level,
    PATH_WISDOM_GATE_LEVEL.lotus,
  );
  const mountainPathComplete = isCompleteForCurrentLevel(
    profile?.current_mountain_path_level,
    PATH_WISDOM_GATE_LEVEL.mountain,
  );
  const gardenPathComplete = isCompleteForCurrentLevel(
    profile?.current_garden_path_level,
    PATH_WISDOM_GATE_LEVEL.garden,
  );
  const forestPathComplete = isCompleteForCurrentLevel(
    profile?.current_forest_path_level,
    PATH_WISDOM_GATE_LEVEL.forest,
  );

  return {
    streakCount: profile?.streak_count ?? 0,
    levelCount: learningLevelCount,
    favQuotesCount: favIds.length,
    favFestivalsCount: favFestivalIds.length,
    savedPrayerVersesCount: prayerVerses.length,
    lessonsDoneCount: learningLevelCount,
    notesCount: notes.length,
    sharesCount: profile?.shares_count ?? 0,
    lotusPathComplete,
    mountainPathComplete,
    gardenPathComplete,
    forestPathComplete,
    allPlayablePathsComplete:
      lotusPathComplete && mountainPathComplete && gardenPathComplete && forestPathComplete,
  };
};

export const refreshAndAwardUserBadges = async (userId?: string): Promise<string[]> => {
  const resolvedUserId = userId ?? (await getCurrentAuthUserWithRetry())?.id ?? null;
  if (!resolvedUserId) return [];

  const [currentBadgeIds, stats] = await Promise.all([
    fetchUserBadges(resolvedUserId),
    fetchUserBadgeStats(resolvedUserId),
  ]);

  return checkAndAwardBadges(resolvedUserId, stats, currentBadgeIds);
};

export const fetchUserBadges = async (userId: string): Promise<string[]> => {
  if (!userId) return [];

  const { data, error } = await supabase
    .from('user_badges')
    .select('badge_id')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching user badges:', error);
    return [];
  }

  return data.map((b: { badge_id: string }) => b.badge_id);
};

export const checkAndAwardBadges = async (userId: string, stats: UserStats, currentBadgeIds: string[]): Promise<string[]> => {
  if (!userId) return currentBadgeIds;

  const newBadges: string[] = [];
  const updatedBadgeIds = [...currentBadgeIds];

  for (const badge of BADGE_DEFINITIONS) {
    if (!updatedBadgeIds.includes(badge.id) && badge.criteria(stats)) {
      newBadges.push(badge.id);
      updatedBadgeIds.push(badge.id);
    }
  }

  if (newBadges.length > 0) {
    const inserts = newBadges.map(id => ({ user_id: userId, badge_id: id }));
    const { error } = await supabase.from('user_badges').upsert(inserts, { onConflict: 'user_id, badge_id' });
    if (error) {
      console.error('Error awarding badges:', error);
      return currentBadgeIds;
    }
  }

  return updatedBadgeIds;
};
