import {
    ENGLISH_LYRICS as GAYATRI_ENGLISH,
    HINDI_LYRICS as GAYATRI_HINDI,
} from './gayatriMantraLyrics';
import type { LyricBlock } from './hanumanChalisaLyrics';
import {
    ENGLISH_LYRICS as HANUMAN_ENGLISH,
    HINDI_LYRICS as HANUMAN_HINDI,
} from './hanumanChalisaLyrics';
import {
    ENGLISH_LYRICS as SHIVA_ENGLISH,
    HINDI_LYRICS as SHIVA_HINDI,
} from './shivaTandavaStotramLyrics';

import { supabase } from '@/lib/supabase';
import { ImageSourcePropType } from 'react-native';

export type { LyricBlock };

const getAudioUrl = (filename: string) => {
  return supabase.storage.from('Prayers').getPublicUrl(filename).data.publicUrl;
};

export type Prayer = {
  id: string;
  name: string;
  nameHindi: string;
  duration: string;
  deity: string;
  thumbnail: ImageSourcePropType;
  audioFile: string;
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
    audioFile: getAudioUrl('Hanuman Chalisa.mp3'),
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
    audioFile: getAudioUrl('Gayatri Mantra.mp3'),
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
  {
    id: 'shiva-tandava-stotram',
    name: 'Shiva Tandava Stotram',
    nameHindi: 'शिव ताण्डव स्तोत्रम्',
    duration: '6:30',
    deity: 'Lord Shiva',
    thumbnail: require('@/assets/images/backgroundshiva.jpg'),
    audioFile: getAudioUrl('Shiva_Tandava_Stotram.mp3'),
    hindiLyrics: SHIVA_HINDI,
    englishLyrics: SHIVA_ENGLISH,
    shortDescription: 'A 14-verse hymn of Lord Shiva\'s cosmic dance, composed by Ravana',
    about:
      'The Shiva Tandava Stotram is a powerful Sanskrit hymn composed by the demon king Ravana in praise of Lord Shiva. It describes Shiva\'s cosmic dance — the Tandava — with vivid imagery of his matted locks, the Ganga flowing from his hair, the serpents adorning his neck, and the thundering beat of his damaru drum. It is one of the most celebrated hymns in Shaivism, revered for its rhythmic power and poetic grandeur.',
    whenToChant: [
      'On Mondays — the most sacred day for Lord Shiva',
      'During Maha Shivaratri — the great night of Shiva',
      'During Shravan month — Shiva\'s most auspicious month',
      'At Pradosh time (dusk on the 13th lunar day)',
      'Before entering a Shiva temple or beginning puja',
      'When seeking strength, courage, or divine protection',
    ],
    significance:
      'This stotram is unique because it was composed not by a saint or sage but by Ravana — a great scholar and devotee of Shiva. Despite being an adversary in the Ramayana, Ravana\'s devotion to Shiva was absolute. The stotram captures Shiva\'s Tandava — the dance of creation and destruction — and is said to fill the chanter with Shiva\'s fierce, liberating energy.',
    benefits: [
      'Invokes the protective and liberating energy of Lord Shiva',
      'Builds inner strength and fearlessness',
      'Destroys negative karma and obstacles',
      'Bestows eloquence, knowledge, and clarity of mind',
      'Deepens devotion and connection to the divine',
      'Said to grant moksha when chanted with sincere surrender',
    ],
    composer: 'Ravana',
    language: 'Sanskrit',
    verses: 14,
    era: 'Treta Yuga (ancient)',
  },
];

export const getPrayerById = (id: string): Prayer | undefined =>
  PRAYERS.find((p) => p.id === id);
