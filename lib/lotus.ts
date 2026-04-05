import { supabase } from './supabase';

export type LotusQuestion = {
  question: string;
  options: string[];
  correct_index: number;
};

export type LotusLevelData = {
  id: number;
  title: string;
  reading: string;
  questions: LotusQuestion[];
  difficulty_tier: string;
};

export const fetchLotusLevels = async (): Promise<LotusLevelData[]> => {
  const { data, error } = await supabase
    .from('lotus_levels')
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    console.error('Error fetching lotus levels:', error);
    return [];
  }

  return data || [];
};

export const updateCurrentLotusLevel = async (levelId: number) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No user session' };

  // Update current_lotus_level to levelId + 1 (unlock next level)
  // We only increment if the completed level is the user's current level
  const { data: profile } = await supabase
    .from('profiles')
    .select('current_lotus_level')
    .eq('id', user.id)
    .single();

  if (profile && profile.current_lotus_level <= levelId) {
    const { error } = await supabase
      .from('profiles')
      .update({ current_lotus_level: levelId + 1 })
      .eq('id', user.id);
    
    return { error };
  }

  return { success: true };
};
