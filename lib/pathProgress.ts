import { fetchCurrentForestLevel } from './forestPath';
import { fetchCurrentGardenLevel } from './gardenPath';
import { fetchCurrentMountainLevel } from './mountainPath';
import { fetchCurrentWorldLotusLevel } from './worldLotus';

// ── Cross-path gating ─────────────────────────────────────────────────────────
// The world is walked one path at a time. A user must clear a path's Wisdom Gate
// before the next path opens. "Opening" a path's screen is always allowed — the
// gate only blocks *completing* its levels, so the UI can still be browsed.

export type PlayablePathSlug = 'lotus' | 'mountain' | 'garden' | 'forest';

// Ordered list of fully-built paths. Each is gated behind the one before it.
export const PLAYABLE_PATH_ORDER: PlayablePathSlug[] = [
  'lotus',
  'mountain',
  'garden',
  'forest',
];

// Human-facing titles, used to build the lock message.
export const PATH_TITLE: Record<PlayablePathSlug, string> = {
  lotus: 'Lotus Path',
  mountain: 'Mountain Path',
  garden: 'Garden Path',
  forest: 'Forest Path',
};

// The Wisdom Gate is the LAST level of each path. Passing it advances the stored
// current level past the gate, so a path is "complete" once current > gate.
export const PATH_WISDOM_GATE_LEVEL: Record<PlayablePathSlug, number> = {
  lotus: 21,
  mountain: 24,
  garden: 34,
  forest: 36,
};

const CURRENT_LEVEL_FETCHERS: Record<PlayablePathSlug, () => Promise<number>> = {
  lotus: fetchCurrentWorldLotusLevel,
  mountain: fetchCurrentMountainLevel,
  garden: fetchCurrentGardenLevel,
  forest: fetchCurrentForestLevel,
};

export function isPlayablePath(slug: string | undefined): slug is PlayablePathSlug {
  return !!slug && (PLAYABLE_PATH_ORDER as string[]).includes(slug);
}

// The path that must be completed before `slug` opens (null for the first path).
export function getPrerequisitePath(slug: PlayablePathSlug): PlayablePathSlug | null {
  const index = PLAYABLE_PATH_ORDER.indexOf(slug);
  if (index <= 0) return null;
  return PLAYABLE_PATH_ORDER[index - 1];
}

// Has the user cleared this path's Wisdom Gate?
export async function isPathComplete(slug: PlayablePathSlug): Promise<boolean> {
  const current = await CURRENT_LEVEL_FETCHERS[slug]();
  return current > PATH_WISDOM_GATE_LEVEL[slug];
}

export type PathGateStatus = {
  // Can the user complete levels on this path yet?
  unlocked: boolean;
  // The path that gates it (null when this is the first path / always open).
  prerequisite: PlayablePathSlug | null;
  prerequisiteTitle: string | null;
};

export type ActiveJourneyProgress = {
  slug: PlayablePathSlug;
  title: string;
  currentLevel: number;
  targetLevel: number;
  gateLevel: number;
  isFirstLotusLevel: boolean;
  isComplete: boolean;
};

// Resolve whether `slug` is unlocked by checking the prerequisite path's gate.
export async function fetchPathGateStatus(
  slug: PlayablePathSlug,
): Promise<PathGateStatus> {
  const prerequisite = getPrerequisitePath(slug);
  if (!prerequisite) {
    return { unlocked: true, prerequisite: null, prerequisiteTitle: null };
  }

  let unlocked = false;
  try {
    unlocked = await isPathComplete(prerequisite);
  } catch (err) {
    console.warn('Failed to resolve path gate status', err);
    unlocked = false;
  }

  return {
    unlocked,
    prerequisite,
    prerequisiteTitle: PATH_TITLE[prerequisite],
  };
}

// "Complete the Lotus Path first to unlock the Mountain Path."
export function buildPathLockMessage(status: PathGateStatus, ownSlug: PlayablePathSlug): string {
  if (status.unlocked || !status.prerequisiteTitle) {
    return 'Complete previous levels first!';
  }
  return `Complete the ${status.prerequisiteTitle} first to unlock the ${PATH_TITLE[ownSlug]}.`;
}

function normalizeCurrentLevel(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.floor(value));
}

function buildActiveJourneyProgress(
  slug: PlayablePathSlug,
  currentLevel: number,
): ActiveJourneyProgress {
  const gateLevel = PATH_WISDOM_GATE_LEVEL[slug];
  const normalizedCurrentLevel = normalizeCurrentLevel(currentLevel);
  return {
    slug,
    title: PATH_TITLE[slug],
    currentLevel: normalizedCurrentLevel,
    targetLevel: Math.min(normalizedCurrentLevel, gateLevel),
    gateLevel,
    isFirstLotusLevel: slug === 'lotus' && normalizedCurrentLevel <= 1,
    isComplete: normalizedCurrentLevel > gateLevel,
  };
}

export async function fetchActiveJourneyProgress(): Promise<ActiveJourneyProgress> {
  const progressByPath = await Promise.all(
    PLAYABLE_PATH_ORDER.map(async (slug) => {
      try {
        return [slug, normalizeCurrentLevel(await CURRENT_LEVEL_FETCHERS[slug]())] as const;
      } catch (err) {
        console.warn(`Failed to fetch ${PATH_TITLE[slug]} progress`, err);
        return [slug, 1] as const;
      }
    }),
  );

  const firstIncomplete = progressByPath.find(
    ([slug, currentLevel]) => currentLevel <= PATH_WISDOM_GATE_LEVEL[slug],
  );

  if (firstIncomplete) {
    return buildActiveJourneyProgress(firstIncomplete[0], firstIncomplete[1]);
  }

  const lastPath = progressByPath[progressByPath.length - 1];
  return buildActiveJourneyProgress(lastPath[0], lastPath[1]);
}
