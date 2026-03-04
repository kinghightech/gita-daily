// Gita Verse entity
// NOTE: Needs base44 API
export interface GitaVerse {
  id: string;
  chapter: number;
  verse: number;
  text: string;
  translation: string;
  commentary?: string;
}
