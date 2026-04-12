import { supabase } from './supabase';
import { 
  Sparkles, 
  Flame, 
  Trophy, 
  Medal, 
  Compass, 
  Heart, 
  Calendar, 
  Star, 
  StickyNote 
} from 'lucide-react-native';

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string; // Emoji
  criteria: (stats: UserStats) => boolean;
}

export interface UserStats {
  streakCount: number;
  levelCount: number;
  favQuotesCount: number;
  favFestivalsCount: number;
  lessonsDoneCount: number;
  notesCount: number;
  sharesCount: number;
}

export const BADGE_DEFINITIONS: Badge[] = [
  {
    id: 'welcome',
    title: 'Welcome',
    description: 'Joined the Gita Daily journey.',
    icon: 'Sparkles',
    criteria: () => true,
  },
  {
    id: 'explorer',
    title: 'First Step',
    description: 'Completed your first lesson.',
    icon: 'Compass',
    criteria: (s) => s.lessonsDoneCount >= 1,
  },
  {
    id: 'streak_7',
    title: '7 Day Fire',
    description: 'Maintained a 7-day streak.',
    icon: 'Flame',
    criteria: (s) => s.streakCount >= 7,
  },
  {
    id: 'streak_30',
    title: 'Sadhana Master',
    description: 'Maintained a 30-day streak.',
    icon: 'Trophy',
    criteria: (s) => s.streakCount >= 30,
  },
  {
    id: 'centurion',
    title: 'Centurion',
    description: 'Maintained a 100-day streak.',
    icon: 'Flame',
    criteria: (s) => s.streakCount >= 100,
  },
  {
    id: 'levels_10',
    title: 'Scholar',
    description: 'Completed 10 lotus levels.',
    icon: 'Medal',
    criteria: (s) => s.levelCount >= 10,
  },
  {
    id: 'sage',
    title: 'Master Sage',
    description: 'Completed the entire Lotus Path.',
    icon: 'Trophy',
    criteria: (s) => s.levelCount >= 50,
  },
  {
    id: 'gnostic',
    title: 'Gnostic',
    description: 'Favorited 5 sacred quotes.',
    icon: 'Heart',
    criteria: (s) => s.favQuotesCount >= 5,
  },
  {
    id: 'collector',
    title: 'Collector',
    description: 'Favorited 25 sacred quotes.',
    icon: 'Star',
    criteria: (s) => s.favQuotesCount >= 25,
  },
  {
    id: 'festivity',
    title: 'Festivity',
    description: 'Saved your first festival.',
    icon: 'Calendar',
    criteria: (s) => s.favFestivalsCount >= 1,
  },
  {
    id: 'historian',
    title: 'Historian',
    description: 'Saved 10 different festivals.',
    icon: 'Calendar',
    criteria: (s) => s.favFestivalsCount >= 10,
  },
  {
    id: 'philosopher',
    title: 'Philosopher',
    description: 'Wrote 5 personal reflections.',
    icon: 'StickyNote',
    criteria: (s) => s.notesCount >= 5,
  },
  {
    id: 'messenger',
    title: 'Messenger',
    description: 'Shared 5 verses with the world.',
    icon: 'Compass',
    criteria: (s) => s.sharesCount >= 5,
  },
];

export const BADGE_ICONS: Record<string, any> = {
  Sparkles,
  Flame,
  Trophy,
  Medal,
  Compass,
  Heart,
  Calendar,
  Star,
  StickyNote,
};

/**
 * Fetches all badge IDs earned by the user.
 */
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

/**
 * Checks stats and awards any new badges.
 */
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
      return currentBadgeIds; // Revert if failed
    }
  }

  return updatedBadgeIds;
};
