import { supabase } from '@/lib/supabase';
import { fetchChapters } from '@/lib/verses';

export type GuideEntry = {
  term: string;
  meaning: string;
};

export type GuideSection = {
  category: string;
  label: string;
  order: number;
  entries: GuideEntry[];
};

type GlossaryRow = {
  id: number;
  category: string;
  category_label: string;
  category_order: number;
  term: string | null;
  meaning: string;
  chapter_number: number | null;
  sort_order: number;
};

export const fetchGuideGlossary = async (): Promise<GuideSection[]> => {
  const [glossaryResult, chapters] = await Promise.all([
    supabase
      .from('gita_guide_glossary')
      .select('*')
      .order('category_order', { ascending: true })
      .order('sort_order', { ascending: true }),
    fetchChapters(),
  ]);

  if (glossaryResult.error) {
    console.error('Error fetching guide glossary:', glossaryResult.error);
    return [];
  }

  const rows: GlossaryRow[] = glossaryResult.data ?? [];
  const sectionMap = new Map<string, GuideSection>();

  for (const row of rows) {
    if (!sectionMap.has(row.category)) {
      sectionMap.set(row.category, {
        category: row.category,
        label: row.category_label,
        order: row.category_order,
        entries: [],
      });
    }

    const section = sectionMap.get(row.category)!;

    if (row.category === 'chapter_themes' && row.chapter_number != null) {
      const chapter = chapters.find(c => c.chapter_number === row.chapter_number);
      const term = chapter
        ? `Ch. ${chapter.chapter_number}: ${chapter.chapter_name}`
        : `Chapter ${row.chapter_number}`;
      section.entries.push({ term, meaning: row.meaning });
    } else {
      section.entries.push({ term: row.term ?? '', meaning: row.meaning });
    }
  }

  return Array.from(sectionMap.values()).sort((a, b) => a.order - b.order);
};
