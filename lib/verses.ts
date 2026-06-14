import { supabase } from '@/lib/supabase';

export type GitaChapter = {
  id: number;
  chapter_number: number;
  chapter_name: string;
  total_verses: number;
};

export type GitaVerse = {
  id: string;
  chapter_number: number;
  verse_number: number;
  speaker: string | null;
  english: string;
  hindi: string | null;
  context: string | null;
};

/**
 * Fetches all chapters from gita_chapters.
 */
export const fetchChapters = async (): Promise<GitaChapter[]> => {
  const { data, error } = await supabase
    .from('gita_chapters')
    .select('*')
    .order('chapter_number', { ascending: true });

  if (error) {
    console.error('Error fetching chapters:', error);
    return [];
  }

  return data ?? [];
};

/**
 * Fetches a single chapter by number.
 */
export const fetchChapter = async (chapterNumber: number): Promise<GitaChapter | null> => {
  const { data, error } = await supabase
    .from('gita_chapters')
    .select('*')
    .eq('chapter_number', chapterNumber)
    .maybeSingle();

  if (error) {
    console.error('Error fetching chapter:', error);
    return null;
  }

  return data;
};

/**
 * Fetches all verses for a specific chapter, ordered by verse_number.
 */
export const fetchVersesByChapter = async (chapterNumber: number): Promise<GitaVerse[]> => {
  const { data, error } = await supabase
    .from('gita_verses')
    .select('*')
    .eq('chapter_number', chapterNumber)
    .order('verse_number', { ascending: true });

  if (error) {
    console.error('Error fetching verses:', error);
    return [];
  }

  return data ?? [];
};

/**
 * Fetches ALL gita_verses across all chapters (for All Verses tab).
 */
/**
 * Strips the leading verse reference (e.g. ।।1.1।।) from Hindi text,
 * since the UI already shows chapter/verse numbers separately.
 */
export const stripHindiVerseRef = (text: string | null | undefined): string => {
  if (!text) return '';
  return text.replace(/^।।[\d\.\s\-]+।।\s*/, '');
};

export const getVerseDisplayText = (
  verse: Pick<GitaVerse, 'english' | 'hindi'>,
  preferredLanguage: 'english' | 'hindi'
): string => {
  if (preferredLanguage === 'hindi') {
    return stripHindiVerseRef(verse.hindi) || verse.english;
  }

  return verse.english;
};

export const fetchAllGitaVerses = async (): Promise<GitaVerse[]> => {
  const { data, error } = await supabase
    .from('gita_verses')
    .select('*')
    .order('chapter_number', { ascending: true })
    .order('verse_number', { ascending: true });

  if (error) {
    console.error('Error fetching all gita verses:', error);
    return [];
  }

  return data ?? [];
};

// Exact row count of gita_verses. MUST stay in sync with `totalVerses` in
// ios/OmDailyWidget/OmDailyWidget.swift so the app and the home-screen
// widget resolve to the same verse of the day. (Was 716, which overshot the
// real count and left ~2% of days with no verse.)
const TOTAL_VERSES = 701;

// Deterministic [0, 1) PRNG seeded by the local calendar date.
// Same day → same verse; consecutive days → unrelated verses (not sequential).
const seededRandomForDate = (date: Date): number => {
  const seed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

export const fetchVerseOfTheDay = async (): Promise<GitaVerse | null> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayIndex = Math.floor(seededRandomForDate(today) * TOTAL_VERSES);

  const { data, error } = await supabase
    .from('gita_verses')
    .select('*')
    .order('chapter_number', { ascending: true })
    .order('verse_number', { ascending: true })
    .range(dayIndex, dayIndex)
    .maybeSingle();

  if (error) {
    console.error('Error fetching verse of the day:', error);
    return null;
  }

  return data;
};
