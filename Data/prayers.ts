import type { LyricBlock } from './hanumanChalisaLyrics';
import {
  HINDI_LYRICS as HANUMAN_HINDI,
  ENGLISH_LYRICS as HANUMAN_ENGLISH,
} from './hanumanChalisaLyrics';
import {
  HINDI_LYRICS as GAYATRI_HINDI,
  ENGLISH_LYRICS as GAYATRI_ENGLISH,
} from './gayatriMantraLyrics';

export type { LyricBlock };

export type Prayer = {
  id: string;
  name: string;
  nameHindi: string;
  duration: string;
  deity: string;
  thumbnail: ReturnType<typeof require>;
  audioFile: ReturnType<typeof require>;
  hindiLyrics: LyricBlock[];
  englishLyrics: LyricBlock[];
  shortDescription: string;
  about: string;
  whenToChant: string[];
  significance: string;
  benefits: string[];
  composer: string;
  language: string;
  verses: number;
  era: string;
};

export const PRAYERS: Prayer[] = [
  {
    id: 'hanuman-chalisa',
    name: 'Hanuman Chalisa',
    nameHindi: 'हनुमान चालीसा',
    duration: '4:42',
    deity: 'Lord Hanuman',
    thumbnail: require('@/assets/images/backgroundprayer.jpg'),
    audioFile: require('@/assets/images/Hanuman Chalisa.mp3'),
    hindiLyrics: HANUMAN_HINDI,
    englishLyrics: HANUMAN_ENGLISH,
    shortDescription: 'A 40-verse devotional hymn to Lord Hanuman by Tulsidas',
    about:
      'The Hanuman Chalisa is a 40-verse devotional hymn dedicated to Lord Hanuman. Composed in the 16th century by the saint-poet Goswami Tulsidas in the Awadhi dialect, it is among the most recited prayers in all of Hinduism — chanted daily by millions across the world. The word "chalisa" means forty, referring to its 40 verses of praise.',
    whenToChant: [
      'Every Tuesday and Saturday — the most auspicious days for Hanuman worship',
      'Early morning after bathing, ideally facing east',
      'During times of difficulty, fear, or uncertainty',
      'Before important events, examinations, or long journeys',
      'On Hanuman Jayanti — the birthday of Lord Hanuman',
      'Any time you seek strength, protection, or clarity of mind',
    ],
    significance:
      'Lord Hanuman embodies the perfect devotee — boundless strength, unwavering devotion, and selfless service. The Chalisa invokes these qualities and is believed to create a divine shield around the devotee. Because Hanuman is seen as the gateway to Lord Ram\'s grace, chanting his Chalisa is said to bring the blessings of both.',
    benefits: [
      'Grants courage and removes all forms of fear',
      'Provides protection from negative energies',
      'Sharpens the mind and increases focus',
      'Brings peace and positive energy into the home',
      'Said to relieve suffering and illness when chanted with sincerity',
      'Strengthens devotion and deepens one\'s spiritual practice',
    ],
    composer: 'Goswami Tulsidas',
    language: 'Awadhi (Old Hindi)',
    verses: 40,
    era: '16th century CE',
  },
  {
    id: 'gayatri-mantra',
    name: 'Gayatri Mantra',
    nameHindi: 'गायत्री मंत्र',
    duration: '5:00',
    deity: 'Goddess Gayatri / Surya',
    thumbnail: require('@/assets/images/gayatrimantra.png'),
    audioFile: require('@/assets/images/Gayatri Mantra.mp3'),
    hindiLyrics: GAYATRI_HINDI,
    englishLyrics: GAYATRI_ENGLISH,
    shortDescription: 'The most sacred Vedic mantra, a prayer for divine light and wisdom',
    about:
      'The Gayatri Mantra is one of the oldest and most revered mantras in all of Hinduism, originating in the Rigveda (3.62.10). Attributed to the sage Vishwamitra, it is a universal prayer for enlightenment — a salutation to the divine light of the sun (Savitur) and a request for it to illuminate the mind and guide the intellect toward righteousness.',
    whenToChant: [
      'At sunrise (Pratah Sandhya) — the most sacred time for this mantra',
      'At noon (Madhyana Sandhya) and at sunset (Sayam Sandhya)',
      'During daily meditation or pranayama practice',
      'At the beginning of any important work or study',
      'On Gayatri Jayanti and Guru Purnima',
      'Whenever you seek clarity, wisdom, or divine guidance',
    ],
    significance:
      'The Gayatri Mantra is addressed to Savitur, the solar deity who represents divine light and the source of all life. It is not a prayer for material boons but a petition for the highest gift — an illuminated intellect. Traditionally initiated at the Upanayana ceremony, it is considered the essence of all the Vedas.',
    benefits: [
      'Purifies the mind and sharpens concentration',
      'Develops wisdom and clarity of thought',
      'Removes ignorance and dispels inner darkness',
      'Cultivates a calm, focused, and sattvic mind',
      'Said to protect the chanter from all directions',
      'Deepens connection to the cosmic divine energy',
    ],
    composer: 'Sage Vishwamitra',
    language: 'Vedic Sanskrit',
    verses: 1,
    era: 'Vedic (~1500 BCE)',
  },
];

export const getPrayerById = (id: string): Prayer | undefined =>
  PRAYERS.find((p) => p.id === id);
