import { getPrayerLineMeaning } from '@/Data/prayerMeanings';
import type { Prayer } from '@/Data/prayers';

export const MEANING_COMING_SOON = 'Meaning coming soon';

/**
 * A single normalized, saveable line of a prayer.
 *
 * Prayers are stored as two parallel arrays (Devanagari `hindiLyrics` and romanized
 * `englishLyrics`) plus an optional meanings map. This type flattens one line index
 * into a single object that the UI and the save system can both consume.
 */
export type PrayerVerse = {
  /** Stable id: `${prayerId}:${index}` — used to dedupe saves and to re-open later. */
  id: string;
  prayerId: string;
  /** Line index into the prayer's lyric arrays. */
  index: number;
  /** Original line in Devanagari (the "Hindi" track). */
  original: string;
  /** Romanized transliteration, or null when unavailable. */
  transliteration: string | null;
  /** Beginner-friendly English meaning, or null when not authored yet. */
  meaning: string | null;
  /** Music interludes (♪) and blank lines — not saveable. */
  isInstrumental: boolean;
  timeMs: number;
};

const INSTRUMENTAL_MARKERS = new Set(['♪', '—', '']);

const isInstrumentalText = (text: string): boolean =>
  INSTRUMENTAL_MARKERS.has(text.trim());

/**
 * Normalizes a prayer into per-line verse objects. Resilient to the Hindi and
 * English arrays being different lengths (uses whichever line is present).
 */
export const getPrayerVerses = (prayer: Prayer): PrayerVerse[] => {
  const hindi = prayer.hindiLyrics ?? [];
  const english = prayer.englishLyrics ?? [];
  const count = Math.max(hindi.length, english.length);

  const verses: PrayerVerse[] = [];
  for (let index = 0; index < count; index++) {
    const hindiBlock = hindi[index];
    const englishBlock = english[index];

    const original = (hindiBlock?.text ?? englishBlock?.text ?? '').trim();
    const transliterationRaw = englishBlock?.text?.trim() ?? '';
    const transliteration =
      transliterationRaw && !isInstrumentalText(transliterationRaw)
        ? transliterationRaw
        : null;

    verses.push({
      id: `${prayer.id}:${index}`,
      prayerId: prayer.id,
      index,
      original,
      transliteration,
      meaning: getPrayerLineMeaning(prayer.id, index),
      isInstrumental: isInstrumentalText(original),
      timeMs: hindiBlock?.timeMs ?? englishBlock?.timeMs ?? 0,
    });
  }

  return verses;
};

/** Returns a single normalized verse by line index, or null if out of range / instrumental. */
export const getPrayerVerseByIndex = (
  prayer: Prayer,
  index: number,
): PrayerVerse | null => {
  if (index < 0) return null;
  const verse = getPrayerVerses(prayer)[index];
  if (!verse || verse.isInstrumental) return null;
  return verse;
};

/** Meaning to display for a verse, falling back to a friendly placeholder. */
export const displayMeaning = (verse: Pick<PrayerVerse, 'meaning'>): string =>
  verse.meaning && verse.meaning.trim().length > 0
    ? verse.meaning
    : MEANING_COMING_SOON;
