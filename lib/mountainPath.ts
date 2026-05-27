import { supabase } from './supabase';
import type { WorldLotusBlock } from './worldLotus';

export type MountainLevelData = {
  id: number;
  level_number: number;
  title: string;
  difficulty_tier: string | null;
  is_wisdom_gate: boolean;
  blocks: WorldLotusBlock[];
};

type RawMountainRow = {
  id: number;
  title: string;
  difficulty_tier: string | null;
  is_wisdom_gate: boolean | null;
  blocks: unknown;
};

function normalizeBlocks(raw: unknown): WorldLotusBlock[] {
  if (!Array.isArray(raw)) return [];
  return (raw as WorldLotusBlock[])
    .filter((b) => b && typeof b === 'object' && 'type' in b)
    .sort((a, b) => ((a as { order?: number }).order ?? 0) - ((b as { order?: number }).order ?? 0));
}

function mapRow(row: RawMountainRow): MountainLevelData {
  return {
    id: row.id,
    level_number: row.id,
    title: row.title,
    difficulty_tier: row.difficulty_tier,
    is_wisdom_gate: !!row.is_wisdom_gate,
    blocks: normalizeBlocks(row.blocks),
  };
}

export const fetchMountainLevels = async (): Promise<MountainLevelData[]> => {
  const { data, error } = await supabase
    .from('mountain_path_levels')
    .select('id, title, difficulty_tier, is_wisdom_gate, blocks')
    .order('id', { ascending: true });

  if (error) {
    console.error('Error fetching mountain levels:', error);
    return [];
  }

  return (data ?? []).map((row) => mapRow(row as RawMountainRow));
};

export const fetchMountainLevel = async (
  levelNumber: number,
): Promise<MountainLevelData | null> => {
  const { data, error } = await supabase
    .from('mountain_path_levels')
    .select('id, title, difficulty_tier, is_wisdom_gate, blocks')
    .eq('id', levelNumber)
    .maybeSingle();

  if (error) {
    console.error('Error fetching mountain level:', error);
    return null;
  }

  return data ? mapRow(data as RawMountainRow) : null;
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
