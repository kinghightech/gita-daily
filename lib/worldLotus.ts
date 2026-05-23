import { supabase } from './supabase';

// ── Block types (discriminated union) ────────────────────────────────────────

export type ReadingBlockType =
  | 'paragraph'
  | 'fact_card'
  | 'mini_story'
  | 'mini_story_dos_donts'
  | 'timeline'
  | 'dialogue'
  | 'concept_map'
  | 'tap_reveal'
  | 'audio_recite'
  | 'story_panels'
  | 'interactive_diagram';

export type QuestionBlockType =
  | 'multiple_choice'
  | 'true_false_swipe'
  | 'odd_one_out'
  | 'fill_blank'
  | 'build_sentence'
  | 'drag_to_order'
  | 'matching_cards'
  | 'word_sort'
  | 'tap_correct_image';

export type BlockType = ReadingBlockType | QuestionBlockType;

const QUESTION_BLOCK_TYPES: ReadonlySet<string> = new Set([
  'multiple_choice',
  'true_false_swipe',
  'odd_one_out',
  'fill_blank',
  'build_sentence',
  'drag_to_order',
  'matching_cards',
  'word_sort',
  'tap_correct_image',
]);

export function isQuestionBlock(block: WorldLotusBlock): boolean {
  return QUESTION_BLOCK_TYPES.has(block.type);
}

// ── Reading blocks ───────────────────────────────────────────────────────────

export type ParagraphBlock = {
  type: 'paragraph';
  order: number;
  content: { text: string };
};

export type FactCardBlock = {
  type: 'fact_card';
  order: number;
  content: { text: string };
};

export type MiniStoryBlock = {
  type: 'mini_story';
  order: number;
  content: { title: string; story: string };
};

export type MiniStoryDosDontsBlock = {
  type: 'mini_story_dos_donts';
  order: number;
  content: {
    do: { title: string; story: string };
    dont: { title: string; story: string };
  };
};

export type TimelineBlock = {
  type: 'timeline';
  order: number;
  content: { prompt: string; events: { date: string; title: string }[] };
};

export type DialogueExchange = { speaker: 'user' | 'acharya'; text: string };
export type DialogueBlock = {
  type: 'dialogue';
  order: number;
  content: { exchanges: DialogueExchange[] };
};

export type ConceptMapBlock = {
  type: 'concept_map';
  order: number;
  content: { center: string; branches: string[] };
};

export type TapRevealCard = { front: string; back: string };
export type TapRevealBlock = {
  type: 'tap_reveal';
  order: number;
  content: { prompt: string; cards: TapRevealCard[] };
};

export type ReciteWord = { word: string; meaning: string };
// The DB contains 3 audio_recite variants:
//  • word-by-word recitation (text + words[] + translation + source) — eg level 7
//  • syllable breakdown (text + syllables[] + translation) — eg level 12
//  • sacred sound (text + syllables[] + long_form + translation) — eg level 13
// All fields except text + translation are optional.
export type AudioReciteBlock = {
  type: 'audio_recite';
  order: number;
  content: {
    text: string;
    translation: string;
    source?: string;
    long_form?: string;
    syllables?: string[];
    words?: ReciteWord[];
  };
};

export type StoryPanel = {
  caption: string;
  image_prompt?: string;
  image_filename?: string;
};
export type StoryPanelsBlock = {
  type: 'story_panels';
  order: number;
  content: { title?: string; panels: StoryPanel[] };
};

export type DiagramHotspot = { label: string; explanation: string };
export type InteractiveDiagramBlock = {
  type: 'interactive_diagram';
  order: number;
  content: {
    hotspots: DiagramHotspot[];
    image_prompt?: string;
    image_filename?: string;
  };
};

// ── Question blocks ──────────────────────────────────────────────────────────

export type MultipleChoiceBlock = {
  type: 'multiple_choice';
  order: number;
  content: {
    question: string;
    options: string[];
    correct_index: number;
    explanation: string;
  };
};

export type TrueFalseSwipeBlock = {
  type: 'true_false_swipe';
  order: number;
  content: { statement: string; answer: boolean; explanation: string };
};

export type OddOneOutBlock = {
  type: 'odd_one_out';
  order: number;
  content: {
    question: string;
    options: string[];
    correct_index: number;
    explanation: string;
  };
};

export type FillBlankBlock = {
  type: 'fill_blank';
  order: number;
  content: { sentence: string; answer: string; accept_variants?: string[] };
};

export type BuildSentenceBlock = {
  type: 'build_sentence';
  order: number;
  content: { prompt: string; tiles: string[]; correct_order: number[] };
};

export type DragToOrderBlock = {
  type: 'drag_to_order';
  order: number;
  content: { prompt: string; items: string[] };
};

export type MatchingPair = { term: string; definition: string };
export type MatchingCardsBlock = {
  type: 'matching_cards';
  order: number;
  content: { prompt: string; pairs: MatchingPair[] };
};

export type WordSortItem = { word: string; category: string };
export type WordSortBlock = {
  type: 'word_sort';
  order: number;
  content: { prompt: string; categories: string[]; items: WordSortItem[] };
};

export type TapImageOption = {
  label: string;
  correct: boolean;
  image_prompt?: string;
  image_filename?: string;
};
export type TapCorrectImageBlock = {
  type: 'tap_correct_image';
  order: number;
  content: { question: string; options: TapImageOption[] };
};

// ── Union ────────────────────────────────────────────────────────────────────

export type WorldLotusBlock =
  | ParagraphBlock
  | FactCardBlock
  | MiniStoryBlock
  | MiniStoryDosDontsBlock
  | TimelineBlock
  | DialogueBlock
  | ConceptMapBlock
  | TapRevealBlock
  | AudioReciteBlock
  | StoryPanelsBlock
  | InteractiveDiagramBlock
  | MultipleChoiceBlock
  | TrueFalseSwipeBlock
  | OddOneOutBlock
  | FillBlankBlock
  | BuildSentenceBlock
  | DragToOrderBlock
  | MatchingCardsBlock
  | WordSortBlock
  | TapCorrectImageBlock;

export type WorldLotusLevelData = {
  id: number;
  level_number: number;
  title: string;
  difficulty_tier: string | null;
  is_wisdom_gate: boolean;
  blocks: WorldLotusBlock[];
};

// ── Legacy (preserved for back-compat with older callers) ────────────────────

export type WorldLotusQuestion = {
  question: string;
  options: string[];
  correct_index: number;
};

// ── Fetch ────────────────────────────────────────────────────────────────────

type RawWorldLotusRow = {
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
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function mapRow(row: RawWorldLotusRow): WorldLotusLevelData {
  return {
    id: row.id,
    level_number: row.id,
    title: row.title,
    difficulty_tier: row.difficulty_tier,
    is_wisdom_gate: !!row.is_wisdom_gate,
    blocks: normalizeBlocks(row.blocks),
  };
}

export async function fetchWorldLotusLevel(
  levelNumber: number,
): Promise<WorldLotusLevelData | null> {
  const { data, error } = await supabase
    .from('world_lotus_levels')
    .select('id, title, difficulty_tier, is_wisdom_gate, blocks')
    .eq('id', levelNumber)
    .maybeSingle();

  if (error) {
    console.error('Error fetching world lotus level:', error);
    return null;
  }
  return data ? mapRow(data as RawWorldLotusRow) : null;
}

export async function fetchWorldLotusLevels(): Promise<WorldLotusLevelData[]> {
  const { data, error } = await supabase
    .from('world_lotus_levels')
    .select('id, title, difficulty_tier, is_wisdom_gate, blocks')
    .order('id', { ascending: true });

  if (error) {
    console.error('Error fetching world lotus levels:', error);
    return [];
  }
  return (data ?? []).map((row) => mapRow(row as RawWorldLotusRow));
}

export async function fetchCurrentWorldLotusLevel(): Promise<number> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 1;

  const { data, error } = await supabase
    .from('profiles')
    .select('current_world_lotus_level')
    .eq('id', user.id)
    .maybeSingle();

  if (error || !data) return 1;
  return data.current_world_lotus_level ?? 1;
}

export async function updateCurrentWorldLotusLevel(
  completedLevelNumber: number,
): Promise<{ error?: unknown; success?: boolean }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
}

// Mark the lotus-path wisdom gate as passed. Stored in world_lotus_progress so the
// front-end can later branch on "user has completed the lotus region".
export async function markLotusWisdomGatePassed(): Promise<{ error?: unknown; success?: boolean }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'No user session' };

  const { error } = await supabase
    .from('world_lotus_progress')
    .upsert(
      {
        user_id: user.id,
        region_slug: 'lotus_path',
        passed_wisdom_gate: true,
      },
      { onConflict: 'user_id' },
    );
  if (error) return { error };
  return { success: true };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

// Fisher-Yates. Returns a NEW array; original is untouched.
export function shuffle<T>(arr: readonly T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Normalize text for fill-blank comparison:
//   • strip diacritics (Sanātana → Sanatana)
//   • strip punctuation (hyphens, dots, quotes, etc.)
//   • collapse whitespace
//   • lowercase
export function normalizeAnswerText(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

// Permissive fill-blank match: accepts the answer or any variant, with
// punctuation, case and diacritics ignored, AND with optional whitespace
// (so "sanatanadharma" matches "sanatana dharma").
export function fillBlankIsCorrect(
  userInput: string,
  answer: string,
  acceptVariants: string[] = [],
): boolean {
  const u = normalizeAnswerText(userInput);
  if (u.length === 0) return false;
  const uTight = u.replace(/\s/g, '');
  const candidates = [answer, ...acceptVariants];
  return candidates.some((c) => {
    const n = normalizeAnswerText(c);
    if (n === u) return true;
    if (n.replace(/\s/g, '') === uTight) return true;
    return false;
  });
}

// Count question blocks in a level — only these count toward the pass score.
export function countQuestionBlocks(blocks: WorldLotusBlock[]): number {
  return blocks.filter(isQuestionBlock).length;
}

// Pass threshold: 50% for regular levels, 70% for wisdom-gate levels (rounded up).
// Min 1 if any questions exist.
export function passThreshold(
  questionCount: number,
  isWisdomGate: boolean = false,
): number {
  if (questionCount <= 0) return 0;
  const ratio = isWisdomGate ? 0.7 : 0.5;
  return Math.max(1, Math.ceil(questionCount * ratio));
}

// How many "reveal" clicks a block needs before the Continue button advances
// to the next block. 0 means a single click advances. Dialogue is the only
// block type with multi-step reveal — it pairs (user → acharya) per click.
export function getBlockSubstepCount(block: WorldLotusBlock | undefined): number {
  if (!block) return 0;
  if (block.type === 'dialogue') {
    return Math.ceil(block.content.exchanges.length / 2);
  }
  return 0;
}
