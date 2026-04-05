import { supabase } from '@/lib/supabase';
import { DeviceEventEmitter } from 'react-native';

export const FAVORITES_UPDATED_EVENT = 'gitaDaily.favoritesUpdated.v1';
export const FESTIVALS_UPDATED_EVENT = 'gitaDaily.festivalsUpdated.v1';

/**
 * Fetches all verse IDs favorited by the user.
 */
export const fetchUserFavorites = async (userId: string): Promise<string[]> => {
  if (!userId) return [];
  
  const { data, error } = await supabase
    .from('user_favorites')
    .select('verse_id')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching favorites:', error);
    return [];
  }

  return data.map((fav: { verse_id: string }) => fav.verse_id);
};

/**
 * Toggles a favorite status for a verse.
 * Returns the new liked status.
 */
export const toggleFavoriteVerse = async (
  userId: string, 
  verseId: string, 
  isCurrentlyLiked: boolean
): Promise<boolean> => {
  if (!userId || !verseId) return isCurrentlyLiked;

  if (isCurrentlyLiked) {
    // Remove from favorites
    const { error } = await supabase
      .from('user_favorites')
      .delete()
      .match({ user_id: userId, verse_id: verseId });

    if (error) {
      console.error('Error removing favorite:', error);
      return true; // Optimistic revert
    }
    
    DeviceEventEmitter.emit(FAVORITES_UPDATED_EVENT, { verseId, liked: false });
    return false;
  } else {
    // Add to favorites
    const { error } = await supabase
      .from('user_favorites')
      .insert({ user_id: userId, verse_id: verseId });

    if (error) {
      // Handle unique constraint gracefully
      if (error.code === '23505') {
        DeviceEventEmitter.emit(FAVORITES_UPDATED_EVENT, { verseId, liked: true });
        return true;
      }
      console.error('Error adding favorite:', error);
      return false; // Optimistic revert
    }
    
    DeviceEventEmitter.emit(FAVORITES_UPDATED_EVENT, { verseId, liked: true });
    return true;
  }
};

/**
 * Fetches all festival IDs favorited by the user.
 */
export const fetchUserFestivalFavorites = async (userId: string): Promise<string[]> => {
  if (!userId) return [];
  
  const { data, error } = await supabase
    .from('user_festival_favorites')
    .select('festival_id')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching festival favorites:', error);
    return [];
  }

  return data.map((fav: { festival_id: string }) => fav.festival_id);
};

/**
 * Toggles a favorite status for a festival.
 */
export const toggleFavoriteFestival = async (
  userId: string, 
  festivalId: string, 
  isCurrentlyLiked: boolean
): Promise<boolean> => {
  if (!userId || !festivalId) return isCurrentlyLiked;

  if (isCurrentlyLiked) {
    const { error } = await supabase
      .from('user_festival_favorites')
      .delete()
      .match({ user_id: userId, festival_id: festivalId });

    if (error) {
      console.error('Error removing festival favorite:', error);
      return true;
    }
    
    DeviceEventEmitter.emit(FESTIVALS_UPDATED_EVENT, { festivalId, liked: false });
    return false;
  } else {
    const { error } = await supabase
      .from('user_festival_favorites')
      .insert({ user_id: userId, festival_id: festivalId });

    if (error) {
      if (error.code === '23505') {
        DeviceEventEmitter.emit(FESTIVALS_UPDATED_EVENT, { festivalId, liked: true });
        return true;
      }
      console.error('Error adding festival favorite:', error);
      return false;
    }
    
    DeviceEventEmitter.emit(FESTIVALS_UPDATED_EVENT, { festivalId, liked: true });
    return true;
  }
};
