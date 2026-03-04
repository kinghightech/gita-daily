// @ts-nocheck
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import LevelContent from './LevelContent';
import LotusLevel from './LotusLevel';

const LEVELS_DATA = [
{
  id: 1,
  title: "The Foundations of Hinduism",
  subtitle: "Origins & Core Beliefs",
  image: "https://images.unsplash.com/photo-1548013146-72479768bada?w=800",
  content: `Hinduism is one of the world's oldest religions, with roots dating back over 4,000 years to the Indus Valley civilization. Unlike many religions, Hinduism has no single founder—it evolved gradually through centuries of spiritual exploration.

The word "Hindu" comes from the Sanskrit word "Sindhu," referring to the Indus River. The religion encompasses a rich tapestry of philosophies, rituals, and traditions.

**Core Beliefs:**
• **Brahman** - The ultimate reality, the one supreme cosmic power
• **Atman** - The eternal soul present in all living beings
• **Samsara** - The cycle of birth, death, and rebirth
• **Moksha** - Liberation from the cycle of rebirth

Hinduism is unique in its acceptance of multiple paths to the divine, recognizing that different people may connect with the sacred in different ways.`,
  quiz: [
  { question: "How old is Hinduism approximately?", options: ["1,000 years", "2,000 years", "4,000+ years", "500 years"], correct: 2 },
  { question: "What does 'Moksha' mean?", options: ["Rebirth", "Liberation", "Prayer", "Sacrifice"], correct: 1 },
  { question: "What is Brahman?", options: ["A Hindu priest", "The ultimate reality", "A sacred text", "A temple"], correct: 1 }]

},
{
  id: 2,
  title: "Ahimsa - Non-Violence",
  subtitle: "The Path of Compassion",
  image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800",
  content: `Ahimsa (अहिंसा) is one of the most fundamental principles in Hindu philosophy, meaning "non-violence" or "non-harming." It extends beyond physical violence to include thoughts, words, and actions.

**The Depth of Ahimsa:**
Ahimsa isn't just about not hurting others—it's about cultivating a deep reverence for all life. This principle influenced Mahatma Gandhi's philosophy of peaceful resistance.

**Practicing Ahimsa:**
• Showing compassion to all beings
• Avoiding harmful speech and gossip
• Choosing forgiveness over revenge
• Respecting nature and the environment
• Many Hindus practice vegetarianism as an expression of Ahimsa`,
  quiz: [
  { question: "What does Ahimsa mean?", options: ["Truth", "Non-violence", "Duty", "Karma"], correct: 1 },
  { question: "Who was famously influenced by Ahimsa?", options: ["Buddha", "Mahatma Gandhi", "Krishna", "Shiva"], correct: 1 },
  { question: "Ahimsa applies to:", options: ["Only physical actions", "Only thoughts", "Thoughts, words, and actions", "Only animals"], correct: 2 }]

},
{
  id: 3,
  title: "Satya - Truth",
  subtitle: "Living Authentically",
  image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800",
  content: `Satya (सत्य) means "truth" and is considered one of the highest virtues in Hindu philosophy. The famous phrase "Satyameva Jayate" (Truth alone triumphs) is India's national motto.

**Understanding Satya:**
Satya goes beyond simply not lying. It encompasses:
• Speaking truth with kindness
• Living authentically according to your nature
• Recognizing the ultimate truth of existence
• Aligning actions with words`,
  quiz: [
  { question: "What does 'Satyameva Jayate' mean?", options: ["Truth is power", "Truth alone triumphs", "Speak the truth", "Truth is God"], correct: 1 },
  { question: "Satya encompasses:", options: ["Only not lying", "Only speaking truth", "Living authentically and honest actions", "Only religious truth"], correct: 2 },
  { question: "What virtue is Satya considered?", options: ["The lowest", "One of the highest", "Optional", "Modern only"], correct: 1 }]

},
{
  id: 4,
  title: "Karma & Dharma",
  subtitle: "Action and Purpose",
  image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800",
  content: `**Karma (कर्म) - The Law of Action:**
Karma literally means "action" and refers to the universal law of cause and effect. Every action creates a corresponding reaction that shapes our future.

**Dharma (धर्म) - Righteous Duty:**
Dharma is your sacred duty, the right way of living. The Bhagavad Gita teaches that performing one's dharma without attachment to results is the key to spiritual growth.`,
  quiz: [
  { question: "What does Karma literally mean?", options: ["Fate", "Destiny", "Action", "Punishment"], correct: 2 },
  { question: "Dharma refers to:", options: ["Religious rituals only", "Righteous duty and purpose", "Meditation", "Fasting"], correct: 1 },
  { question: "The Gita teaches to perform dharma:", options: ["For rewards", "Without attachment to results", "Only when convenient", "For fame"], correct: 1 }]

},
{
  id: 5,
  title: "Vasudhaiva Kutumbakam",
  subtitle: "The World is One Family",
  image: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800",
  content: `Vasudhaiva Kutumbakam (वसुधैव कुटुम्बकम्) is a Sanskrit phrase meaning "The world is one family." This ancient wisdom encapsulates the Hindu vision of universal brotherhood.

**The Philosophy:**
• All humans share the same divine essence (Atman)
• National and cultural boundaries are human-made
• True wisdom sees no distinction between "us" and "them"
• Compassion should extend to all beings`,
  quiz: [
  { question: "What does Vasudhaiva Kutumbakam mean?", options: ["India is great", "The world is one family", "Respect elders", "Worship nature"], correct: 1 },
  { question: "This phrase comes from:", options: ["Bhagavad Gita", "Ramayana", "Maha Upanishad", "Vedas"], correct: 2 },
  { question: "The philosophy teaches that all beings:", options: ["Are separate", "Share divine essence", "Should compete", "Are equal in wealth"], correct: 1 }]

},
{
  id: 6,
  title: "The Trimurti",
  subtitle: "Brahma, Vishnu & Shiva",
  image: "https://images.unsplash.com/photo-1567591370504-81e8918fb7c2?w=800",
  content: `The Trimurti represents the three main forms of the Supreme Being in Hinduism, each responsible for different cosmic functions.

**Brahma - The Creator:**
Brahma creates the universe and all living beings. He is often depicted with four heads representing the four Vedas.

**Vishnu - The Preserver:**
Vishnu maintains and protects the universe. He has incarnated on Earth in various forms (avatars) including Rama and Krishna.

**Shiva - The Destroyer:**
Shiva destroys the universe at the end of each cycle, allowing for new creation. He represents transformation and regeneration.`,
  quiz: [
  { question: "What is Brahma's role?", options: ["Destroyer", "Creator", "Preserver", "Teacher"], correct: 1 },
  { question: "Vishnu is known as the:", options: ["Creator", "Destroyer", "Preserver", "Dancer"], correct: 2 },
  { question: "Shiva's destruction allows for:", options: ["Permanent end", "New creation", "Suffering", "Chaos"], correct: 1 }]

},
{
  id: 7,
  title: "The Sacred Vedas",
  subtitle: "Ancient Knowledge",
  image: "https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=800",
  content: `The Vedas are the oldest sacred texts of Hinduism, composed over 3,500 years ago. They form the foundation of Hindu philosophy and practice.

**The Four Vedas:**
• **Rigveda** - Hymns and mantras praising the deities
• **Yajurveda** - Rituals and ceremonies
• **Samaveda** - Musical chants and melodies
• **Atharvaveda** - Spells, charms, and daily life wisdom

The Vedas are considered "Shruti" - knowledge that was heard or revealed to ancient sages through deep meditation.`,
  quiz: [
  { question: "How many Vedas are there?", options: ["Two", "Three", "Four", "Five"], correct: 2 },
  { question: "The Rigveda contains:", options: ["Rituals", "Hymns and mantras", "Spells", "Stories"], correct: 1 },
  { question: "'Shruti' means knowledge that was:", options: ["Written", "Heard/revealed", "Imagined", "Forgotten"], correct: 1 }]

},
{
  id: 8,
  title: "Yoga - Union with Divine",
  subtitle: "Paths to Enlightenment",
  image: "https://images.unsplash.com/photo-1545389336-cf090694435e?w=800",
  content: `Yoga means "union" - the union of individual consciousness with universal consciousness. It offers multiple paths to spiritual realization.

**The Four Main Paths:**
• **Karma Yoga** - Path of selfless action
• **Bhakti Yoga** - Path of devotion and love
• **Jnana Yoga** - Path of knowledge and wisdom
• **Raja Yoga** - Path of meditation and mental control

Each path suits different temperaments, but all lead to the same goal: liberation (Moksha).`,
  quiz: [
  { question: "What does 'Yoga' mean?", options: ["Exercise", "Union", "Breathing", "Flexibility"], correct: 1 },
  { question: "Bhakti Yoga is the path of:", options: ["Action", "Knowledge", "Devotion", "Meditation"], correct: 2 },
  { question: "All yoga paths lead to:", options: ["Physical fitness", "Wealth", "Moksha (liberation)", "Fame"], correct: 2 }]

},
{
  id: 9,
  title: "The Bhagavad Gita",
  subtitle: "Song of the Divine",
  image: "https://images.unsplash.com/photo-1609619385002-f40f1df9b7eb?w=800",
  content: `The Bhagavad Gita is a 700-verse Hindu scripture that is part of the epic Mahabharata. It presents a conversation between Prince Arjuna and Lord Krishna on the battlefield of Kurukshetra.

**Key Teachings:**
• Perform your duty without attachment to results
• The soul (Atman) is eternal and indestructible
• Multiple paths lead to the divine
• Equanimity in success and failure

The Gita addresses the moral dilemmas of life and provides guidance for living a righteous life.`,
  quiz: [
  { question: "The Gita is a conversation between:", options: ["Rama and Sita", "Arjuna and Krishna", "Shiva and Parvati", "Brahma and Vishnu"], correct: 1 },
  { question: "How many verses are in the Gita?", options: ["100", "500", "700", "1000"], correct: 2 },
  { question: "The Gita teaches to perform duty:", options: ["For rewards", "Without attachment", "Only when easy", "For recognition"], correct: 1 }]

},
{
  id: 10,
  title: "Puja & Worship",
  subtitle: "Connecting with the Divine",
  image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800",
  content: `Puja is the ceremonial worship of deities, involving offerings of flowers, incense, light, and food. It can be performed at home or in temples.

**Elements of Puja:**
• **Dhyana** - Meditation on the deity
• **Avahana** - Inviting the divine presence
• **Offerings** - Flowers, fruits, incense, light (aarti)
• **Mantras** - Sacred chants and prayers

Puja helps devotees establish a personal relationship with the divine and brings the sacred into daily life.`,
  quiz: [
  { question: "Puja involves:", options: ["Only meditation", "Ceremonial worship with offerings", "Only fasting", "Only reading"], correct: 1 },
  { question: "Aarti is:", options: ["A flower", "Light offering", "A fruit", "A mantra"], correct: 1 },
  { question: "Puja can be performed:", options: ["Only in temples", "Only at home", "At home or temples", "Only by priests"], correct: 2 }]

},
{
  id: 11,
  title: "The Ramayana",
  subtitle: "The Journey of Lord Rama",
  image: "https://images.unsplash.com/photo-1609619385002-f40f1df9b7eb?w=800",
  content: `The Ramayana is one of the two great Hindu epics, composed by the sage Valmiki. It tells the story of Lord Rama, an avatar of Vishnu.

**The Story:**
Prince Rama is exiled from his kingdom for 14 years. His wife Sita is abducted by the demon king Ravana. With his brother Lakshmana and the monkey god Hanuman, Rama rescues Sita and defeats Ravana.

**Key Characters:**
• **Rama** - The ideal man (Maryada Purushottam)
• **Sita** - Symbol of virtue and devotion
• **Lakshmana** - Model of brotherly love
• **Hanuman** - Perfect devotee`,
  quiz: [
  { question: "Who wrote the Ramayana?", options: ["Vyasa", "Valmiki", "Tulsidas", "Kalidasa"], correct: 1 },
  { question: "Rama is called Maryada Purushottam, meaning:", options: ["Great warrior", "Ideal/perfect man", "Divine king", "Wise sage"], correct: 1 },
  { question: "Hanuman represents:", options: ["Strength only", "Perfect devotion", "Revenge", "Wealth"], correct: 1 }]

},
{
  id: 12,
  title: "The Mahabharata",
  subtitle: "The Great Epic of India",
  image: "https://images.unsplash.com/photo-1567591370504-81e8918fb7c2?w=800",
  content: `The Mahabharata, composed by Sage Vyasa, is the longest epic poem ever written with over 100,000 verses. It contains the Bhagavad Gita.

**The Central Conflict:**
The epic tells of the war between two groups of cousins—the Pandavas (five brothers) and the Kauravas (one hundred brothers)—for the throne of Hastinapura.

**Key Themes:**
• The complexity of dharma in difficult situations
• The consequences of adharma (unrighteousness)
• The importance of divine guidance
• Victory of good over evil`,
  quiz: [
  { question: "Who composed the Mahabharata?", options: ["Valmiki", "Vyasa", "Tulsidas", "Kalidasa"], correct: 1 },
  { question: "How many Pandava brothers were there?", options: ["Three", "Four", "Five", "Seven"], correct: 2 },
  { question: "The Bhagavad Gita is part of:", options: ["Ramayana", "Mahabharata", "Vedas", "Upanishads"], correct: 1 }]

},
{
  id: 13,
  title: "The Upanishads",
  subtitle: "Secret Teachings of Wisdom",
  image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800",
  content: `The Upanishads are a collection of over 200 ancient philosophical texts that form the theoretical basis of Hinduism. The word "Upanishad" means "sitting down near" a teacher to receive secret knowledge.

**Core Teachings:**
• **Brahman** - The ultimate, unchanging reality behind the universe
• **Atman** - The individual soul, which is ultimately identical to Brahman
• **Maya** - The illusory nature of the physical world
• **Moksha** - Liberation from the cycle of rebirth through self-knowledge

**The Great Sayings (Mahavakyas):**
• "Tat Tvam Asi" - You are That (Brahman)
• "Aham Brahmasmi" - I am Brahman`,
  quiz: [
  { question: "What does 'Upanishad' mean?", options: ["Sacred text", "Sitting near a teacher", "Ancient wisdom", "Divine knowledge"], correct: 1 },
  { question: "'Tat Tvam Asi' means:", options: ["I am God", "You are That", "Worship the divine", "Seek truth"], correct: 1 },
  { question: "The Upanishads teach liberation through:", options: ["Rituals only", "Self-knowledge", "Wealth", "Physical strength"], correct: 1 }]

},
{
  id: 14,
  title: "Hindu Temples",
  subtitle: "Sacred Architecture & Worship",
  image: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800",
  content: `Hindu temples are more than buildings—they are considered the earthly abodes of the divine, designed as microcosms of the universe.

**Temple Architecture:**
• **Garbhagriha** - The innermost chamber housing the main deity
• **Shikhara/Vimana** - The towering spire symbolizing Mount Meru
• **Mandapa** - Assembly hall for devotees
• **Gopuram** - Elaborate gateway towers

**Worship Practices:**
• **Darshan** - The sacred act of seeing the deity
• **Pradakshina** - Circumambulation clockwise
• **Prasad** - Blessed food offerings
• **Aarti** - Waving of lights before the deity`,
  quiz: [
  { question: "What is the Garbhagriha?", options: ["Temple tower", "Innermost sanctum", "Assembly hall", "Gateway"], correct: 1 },
  { question: "Darshan means:", options: ["Offering food", "Seeing the deity", "Circumambulation", "Meditation"], correct: 1 },
  { question: "The temple spire represents:", options: ["The sun", "Mount Meru", "A lotus", "The moon"], correct: 1 }]

},
{
  id: 15,
  title: "Meditation & Mantras",
  subtitle: "Practices for Inner Peace",
  image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800",
  content: `Meditation (Dhyana) and mantras are central practices in Hindu spirituality for calming the mind and achieving union with the divine.

**Types of Meditation:**
• **Japa** - Repetition of a mantra using mala beads (108 repetitions)
• **Trataka** - Gazing meditation on a candle flame
• **Mindfulness** - Observing thoughts without attachment
• **Pranayama** - Controlling the breath to calm the mind

**Sacred Mantras:**
• **Om (ॐ)** - The primordial sound of the universe
• **Om Namah Shivaya** - "I bow to Shiva"
• **Gayatri Mantra** - Ancient Vedic prayer for enlightenment`,
  quiz: [
  { question: "What is Japa?", options: ["Yoga posture", "Mantra repetition", "Temple worship", "Fasting"], correct: 1 },
  { question: "How many beads are in a traditional mala?", options: ["54", "72", "108", "216"], correct: 2 },
  { question: "Om is described as:", options: ["A god's name", "Primordial sound", "A prayer", "A temple"], correct: 1 },
  { question: "Pranayama involves:", options: ["Physical postures", "Breath control", "Chanting", "Fasting"], correct: 1 },
  { question: "The goal of meditation is to:", options: ["Sleep better", "Still the mind", "Gain wealth", "Become famous"], correct: 1 }]

},
{
  id: 16,
  title: "The Avatars of Vishnu",
  subtitle: "Divine Incarnations",
  image: "https://images.unsplash.com/photo-1567591370504-81e8918fb7c2?w=800",
  content: `Lord Vishnu descends to Earth in various forms called Avatars to restore cosmic order whenever evil threatens good.

**The Dashavatara (Ten Avatars):**
1. **Matsya (Fish)** - Saved the Vedas from a great flood
2. **Kurma (Tortoise)** - Supported Mount Mandara
3. **Varaha (Boar)** - Rescued Earth from a demon
4. **Narasimha (Man-Lion)** - Protected devotee Prahlada
5. **Vamana (Dwarf)** - Subdued the demon king Bali
6. **Parashurama** - Warrior sage
7. **Rama** - The ideal king
8. **Krishna** - Teacher of the Bhagavad Gita
9. **Buddha** - Taught compassion
10. **Kalki** - Future avatar`,
  quiz: [
  { question: "How many main avatars does Vishnu have?", options: ["Five", "Seven", "Ten", "Twelve"], correct: 2 },
  { question: "Which avatar is a fish?", options: ["Kurma", "Matsya", "Varaha", "Vamana"], correct: 1 },
  { question: "Narasimha is:", options: ["A fish", "A tortoise", "Man-lion", "A boar"], correct: 2 },
  { question: "Rama is the hero of which epic?", options: ["Mahabharata", "Ramayana", "Vedas", "Upanishads"], correct: 1 },
  { question: "Kalki is:", options: ["A past avatar", "Future avatar", "Not an avatar", "A demon"], correct: 1 }]

},
{
  id: 17,
  title: "Hindu Festivals",
  subtitle: "Celebrating the Divine",
  image: "https://images.unsplash.com/photo-1604608672516-f1b9b1c04f95?w=800",
  content: `Hindu festivals are vibrant celebrations that mark significant religious events, honor deities, and strengthen community bonds.

**Major Festivals:**
• **Diwali** - Festival of Lights, celebrates victory of light over darkness
• **Holi** - Festival of Colors, celebrates arrival of spring
• **Navaratri** - Nine nights dedicated to Goddess Durga
• **Ganesh Chaturthi** - Birthday of Lord Ganesha
• **Janmashtami** - Celebrates the birth of Lord Krishna
• **Maha Shivaratri** - The Great Night of Shiva`,
  quiz: [
  { question: "Diwali is also called:", options: ["Festival of Colors", "Festival of Lights", "Festival of Spring", "Festival of Dance"], correct: 1 },
  { question: "Holi celebrates:", options: ["Rama's return", "Spring and good over evil", "Shiva's marriage", "Krishna's birth"], correct: 1 },
  { question: "Navaratri means:", options: ["Five nights", "Seven nights", "Nine nights", "Ten nights"], correct: 2 },
  { question: "Ganesh Chaturthi honors:", options: ["Vishnu", "Shiva", "Ganesha", "Krishna"], correct: 2 },
  { question: "Janmashtami celebrates:", options: ["Rama's birth", "Krishna's birth", "Ganesha's birth", "Shiva's birth"], correct: 1 }]

},
{
  id: 18,
  title: "The Caste System & Varna",
  subtitle: "Understanding Social Order",
  image: "https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=800",
  content: `The Varna system was originally a classification based on qualities (gunas) and duties (karma), not birth.

**The Four Varnas:**
• **Brahmins** - Teachers, priests, scholars
• **Kshatriyas** - Warriors, rulers, administrators
• **Vaishyas** - Merchants, farmers, artisans
• **Shudras** - Service providers, laborers

The Bhagavad Gita (4.13) states that varna is determined by one's qualities and work, NOT by birth. Many Hindu reformers including Swami Vivekananda and Mahatma Gandhi condemned caste-based discrimination.`,
  quiz: [
  { question: "How many varnas are there?", options: ["Two", "Three", "Four", "Five"], correct: 2 },
  { question: "According to the Gita, varna is based on:", options: ["Birth only", "Wealth", "Qualities and work", "Location"], correct: 2 },
  { question: "Brahmins traditionally were:", options: ["Warriors", "Teachers and priests", "Merchants", "Laborers"], correct: 1 },
  { question: "Swami Vivekananda:", options: ["Supported caste discrimination", "Condemned caste discrimination", "Created the caste system", "Ignored it"], correct: 1 },
  { question: "Vasudhaiva Kutumbakam means:", options: ["Caste is important", "The world is one family", "Brahmins are supreme", "Work hard"], correct: 1 }]

},
{
  id: 19,
  title: "Sacred Rivers & Pilgrimages",
  subtitle: "Holy Geography of India",
  image: "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=800",
  content: `In Hinduism, certain rivers and places are considered sacred, where the divine presence is especially strong.

**The Sacred Rivers:**
• **Ganga** - The holiest river, believed to wash away sins
• **Yamuna** - Associated with Lord Krishna's childhood
• **Saraswati** - Mythical river representing knowledge

**Important Pilgrimage Sites:**
• **Char Dham** - Four sacred sites: Badrinath, Dwarka, Puri, Rameswaram
• **Varanasi** - City of Lord Shiva where liberation is granted
• **Prayagraj** - Confluence of Ganga, Yamuna, and Saraswati
• **Kumbh Mela** - World's largest religious gathering, held every 12 years`,
  quiz: [
  { question: "The holiest river in Hinduism is:", options: ["Yamuna", "Ganga", "Narmada", "Kaveri"], correct: 1 },
  { question: "Varanasi is associated with:", options: ["Vishnu", "Brahma", "Shiva", "Ganesha"], correct: 2 },
  { question: "How many sites make up Char Dham?", options: ["Two", "Three", "Four", "Five"], correct: 2 },
  { question: "Kumbh Mela happens every:", options: ["Year", "6 years", "12 years", "100 years"], correct: 2 },
  { question: "Haridwar means:", options: ["Holy water", "Gateway to God", "Shiva's home", "Sacred mountain"], correct: 1 }]

},
{
  id: 20,
  title: "Moksha - Liberation",
  subtitle: "The Ultimate Goal",
  image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800",
  content: `Moksha is the ultimate goal of human life in Hinduism - liberation from the cycle of birth, death, and rebirth (samsara).

**The Four Paths to Moksha:**
1. **Karma Yoga** - Path of selfless action
2. **Bhakti Yoga** - Path of devotion and loving surrender to God
3. **Jnana Yoga** - Path of self-inquiry and knowledge
4. **Raja Yoga** - Path of meditation and mind control

The individual soul (Atman) realizes its true nature as identical with Brahman. This is like a drop of water merging back into the ocean.`,
  quiz: [
  { question: "Moksha means:", options: ["Wealth", "Liberation", "Power", "Fame"], correct: 1 },
  { question: "Samsara is:", options: ["Heaven", "Cycle of rebirth", "A festival", "A deity"], correct: 1 },
  { question: "Bhakti Yoga is the path of:", options: ["Knowledge", "Action", "Devotion", "Meditation"], correct: 2 },
  { question: "Sat-Chit-Ananda means:", options: ["Birth, life, death", "Truth, consciousness, bliss", "Past, present, future", "Earth, water, fire"], correct: 1 },
  { question: "How many main paths to Moksha are there?", options: ["Two", "Three", "Four", "Five"], correct: 2 }]

}];


// Layout constants
const CONTAINER_W = 300;
const ROW_H = 100;
const NODE_DIAMETER = 80; // matches LotusLevel w-20 h-20
const NODE_R = NODE_DIAMETER / 2;
const TOTAL = LEVELS_DATA.length;
const CONTAINER_H = TOTAL * ROW_H;
const LEFT_CX = 75;
const RIGHT_CX = 225;

// Level positions: index 0 = level 1 = bottom of path, index 19 = level 20 = top
const POSITIONS = Array.from({ length: TOTAL }, (_, i) => ({
  cx: i % 2 === 0 ? LEFT_CX : RIGHT_CX,
  cy: CONTAINER_H - i * ROW_H - ROW_H / 2
}));

function PathLines({ progress }) {
  const isCompleted = (id) => (progress?.completed_levels || []).includes(id);

  // Build a single continuous path string through all centers
  const pathD = POSITIONS.map((p, i) =>
  i === 0 ? `M ${p.cx} ${p.cy}` : `L ${p.cx} ${p.cy}`
  ).join(' ');

  return (
    <svg
      style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
      width={CONTAINER_W}
      height={CONTAINER_H}
      viewBox={`0 0 ${CONTAINER_W} ${CONTAINER_H}`}>

            {/* Base track — full grey path under everything */}
            <path
        d={pathD}
        fill="none"
        stroke="#334155"
        strokeWidth="14"
        strokeLinecap="round"
        strokeLinejoin="round" />

            <path
        d={pathD}
        fill="none"
        stroke="#1e293b"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round" />


            {/* Completed segments rendered on top, center-to-center */}
            {LEVELS_DATA.slice(0, -1).map((_, i) => {
        const done = isCompleted(i + 1);
        if (!done) return null;
        const from = POSITIONS[i];
        const to = POSITIONS[i + 1];
        const segD = `M ${from.cx} ${from.cy} L ${to.cx} ${to.cy}`;
        return (
          <g key={i}>
                        {/* Glow */}
                        <path d={segD} fill="none"
            stroke="#4ade80" strokeWidth="22"
            strokeLinecap="round" strokeLinejoin="round"
            opacity="0.18" />
                        {/* Main filled segment */}
                        <path d={segD} fill="none"
            stroke="#22c55e" strokeWidth="14"
            strokeLinecap="round" strokeLinejoin="round" />
                        {/* Bright inner highlight */}
                        <path d={segD} fill="none"
            stroke="#86efac" strokeWidth="5"
            strokeLinecap="round" strokeLinejoin="round"
            opacity="0.6" />
                    </g>);

      })}

        </svg>);

}

export default function LotusPath({ user }) {
  const [progress, setProgress] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null);

  useEffect(() => {
    if (user) loadProgress();
  }, [user]);

  const loadProgress = async () => {
    const progs = await base44.entities.LearningProgress.filter({ user_email: user.email });
    if (progs.length > 0) {
      setProgress(progs[0]);
    } else {
      const newProg = await base44.entities.LearningProgress.create({
        user_email: user.email,
        completed_levels: [],
        current_level: 1,
        quiz_scores: {}
      });
      setProgress(newProg);
    }
  };

  const handleLevelComplete = async (levelId, score) => {
    const completed = [...(progress.completed_levels || [])];
    if (!completed.includes(levelId)) completed.push(levelId);
    const scores = { ...(progress.quiz_scores || {}), [levelId]: score };
    const nextLevel = Math.min(Math.max(...completed, 0) + 1, LEVELS_DATA.length);

    await base44.entities.LearningProgress.update(progress.id, {
      completed_levels: completed,
      current_level: nextLevel,
      quiz_scores: scores
    });
    setProgress({ ...progress, completed_levels: completed, current_level: nextLevel, quiz_scores: scores });
    setSelectedLevel(null);
  };

  const isUnlocked = (id) => id === 1 || (progress?.completed_levels || []).includes(id - 1);
  const isCompleted = (id) => (progress?.completed_levels || []).includes(id);

  if (selectedLevel) {
    const levelData = LEVELS_DATA.find((l) => l.id === selectedLevel);
    return <LevelContent level={levelData} onComplete={handleLevelComplete} onBack={() => setSelectedLevel(null)} />;
  }

  const completedCount = (progress?.completed_levels || []).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', paddingBottom: 32 }}>
            {/* Header */}
            <div style={{ textAlign: 'center', padding: '16px 0 8px', width: '100%' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    
                    <h2 className="text-2xl font-serif text-white drop-shadow-lg">The Lotus Path</h2>
                    
                </div>
                <p className="text-cyan-100/80 text-sm">Journey through ancient wisdom</p>
                <p className="text-cyan-200/60 text-xs mt-1">{completedCount} of {LEVELS_DATA.length} levels completed</p>
            </div>

            {/* Path container */}
            <div style={{
        position: 'relative',
        width: CONTAINER_W,
        height: CONTAINER_H,
        flexShrink: 0
      }}>
                <PathLines progress={progress} />

                {LEVELS_DATA.map((level, i) => {
          const pos = POSITIONS[i];
          return (
            <motion.div
              key={level.id}
              style={{
                position: 'absolute',
                left: pos.cx - NODE_R,
                top: pos.cy - NODE_R,
                width: NODE_DIAMETER,
                height: NODE_DIAMETER,
                zIndex: 10
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.03 * i, type: 'spring', stiffness: 200 }}>

                            <LotusLevel
                level={level.id}
                isCompleted={isCompleted(level.id)}
                isLocked={!isUnlocked(level.id)}
                isActive={progress?.current_level === level.id}
                onClick={setSelectedLevel}
                size="lg" />

                        </motion.div>);

        })}
            </div>
        </div>);

}