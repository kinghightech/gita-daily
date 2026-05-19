import { supabase } from './supabase';

export type MountainQuestion = {
  question: string;
  options: string[];
  correct_index: number;
};

export type MountainLevelData = {
  id: number;
  level_number: number;
  title: string;
  reading: string;
  questions: MountainQuestion[];
  difficulty_tier: string | null;
  is_wisdom_gate: boolean;
};

type RawMountainRow = {
  id: number;
  title: string;
  reading: string;
  questions: MountainQuestion[] | null;
  difficulty_tier: string | null;
  is_wisdom_gate: boolean | null;
};

const mapRow = (row: RawMountainRow): MountainLevelData => ({
  id: row.id,
  level_number: row.id,
  title: row.title,
  reading: row.reading,
  questions: Array.isArray(row.questions) ? row.questions : [],
  difficulty_tier: row.difficulty_tier,
  is_wisdom_gate: !!row.is_wisdom_gate,
});

export const fetchMountainLevels = async (): Promise<MountainLevelData[]> => {
  const { data, error } = await supabase
    .from('mountain_path_levels')
    .select('id, title, reading, questions, difficulty_tier, is_wisdom_gate')
    .order('id', { ascending: true });

  if (error) {
    console.error('Error fetching mountain levels:', error);
    return [];
  }

  return (data ?? []).map(mapRow);
};

export const fetchMountainLevel = async (
  levelNumber: number,
): Promise<MountainLevelData | null> => {
  const { data, error } = await supabase
    .from('mountain_path_levels')
    .select('id, title, reading, questions, difficulty_tier, is_wisdom_gate')
    .eq('id', levelNumber)
    .maybeSingle();

  if (error) {
    console.error('Error fetching mountain level:', error);
    return null;
  }

  return data ? mapRow(data) : null;
};

export const fetchCurrentMountainLevel = async (): Promise<number> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 1;

  const { data, error } = await supabase
    .from('profiles')
    .select('current_mountain_path_level')
    .eq('id', user.id)
    .maybeSingle();

  if (error || !data) return 1;
  return data.current_mountain_path_level ?? 1;
};

export const updateCurrentMountainLevel = async (completedLevelNumber: number) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No user session' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('current_mountain_path_level')
    .eq('id', user.id)
    .maybeSingle();

  const current = profile?.current_mountain_path_level ?? 1;
  if (current <= completedLevelNumber) {
    const { error } = await supabase
      .from('profiles')
      .update({ current_mountain_path_level: completedLevelNumber + 1 })
      .eq('id', user.id);
    return { error };
  }

  return { success: true };
};
