import type { PrayerVerse } from '@/lib/prayerVerses';
import { supabase } from '@/lib/supabase';
import { DeviceEventEmitter } from 'react-native';

export const PRAYER_VERSES_UPDATED_EVENT = 'gitaDaily.prayerVersesUpdated.v1';

/** A saved prayer verse as persisted in Supabase (denormalized snapshot). */
export type SavedPrayerVerse = {
  id: string;
  prayerId: string;
  prayerTitle: string;
  verseIndex: number;
  verseId: string;
  originalText: string;
  transliteration: string | null;
  meaning: string | null;
  savedAt: string;
};

type PrayerVerseRow = {
  id: string;
  prayer_id: string;
  prayer_title: string;
  verse_index: number;
  verse_id: string;
  original_text: string;
  transliteration: string | null;
  meaning: string | null;
  created_at: string;
};

const mapRow = (row: PrayerVerseRow): SavedPrayerVerse => ({
  id: row.id,
  prayerId: row.prayer_id,
  prayerTitle: row.prayer_title,
  verseIndex: row.verse_index,
  verseId: row.verse_id,
  originalText: row.original_text,
  transliteration: row.transliteration,
  meaning: row.meaning,
  savedAt: row.created_at,
});

/** Fetches all prayer verses the user has saved, newest first. */
export const fetchUserPrayerVerses = async (
  userId: string,
): Promise<SavedPrayerVerse[]> => {
  if (!userId) return [];

  const { data, error } = await supabase
    .from('user_prayer_verses')
    .select(
      'id, prayer_id, prayer_title, verse_index, verse_id, original_text, transliteration, meaning, created_at',
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching saved prayer verses:', error);
    return [];
  }

  return (data as PrayerVerseRow[]).map(mapRow);
};

/**
 * Toggles whether a prayer verse is saved for the user.
 * Returns the new saved state. Duplicate inserts are handled gracefully so the
 * same verse can never be stored twice.
 */
export const togglePrayerVerseSaved = async (
  userId: string,
  prayerTitle: string,
  verse: PrayerVerse,
  isCurrentlySaved: boolean,
): Promise<boolean> => {
  if (!userId || !verse?.id) return isCurrentlySaved;

  if (isCurrentlySaved) {
    const { error } = await supabase
      .from('user_prayer_verses')
      .delete()
      .match({ user_id: userId, prayer_id: verse.prayerId, verse_index: verse.index });

    if (error) {
      console.error('Error removing saved prayer verse:', error);
      return true; // Optimistic revert
    }

    DeviceEventEmitter.emit(PRAYER_VERSES_UPDATED_EVENT, {
      verseId: verse.id,
      saved: false,
    });
    return false;
  }

  const { error } = await supabase.from('user_prayer_verses').insert({
    user_id: userId,
    prayer_id: verse.prayerId,
    prayer_title: prayerTitle,
    verse_index: verse.index,
    verse_id: verse.id,
    original_text: verse.original,
    transliteration: verse.transliteration,
    meaning: verse.meaning,
  });

  if (error) {
    // Unique-constraint violation = already saved; treat as success.
    if (error.code === '23505') {
      DeviceEventEmitter.emit(PRAYER_VERSES_UPDATED_EVENT, {
        verseId: verse.id,
        saved: true,
      });
      return true;
    }
    console.error('Error saving prayer verse:', error);
    return false; // Optimistic revert
  }

  DeviceEventEmitter.emit(PRAYER_VERSES_UPDATED_EVENT, {
    verseId: verse.id,
    saved: true,
  });
  return true;
};
