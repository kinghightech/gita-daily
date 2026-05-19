import { supabase } from './supabase';

export type WorldLotusQuestion = {
  question: string;
  options: string[];
  correct_index: number;
};

export type WorldLotusLevelData = {
  id: number;
  level_number: number;
  title: string;
  reading: string;
  questions: WorldLotusQuestion[];
  difficulty_tier: string | null;
};

type RawWorldLotusRow = {
  id: number;
  title: string;
  reading: string;
  questions: WorldLotusQuestion[] | null;
  difficulty_tier: string | null;
};

const mapRow = (row: RawWorldLotusRow): WorldLotusLevelData => ({
  id: row.id,
  level_number: row.id,
  title: row.title,
  reading: row.reading,
  questions: Array.isArray(row.questions) ? row.questions : [],
  difficulty_tier: row.difficulty_tier,
});

export const fetchWorldLotusLevels = async (): Promise<WorldLotusLevelData[]> => {
  const { data, error } = await supabase
    .from('world_lotus_levels')
    .select('id, title, reading, questions, difficulty_tier')
    .order('id', { ascending: true });

  if (error) {
    console.error('Error fetching world lotus levels:', error);
    return [];
  }

  return (data ?? []).map(mapRow);
};

export const fetchWorldLotusLevel = async (
  levelNumber: number,
): Promise<WorldLotusLevelData | null> => {
  const { data, error } = await supabase
    .from('world_lotus_levels')
    .select('id, title, reading, questions, difficulty_tier')
    .eq('id', levelNumber)
    .maybeSingle();

  if (error) {
    console.error('Error fetching world lotus level:', error);
    return null;
  }

  return data ? mapRow(data) : null;
};

export const fetchCurrentWorldLotusLevel = async (): Promise<number> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 1;

  const { data, error } = await supabase
    .from('profiles')
    .select('current_world_lotus_level')
    .eq('id', user.id)
    .maybeSingle();

  if (error || !data) return 1;
  return data.current_world_lotus_level ?? 1;
};

export const updateCurrentWorldLotusLevel = async (completedLevelNumber: number) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No user session' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('current_world_lotus_level')
    .eq('id', user.id)
    .maybeSingle();

  const current = profile?.current_world_lotus_level ?? 1;
  if (current <= completedLevelNumber) {
    const { error } = await supabase
      .from('profiles')
      .update({ current_world_lotus_level: completedLevelNumber + 1 })
      .eq('id', user.id);
    return { error };
  }

  return { success: true };
};
