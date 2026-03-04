export type Verse = {
    id: string;
    chapter: number;
    verse: number;
    english: string;
    hindi: string;
    speaker?: string;
  };
  
  export const MOCK_VERSES: Verse[] = [
    {
      id: "1",
      chapter: 2,
      verse: 47,
      english: "You have the right to action, but not to the results of action.",
      hindi: "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन",
      speaker: "Krishna",
    },
    {
      id: "2",
      chapter: 2,
      verse: 14,
      english: "O son of Kunti, the contact between the senses and the sense objects gives rise to happiness and distress.",
      hindi: "मात्रास्पर्शास्तु कौन्तेय...",
      speaker: "Krishna",
    },
    {
      id: "3",
      chapter: 6,
      verse: 35,
      english: "The mind is restless and difficult to restrain, but it can be controlled by practice and detachment.",
      hindi: "असंशयं महाबाहो...",
      speaker: "Krishna",
    },
  ];