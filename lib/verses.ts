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
