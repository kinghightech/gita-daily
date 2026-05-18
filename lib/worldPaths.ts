export type WorldPathBounds = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export type WorldPath = {
  slug: string;
  title: string;
  shortTitle: string;
  subtitle: string;
  region: string;
  accent: string;
  bounds: WorldPathBounds;
  overview: string;
  testLessons: string[];
};

export const WORLD_PATHS: WorldPath[] = [
  {
    slug: 'lotus',
    title: 'Lotus Path',
    shortTitle: 'Lotus Path',
    subtitle: 'Welcome to Hinduism',
    region: 'The big lotus pond region.',
    accent: '#F9A8D4',
    bounds: { top: 10, left: 7, width: 25, height: 34 },
    overview: 'A gentle first path for learning what Hinduism is and how its core ideas fit together.',
    testLessons: ['What Hinduism means', 'Dharma as a way of life', 'How to learn with respect'],
  },
  {
    slug: 'mountain',
    title: 'Mountain Path',
    shortTitle: 'Mountain Path',
    subtitle: 'Ultimate Reality and the Soul',
    region: 'The snowy mountain region.',
    accent: '#BAE6FD',
    bounds: { top: 8, left: 31, width: 19, height: 43 },
    overview: 'A high-level path about Brahman, Atman, and the deeper questions of reality.',
    testLessons: ['Brahman', 'Atman', 'The self beyond the body'],
  },
  {
    slug: 'garden',
    title: 'Garden Path',
    shortTitle: 'Garden Path',
    subtitle: 'Karma, Dharma, Samsara, Moksha',
    region: 'The green spiral garden region.',
    accent: '#86EFAC',
    bounds: { top: 10, left: 50, width: 18, height: 39 },
    overview: 'A path through the big ideas that explain action, duty, rebirth, and liberation.',
    testLessons: ['Karma and intention', 'Dharma in daily life', 'Moksha as liberation'],
  },
  {
    slug: 'forest',
    title: 'Forest Path',
    shortTitle: 'Forest Path',
    subtitle: 'Gods and Goddesses',
    region: 'The dense forest and jungle region.',
    accent: '#4ADE80',
    bounds: { top: 9, left: 66, width: 19, height: 42 },
    overview: 'A devotional path for meeting the major deities and the stories connected to them.',
    testLessons: ['Vishnu and avatars', 'Shiva and transformation', 'Devi and divine power'],
  },
  {
    slug: 'temple',
    title: 'Temple Path',
    shortTitle: 'Temple Path',
    subtitle: 'Worship, Puja, and Mandir Life',
    region: 'The large golden temple region.',
    accent: '#FBBF24',
    bounds: { top: 20, left: 80, width: 18, height: 38 },
    overview: 'A practical path about worship, temple life, offerings, and sacred spaces.',
    testLessons: ['What puja is', 'Inside a mandir', 'Offerings and devotion'],
  },
  {
    slug: 'river',
    title: 'River Path',
    shortTitle: 'River Path',
    subtitle: 'Sacred Rivers and Pilgrimage',
    region: 'The river island region.',
    accent: '#38BDF8',
    bounds: { top: 35, left: 1, width: 30, height: 29 },
    overview: 'A path about sacred geography, pilgrimage, and the purifying symbolism of rivers.',
    testLessons: ['The Ganga', 'Pilgrimage places', 'Water and purification'],
  },
  {
    slug: 'library',
    title: 'Library Path',
    shortTitle: 'Library Path',
    subtitle: 'Scriptures and Stories',
    region: 'The blue library and learning region.',
    accent: '#93C5FD',
    bounds: { top: 62, left: 2, width: 30, height: 31 },
    overview: 'A reading path for the Vedas, Upanishads, epics, Puranas, and the Bhagavad Gita.',
    testLessons: ['Types of scripture', 'The epics', 'How stories teach dharma'],
  },
  {
    slug: 'sky',
    title: 'Sky Path',
    shortTitle: 'Sky Path',
    subtitle: 'Cosmic Worlds and Time',
    region: 'The white spiral sky region.',
    accent: '#E0F2FE',
    bounds: { top: 54, left: 31, width: 21, height: 40 },
    overview: 'A cosmic path about time cycles, lokas, devas, and the scale of Hindu imagination.',
    testLessons: ['Yugas and cycles', 'Lokas', 'Devas and cosmic order'],
  },
  {
    slug: 'village',
    title: 'Village Path',
    shortTitle: 'Village Path',
    subtitle: 'Daily Dharma and Family Traditions',
    region: 'The village and fields region.',
    accent: '#FDE68A',
    bounds: { top: 54, left: 54, width: 21, height: 40 },
    overview: 'A home-life path about family customs, food, festivals, values, and daily practice.',
    testLessons: ['Home shrines', 'Family rituals', 'Dharma in ordinary life'],
  },
  {
    slug: 'city',
    title: 'City Path',
    shortTitle: 'City Path',
    subtitle: 'Modern Hindu Life',
    region: 'The modern blue city region.',
    accent: '#60A5FA',
    bounds: { top: 60, left: 76, width: 22, height: 33 },
    overview: 'A modern path about Hindu practice in school, work, community, and the wider world.',
    testLessons: ['Hinduism today', 'Community life', 'Living values in public'],
  },
];

export function getWorldPathBySlug(slug: string | undefined) {
  if (!slug) {
    return undefined;
  }

  return WORLD_PATHS.find((path) => path.slug === slug);
}
