import { supabase } from './supabase';
import {
  Award,
  BookHeart,
  BookOpen,
  Calendar,
  Compass,
  Crown,
  Feather,
  Flame,
  Heart,
  Library,
  Medal,
  Mountain,
  PartyPopper,
  ScrollText,
  Send,
  Sparkles,
  Star,
  StickyNote,
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
  lessonsDoneCount: number;
  notesCount: number;
  sharesCount: number;
}

export const BADGE_DEFINITIONS: Badge[] = [
  {
    id: 'welcome',
    title: 'Welcome',
    description: 'Began your Gita Daily journey.',
    icon: 'Sparkles',
    criteria: () => true,
  },
  {
    id: 'explorer',
    title: 'First Step',
    description: 'Completed your first lesson on the Lotus Path.',
    icon: 'Compass',
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
    icon: 'Award',
    criteria: (s) => s.streakCount >= 30,
  },
  {
    id: 'centurion',
    title: '100-Day Streak',
    description: 'One hundred consecutive days of practice.',
    icon: 'Crown',
    criteria: (s) => s.streakCount >= 100,
  },
  {
    id: 'levels_10',
    title: 'Dedicated Scholar',
    description: 'Completed ten Lotus Path levels.',
    icon: 'BookOpen',
    criteria: (s) => s.levelCount >= 10,
  },
  {
    id: 'sage',
    title: 'Path Complete',
    description: 'Finished every level of the Lotus Path.',
    icon: 'Mountain',
    criteria: (s) => s.levelCount >= 50,
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
    icon: 'PartyPopper',
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
    icon: 'Feather',
    criteria: (s) => s.notesCount >= 5,
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
  Award,
  BookHeart,
  BookOpen,
  Calendar,
  Compass,
  Crown,
  Feather,
  Flame,
  Heart,
  Library,
  Medal,
  Mountain,
  PartyPopper,
  ScrollText,
  Send,
  Sparkles,
  Star,
  StickyNote,
  Trophy,
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
