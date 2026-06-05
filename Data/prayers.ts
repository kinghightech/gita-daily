import {
    ENGLISH_LYRICS as GAYATRI_ENGLISH,
    HINDI_LYRICS as GAYATRI_HINDI,
} from './gayatriMantraLyrics';
import {
    ENGLISH_LYRICS as GANESHA_ENGLISH,
    HINDI_LYRICS as GANESHA_HINDI,
} from './jaiGaneshaDevaLyrics';
import type { LyricBlock } from './hanumanChalisaLyrics';
import {
    ENGLISH_LYRICS as HANUMAN_ENGLISH,
    HINDI_LYRICS as HANUMAN_HINDI,
} from './hanumanChalisaLyrics';
import {
    ENGLISH_LYRICS as MAHA_MRITYUNJAYA_ENGLISH,
    HINDI_LYRICS as MAHA_MRITYUNJAYA_HINDI,
} from './mahaMrityunjayaMantraLyrics';
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
    thumbnail: require('@/assets/images/backgroundprayer.png'),
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
    id: 'jai-ganesha-deva',
    name: 'Jai Ganesha Deva',
    nameHindi: 'जय गणेश देवा',
    duration: '3:36',
    deity: 'Lord Ganesha',
    thumbnail: require('@/assets/images/bavckgroundganesha.jpg'),
    audioFile: getAudioUrl('ganeshadeva.mp3'),
    hindiLyrics: GANESHA_HINDI,
    englishLyrics: GANESHA_ENGLISH,
    shortDescription: 'The beloved aarti of Lord Ganesha, sung in homes and temples across India',
    about:
      'Jai Ganesh Deva is the most cherished aarti dedicated to Lord Ganesha, the remover of obstacles and the deity invoked before every beginning. Sung at the close of worship in homes and temples across India, it praises Ganesha as the one-tusked, compassionate, four-armed lord — son of Parvati and Mahadeva (Shiva) — and lovingly recounts the offerings and miracles associated with him.',
    whenToChant: [
      'At the very start of any new venture, journey, or undertaking',
      'During the closing aarti of daily puja',
      'On Wednesdays — the day devoted to Lord Ganesha',
      'During Ganesh Chaturthi — the grand festival of his birth',
      'On Sankashti and Vinayaka Chaturthi each month',
      'Whenever you seek to clear obstacles and begin with an auspicious mind',
    ],
    significance:
      'Lord Ganesha is honored first among all deities — no worship is considered complete without invoking him at the outset. This aarti celebrates him as Vighnaharta, the remover of obstacles, and as the giver of wisdom and success. Its simple, melodic verses make it one of the first devotional songs many Hindus learn, binding families together in shared worship.',
    benefits: [
      'Invokes Ganesha to clear obstacles from your path',
      'Blesses new beginnings with success and good fortune',
      'Bestows wisdom, focus, and clarity of intellect',
      'Brings auspiciousness and positive energy into the home',
      'Calms the mind and steadies the heart before important work',
      'Deepens family devotion through shared, joyful chanting',
    ],
    composer: 'Pandit Shyamlal Sharma',
    language: 'Hindi',
    verses: 4,
    era: '19th century CE',
  },
  {
    id: 'maha-mrityunjaya-mantra',
    name: 'Maha Mrityunjaya Mantra',
    nameHindi: 'महामृत्युञ्जय मन्त्र',
    duration: '3:26',
    deity: 'Lord Shiva',
    thumbnail: require('@/assets/images/Backgroundmahamrityunjaya.png'),
    audioFile: getAudioUrl('Maha Mrityunjaya Mantra .mp3'),
    hindiLyrics: MAHA_MRITYUNJAYA_HINDI,
    englishLyrics: MAHA_MRITYUNJAYA_ENGLISH,
    shortDescription: 'The great death-conquering mantra of Lord Shiva from the Rigveda',
    about:
      'The Maha Mrityunjaya Mantra is one of the most ancient and powerful mantras in the Vedic tradition, found in the Rigveda (7.59.12) and attributed to the sage Vasishtha. Also known as the Tryambakam Mantra, it is addressed to the three-eyed Lord Shiva — the conqueror of death — and is a prayer for liberation from the fear of death and the cycle of rebirth. Tradition holds that the sage Markandeya was blessed with this mantra and used it to overcome his destined death, becoming immortal through Shiva\'s grace.',
    whenToChant: [
      'On Mondays and during Maha Shivaratri — the most sacred times for Shiva worship',
      'During Shravan month, especially on Mondays',
      'At Pradosh time (dusk on the 13th lunar day of each fortnight)',
      'When facing illness, danger, grief, or the fear of death',
      'During times of healing — for oneself or as a prayer for others',
      'Daily at sunrise, as part of personal Shiva puja or meditation',
    ],
    significance:
      'This mantra addresses Shiva as Tryambaka — the Three-eyed One — whose third eye sees beyond the illusions of birth and death. The central metaphor is profound: just as a ripened cucumber naturally falls free from the vine without effort or violence, the sincere devotee is gently liberated from the bondage of mortality. The mantra does not simply ask for longer life — it asks for liberation from the cycle of death and rebirth into the amrit, the immortal divine essence.',
    benefits: [
      'Protects from premature death and severe illness',
      'Brings healing and restoration of health and vitality',
      'Removes deep-seated fear and grief',
      'Liberates the mind from attachment to the body and mortality',
      'Said to grant moksha — freedom from the cycle of rebirth',
      'Bestows Shiva\'s grace upon both the chanter and those prayed for',
    ],
    composer: 'Rishi Vasishtha / Vedic tradition',
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
