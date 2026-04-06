import { supabase } from '@/lib/supabase';

export type UserNote = {
  id: string;
  user_id: string;
  verse_id: string;
  note_text: string;
  created_at: string;
  updated_at: string;
  // Joined fields (from gita_verses)
  verse?: {
    chapter_number: number;
    verse_number: number;
    speaker: string | null;
    english: string;
  };
};

export const NOTES_UPDATED_EVENT = 'gitaDaily.notesUpdated.v1';

/**
 * Fetches all notes for a user, with verse details joined.
 */
export const fetchUserNotes = async (userId: string): Promise<UserNote[]> => {
  if (!userId) return [];

  const { data, error } = await supabase
    .from('user_notes')
    .select(`
      id,
      user_id,
      verse_id,
      note_text,
      created_at,
      updated_at,
      verse:gita_verses (
        chapter_number,
        verse_number,
        speaker,
        english
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching notes:', error);
    return [];
  }

  return (data ?? []) as unknown as UserNote[];
};

/**
 * Saves a new note or updates an existing one for a verse.
 */
export const saveNote = async (
  userId: string,
  verseId: string,
  noteText: string
): Promise<boolean> => {
  if (!userId || !verseId || !noteText.trim()) return false;

  // Check if a note already exists for this user+verse
  const { data: existing } = await supabase
    .from('user_notes')
    .select('id')
    .eq('user_id', userId)
    .eq('verse_id', verseId)
    .maybeSingle();

  if (existing) {
    // Update existing note
    const { error } = await supabase
      .from('user_notes')
      .update({ note_text: noteText.trim(), updated_at: new Date().toISOString() })
      .eq('id', existing.id);

    if (error) {
      console.error('Error updating note:', error);
      return false;
    }
  } else {
    // Insert new note
    const { error } = await supabase
      .from('user_notes')
      .insert({ user_id: userId, verse_id: verseId, note_text: noteText.trim() });

    if (error) {
      console.error('Error saving note:', error);
      return false;
    }
  }

  return true;
};

/**
 * Deletes a note by ID.
 */
export const deleteNote = async (noteId: string): Promise<boolean> => {
  if (!noteId) return false;

  const { error } = await supabase
    .from('user_notes')
    .delete()
    .eq('id', noteId);

  if (error) {
    console.error('Error deleting note:', error);
    return false;
  }

  return true;
};
