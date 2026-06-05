/**
 * Beginner-friendly English meanings for individual prayer lines.
 *
 * Keyed by prayer `id` (see Data/prayers.ts), then by the line index within that
 * prayer's lyric arrays (hindiLyrics / englishLyrics share the same indexing).
 *
 * Coverage is intentionally optional and partial — any line without an entry here
 * falls back to "Meaning coming soon" in the UI (see lib/prayerVerses.ts). To add
 * meanings for another prayer, add its id below with `index: 'meaning'` pairs.
 * Instrumental lines (♪) never need an entry.
 */
export const PRAYER_MEANINGS: Record<string, Record<number, string>> = {
  'jai-ganesha-deva': {
    1: 'Victory to Lord Ganesha, again and again! His mother is Parvati, and his father is…',
    2: '…Mahadeva (Shiva). Glory, glory, glory to Lord Ganesha, the divine remover of obstacles.',
    4: 'The single-tusked, ever-compassionate lord who bears four arms.',
    5: 'Single-tusked and merciful; sacred vermilion adorns his forehead, and the mouse is his humble vehicle.',
    6: 'Vermilion graces his brow; devotees lovingly offer him betel leaf, flowers, and sweet treats.',
    7: 'Laddus are offered to him as bhog, and saints serve him with devotion. Glory to Ganesha…',
    8: '…the divine lord — beloved son of Parvati and Mahadeva.',
    10: 'He gives sight to the blind and restores health to the suffering.',
    11: 'He gives sight to the blind and heals the afflicted; and to those without children he gives…',
    12: '…children to the childless, and wealth to the poor.',
    13: 'He blesses the childless with children and the needy with means; the poet Shyam takes refuge in him — may my devotion bear fruit.',
    14: 'Son of Parvati and Mahadeva — glory to Lord Ganesha.',
    16: 'O son of Shambhu (Shiva), guard the honour of the humble and the helpless.',
    17: 'Fulfil my heartfelt wishes — I offer myself to you in complete devotion.',
    18: 'Glory to Ganesha, the divine lord.',
    19: 'His mother is Parvati and his father is Mahadeva.',
    20: 'Glory, glory, glory to Lord Ganesha.',
  },
  // Hanuman Chalisa lyrics are grouped into multi-line blocks, so each meaning
  // below combines the meanings of every transliteration line in that block.
  'hanuman-chalisa': {
    0: 'Victory to Hanuman, praise to Lord Hanuman — chanted again and again in devotion.',
    1: 'Victory to Hanuman, the ocean of wisdom and virtue. Victory to the Lord of the vanaras, whose glory shines through all three worlds. You are Lord Rama\'s messenger and the home of incomparable strength — the son of Anjani, known as the son of the Wind God.',
    2: 'You are the great, brave warrior, powerful and strong like the thunderbolt. You remove bad thinking and guide people toward good wisdom. Your golden-coloured form shines beautifully in noble clothing, with earrings and curly hair.',
    3: 'Praise to Hanuman, victory to Lord Hanuman.',
    4: 'You hold the thunderbolt and the flag in your hands, and a sacred thread of munja grass rests on your shoulder. You are connected to Lord Shiva and are the son of Kesari; your radiance and power are worshipped by the whole world.',
    5: 'You are learned, virtuous, and extremely wise, and always eager to carry out Lord Rama\'s work. You love listening to the stories and deeds of the Lord, and Rama, Lakshmana, and Sita live in your heart and mind.',
    6: 'Rama, Lakshmana, and Sita live in your heart and mind.',
    7: 'You took a tiny form to appear before Mother Sita, a terrifying form to burn Lanka, and a mighty form to destroy the demons — completing all of Lord Rama\'s tasks.',
    8: 'You brought the Sanjeevani herb and revived Lakshmana. Lord Rama joyfully embraced you and praised you greatly.',
    9: 'Rama said, "You are as dear to me as my brother Bharata." Victory to Hanuman.',
    10: 'Even the thousand-mouthed serpent Shesha sings your glory, and saying this, Lord Rama embraced you. Sages like Sanaka and Lord Brahma, along with Narada, Saraswati, and Shesha, all praise your greatness.',
    11: 'Yama, Kubera, and the guardians of the directions praise you; even poets and scholars cannot fully describe your glory. You helped Sugriva greatly, introducing him to Rama and helping him regain his kingdom.',
    12: 'You introduced Sugriva to Rama and helped him regain his kingdom.',
    13: 'Vibhishana accepted your advice and became king of Lanka, as the whole world knows. When the sun was thousands of yojanas away, as a child you leapt toward it, thinking it was a sweet fruit.',
    14: 'You placed Lord Rama\'s ring in your mouth and crossed the ocean — for you, that was no surprise. All difficult tasks in the world become easy through your grace.',
    15: 'Victory to Hanuman, praise to Lord Hanuman.',
    16: 'You are the guardian at Lord Rama\'s door, and no one can enter without your permission. Whoever takes refuge in you receives happiness, and with you as protector there is nothing to fear.',
    17: 'Only you can control your immense power; your mighty roar makes all three worlds tremble. Ghosts and evil spirits do not come near when the name of the great hero Hanuman is spoken.',
    18: 'When the name of the great hero Hanuman is spoken, evil spirits flee.',
    19: 'Diseases are destroyed and all pain is removed for those who constantly remember brave Hanuman. He frees from troubles all who remember him in thought, action, and speech.',
    20: 'Lord Rama, the devoted and disciplined king, is supreme over all, and you carry out all of his work. Whoever brings sincere wishes to you receives abundant blessings and fulfilment in life.',
    21: 'Victory to Hanuman, praise to Lord Hanuman.',
    22: 'Your glory shines through all four ages; your fame is known everywhere and lights up the world. You protect saints and good people, destroy demons, and are beloved by Lord Rama.',
    23: 'You can grant the eight spiritual powers (siddhis) and the nine treasures (nidhis) — a blessing Mother Sita gave you. You hold the nectar of devotion to Lord Rama and forever remain his devoted servant.',
    24: 'You forever remain the devoted servant of Lord Rama.',
    25: 'Through devotion to you, one reaches Lord Rama and forgets the suffering of many lifetimes. At the end of life the devotee reaches Lord Rama\'s divine abode, and in future births is known as a devotee of Hari.',
    26: 'One need not hold any other deity in mind, for serving Hanuman brings every happiness. Troubles are removed and all pain disappears for those who remember the mighty, brave Hanuman.',
    27: 'Praise to Hanuman, victory to Lord Hanuman.',
    28: 'Victory, victory, victory to Lord Hanuman! Show your mercy like a divine teacher. Whoever recites this one hundred times is freed from bondage and receives great happiness.',
    29: 'Whoever recites this Hanuman Chalisa will gain success and blessings — Lord Shiva is the witness. Tulsidas, ever the servant of Lord Hari, prays: O Lord, please dwell in my heart.',
    30: 'Victory to Hanuman, praise to Lord Hanuman.',
  },
  // The Gayatri Mantra repeats the same few lines many times; each block's
  // meaning is built from the lines it contains. A couple of blocks drop the
  // word "Nah" ("our"), so they use "the intellect" instead of "our intellects".
  'gayatri-mantra': {
    0: 'Om. We invoke the Divine present in the physical, mental, and spiritual realms.',
    1: 'We meditate on that most excellent divine light of Savitur, the source of life. We meditate upon the pure, radiant splendor of the Divine. May that Divine light inspire and guide our intellects.',
    3: 'Om. We invoke the Divine present in the physical, mental, and spiritual realms.',
    5: 'We meditate on that most excellent divine light of Savitur, the source of life. We meditate upon the pure, radiant splendor of the Divine.',
    7: 'We meditate upon the pure, radiant splendor of the Divine. May that Divine light inspire and guide our intellects. Om. We invoke the Divine present in the physical, mental, and spiritual realms.',
    8: 'Om. We invoke the Divine present in the physical, mental, and spiritual realms.',
    10: 'We meditate on that most excellent divine light of Savitur, the source of life. We meditate upon the pure, radiant splendor of the Divine. May that Divine light inspire and guide our intellects.',
    12: 'Om. We invoke the Divine present in the physical, mental, and spiritual realms.',
    14: 'We meditate on that most excellent divine light of Savitur, the source of life. We meditate upon the pure, radiant splendor of the Divine. May that Divine light inspire and guide our intellects.',
    15: 'May that Divine light inspire and guide our intellects. Om. We invoke the Divine present in the physical, mental, and spiritual realms.',
    17: 'We meditate on that most excellent divine light of Savitur, the source of life. We meditate upon the pure, radiant splendor of the Divine. May that Divine light inspire and guide our intellects.',
    18: 'Om. We invoke the Divine present in the physical, mental, and spiritual realms.',
    20: 'We meditate on that most excellent divine light of Savitur, the source of life. We meditate upon the pure, radiant splendor of the Divine. May that Divine light inspire and guide our intellects.',
    22: 'Om. We invoke the Divine present in the physical, mental, and spiritual realms.',
    24: 'We meditate on that most excellent divine light of Savitur, the source of life. We meditate upon the pure, radiant splendor of the Divine. May that Divine light inspire and guide our intellects.',
    25: 'Om. We invoke the Divine present in the physical, mental, and spiritual realms.',
    27: 'We meditate on that most excellent divine light of Savitur, the source of life. We meditate upon the pure, radiant splendor of the Divine. May that Divine light inspire and guide the intellect.',
    28: 'May that Divine light inspire and guide the intellect. Om. We invoke the Divine present in the physical, mental, and spiritual realms.',
    30: 'We meditate on that most excellent divine light of Savitur, the source of life. We meditate upon the pure, radiant splendor of the Divine. May that Divine light inspire and guide our intellects.',
    31: 'Om. We invoke the Divine present in the physical, mental, and spiritual realms. We meditate on that most excellent divine light of Savitur, the source of life.',
    32: 'We meditate upon the pure, radiant splendor of the Divine. May that Divine light inspire and guide the intellect.',
    33: 'May that Divine light inspire and guide the intellect.',
  },
  // Maha Mrityunjaya Mantra: same mantra repeated 13 times, all share one meaning.
  'maha-mrityunjaya-mantra': Object.fromEntries(
    Array.from({ length: 13 }, (_, i) => [
      i,
      'We worship the Three-eyed Lord (Shiva), who is fragrant and who nourishes and nurtures all beings. As a ripened cucumber is naturally liberated from its bondage to the creeper, may He liberate us from death for the sake of immortality.',
    ])
  ),
  // Shiva Tandava Stotram: one block per verse (indices 0-13 = verses 1-14).
  'shiva-tandava-stotram': {
    0: 'May Lord Shiva, whose neck is purified by the flowing waters from his matted hair, who wears a long garland of great serpents, and who performed the fierce Tandava dance to the powerful sound of the damaru drum, bless us with auspiciousness.',
    1: 'May my love be fixed every moment on Lord Shiva, whose head shines with the waves of the heavenly river Ganga moving through his matted hair, whose forehead blazes with fire, and who wears the young crescent moon on his head.',
    2: 'May my mind find joy in Lord Shiva, whose heart delights in the playful beauty of Parvati, the daughter of the mountain king, whose compassionate glance removes even unbearable suffering, and who sometimes appears as the sky-clad ascetic.',
    3: 'May my mind find wonderful delight in Lord Shiva, the sustainer of all beings, whose matted hair holds tawny serpents with shining jewel-like hoods, whose presence colors the directions like saffron, and who wears the hide of a powerful elephant.',
    4: 'May Lord Shiva, whose feet are covered with the flower-dust from the heads of gods like Indra, whose matted hair is tied with the king of serpents, and who wears the moon on his head, grant lasting prosperity.',
    5: 'May the matted hair of Lord Shiva bring us prosperity — Shiva whose forehead blazed with the fire that burned Kamadeva, who is bowed to by the leaders of the gods, who shines with the crescent moon, and who bears the great skull.',
    6: 'May my love be for the three-eyed Lord Shiva, whose terrifying forehead burned Kamadeva in blazing fire, and who is the master artist lovingly adorning Parvati, the daughter of the mountain king.',
    7: 'May Lord Shiva, who supports the universe, grant prosperity — he whose dark throat is like a mass of fresh storm clouds on a moonless night, who holds the heavenly river Ganga, who wears elephant skin, and who is adorned with the moon.',
    8: 'I worship Lord Shiva, whose dark throat shines like a blooming blue lotus, who destroyed Kamadeva, Tripura, worldly bondage, Daksha\'s sacrifice, the elephant demon, Andhaka, and even death itself.',
    9: 'I worship Lord Shiva, who is like a bee drinking the sweetness flowing from the cluster of all auspicious arts, and who destroys Kamadeva, Tripura, worldly bondage, sacrifice, the elephant demon, Andhaka, and death.',
    10: 'May Lord Shiva be victorious — Shiva whose fierce forehead fire blazes as serpents move and breathe around him, and whose powerful Tandava dance is set in motion by the auspicious "dhimi dhimi" sound of the mridanga drum.',
    11: 'When will I worship Sadashiva with equal vision toward everything — a stone and a fine bed, a snake and a pearl garland, a precious jewel and a lump of clay, a friend and an enemy, grass and lotus-like eyes, ordinary people and kings?',
    12: 'When will I become truly happy, living in a cave near the heavenly river Ganga, freed from wrong thoughts, always holding my hands in prayer above my head, with eyes full of devotion, chanting the mantra "Shiva"?',
    13: 'Whoever reads, remembers, or recites this excellent hymn daily becomes purified, quickly gains deep devotion to Lord Shiva, and overcomes delusion through meditation on the auspicious Lord Shankara.',
  },
};

/** Returns the meaning for a prayer line, or null if none is defined yet. */
export const getPrayerLineMeaning = (
  prayerId: string,
  index: number,
): string | null => PRAYER_MEANINGS[prayerId]?.[index] ?? null;
