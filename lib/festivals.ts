import { supabase } from './supabase';

export interface Festival {
  id: string;
  name: string;
  icon_emoji: string;
  deity: string;
  main_date: string; // ISO Date YYYY-MM-DD
  display_date: string;
  month: string;
  main_day_info: string;
  what_is_it: string;
  origin: string;
  how_to_celebrate: string;
  dos: string[];
  donts: string[];
  created_at: string;
}

export function getFestivalSymbol(name: string, iconEmoji: string) {
  const n = name.toLowerCase();
  if (n.includes('diwali')) return '🪔';
  if (n.includes('shivratri') || n.includes('shiva')) return '🔱';
  if (n.includes('holi')) return '🎨';
  if (n.includes('ganesh') || n.includes('chaturthi')) return '🐘';
  if (n.includes('janmashtami') || n.includes('krishna')) return '🪈';
  if (n.includes('navratri') || n.includes('durga')) return '🏹';
  if (n.includes('dussehra') || n.includes('ram')) return '🏹';
  if (n.includes('raksha')) return '🏵️';
  if (n.includes('pongal')) return '🌾';
  if (n.includes('onam')) return '🌸';
  return iconEmoji || '🕉️';
}

/**
 * Fetch all festivals for the year 2026, sorted by date.
 */
export async function fetchAllFestivals(): Promise<Festival[]> {
  const { data, error } = await supabase
    .from('festivals')
    .select('*')
    .order('main_date', { ascending: true });

  if (error) {
    console.error('Error fetching festivals:', error);
    return [];
  }

  return data || [];
}

/**
 * Fetch festivals for a specific month (e.g., 'January').
 */
export async function fetchFestivalsByMonth(monthName: string): Promise<Festival[]> {
  const { data, error } = await supabase
    .from('festivals')
    .select('*')
    .eq('month', monthName)
    .order('main_date', { ascending: true });

  if (error) {
    console.error(`Error fetching festivals for ${monthName}:`, error);
    return [];
  }

  return data || [];
}
