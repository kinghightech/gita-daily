import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brain, Flame, Heart, Leaf, Moon, Shield, Sun, Zap } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

interface Verse {
  id: string;
  chapter: number;
  verse: number;
  english?: string;
  hindi?: string;
  speaker?: string;
}

interface MoodSearchProps {
  verses: Verse[];
  onVerseSelect: (verse: Verse) => void;
}

const MOOD_VERSES: Record<string, Array<{ chapter: number; verse: number }>> = {
  anxious: [
    { chapter: 2, verse: 14 },
    { chapter: 2, verse: 70 },
    { chapter: 6, verse: 35 },
    { chapter: 5, verse: 29 },
  ],
  sad: [
    { chapter: 2, verse: 20 },
    { chapter: 2, verse: 22 },
    { chapter: 2, verse: 56 },
    { chapter: 18, verse: 54 },
  ],
  angry: [
    { chapter: 2, verse: 62 },
    { chapter: 2, verse: 63 },
    { chapter: 12, verse: 13 },
    { chapter: 12, verse: 15 },
  ],
  confused: [
    { chapter: 4, verse: 18 },
    { chapter: 4, verse: 39 },
    { chapter: 15, verse: 15 },
    { chapter: 18, verse: 20 },
  ],
  peaceful: [
    { chapter: 2, verse: 70 },
    { chapter: 6, verse: 17 },
    { chapter: 5, verse: 29 },
    { chapter: 18, verse: 54 },
  ],
  motivated: [
    { chapter: 2, verse: 47 },
    { chapter: 3, verse: 19 },
    { chapter: 3, verse: 21 },
    { chapter: 18, verse: 46 },
  ],
  fearful: [
    { chapter: 4, verse: 7 },
    { chapter: 4, verse: 8 },
    { chapter: 18, verse: 58 },
    { chapter: 18, verse: 66 },
  ],
  grateful: [
    { chapter: 9, verse: 22 },
    { chapter: 9, verse: 27 },
    { chapter: 9, verse: 34 },
    { chapter: 18, verse: 65 },
  ],
};

const MOODS = [
  { id: 'anxious', label: 'Anxious', icon: Brain, color: '#a855f7' },
  { id: 'sad', label: 'Sad', icon: Moon, color: '#3b82f6' },
  { id: 'angry', label: 'Angry', icon: Flame, color: '#ef4444' },
  { id: 'confused', label: 'Confused', icon: Zap, color: '#eab308' },
  { id: 'peaceful', label: 'Seeking Peace', icon: Leaf, color: '#22c55e' },
  { id: 'motivated', label: 'Need Motivation', icon: Sun, color: '#f59e0b' },
  { id: 'fearful', label: 'Fearful', icon: Shield, color: '#6b7280' },
  { id: 'grateful', label: 'Grateful', icon: Heart, color: '#ec4899' },
];

export default function MoodSearch({ verses, onVerseSelect }: MoodSearchProps) {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedVerse, setSuggestedVerse] = useState<Verse | null>(null);
  const lastShownRef = useRef<Record<string, number>>({});

  const findVerseForMood = (moodId: string) => {
    setSelectedMood(moodId);
    setIsLoading(true);
    setSuggestedVerse(null);

    const moodVerses = MOOD_VERSES[moodId] || [];
    const lastIndex = lastShownRef.current[moodId] ?? -1;
    let nextIndex = (lastIndex + 1) % moodVerses.length;

    const verseRef = moodVerses[nextIndex];
    const foundVerse = verses.find(
      (v) => v.chapter === verseRef.chapter && v.verse === verseRef.verse
    );

    if (!foundVerse && moodVerses.length > 1) {
      for (let i = 0; i < moodVerses.length; i++) {
        const tryRef = moodVerses[(nextIndex + i) % moodVerses.length];
        const tryVerse = verses.find(
          (v) => v.chapter === tryRef.chapter && v.verse === tryRef.verse
        );
        if (tryVerse) {
          lastShownRef.current[moodId] = (nextIndex + i) % moodVerses.length;
          setTimeout(() => {
            setSuggestedVerse(tryVerse);
            setIsLoading(false);
          }, 500);
          return;
        }
      }
    }

    lastShownRef.current[moodId] = nextIndex;

    setTimeout(() => {
      setSuggestedVerse(
        foundVerse || verses[Math.floor(Math.random() * verses.length)]
      );
      setIsLoading(false);
    }, 500);
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>✨ Find Wisdom for Your Mood</ThemedText>
      <ThemedText style={styles.description}>
        How are you feeling today? Select a mood to find a relevant verse. Click again for another verse.
      </ThemedText>

      <View style={styles.moodGrid}>
        {MOODS.map((mood) => {
          const IconComponent = mood.icon;
          const isSelected = selectedMood === mood.id;

          return (
            <Pressable
              key={mood.id}
              onPress={() => findVerseForMood(mood.id)}
              style={[
                styles.moodBtn,
                isSelected && [styles.moodBtnActive, { backgroundColor: mood.color }],
              ]}
            >
              <IconComponent
                size={20}
                color={isSelected ? '#ffffff' : 'rgba(251, 191, 36, 0.7)'}
              />
              <ThemedText
                style={[
                  styles.moodLabel,
                  isSelected && styles.moodLabelActive,
                ]}
              >
                {mood.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#f59e0b" />
          <ThemedText style={styles.loadingText}>Finding wisdom for you...</ThemedText>
        </View>
      )}

      {suggestedVerse && !isLoading && (
        <View style={styles.verseCard}>
          <ThemedText style={styles.verseHeader}>
            Chapter {suggestedVerse.chapter}, Verse {suggestedVerse.verse}
            {suggestedVerse.speaker && (
              <ThemedText style={styles.speaker}> — {suggestedVerse.speaker}</ThemedText>
            )}
          </ThemedText>
          <ThemedText style={styles.verseText}>&quot;{suggestedVerse.english}&quot;</ThemedText>
          <Pressable
            onPress={() => onVerseSelect(suggestedVerse)}
            style={styles.viewBtn}
          >
            <ThemedText style={styles.viewBtnText}>View Full Verse</ThemedText>
          </Pressable>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fcd34d',
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    color: '#fbbf24',
    marginBottom: 12,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  moodBtn: {
    width: '23%',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    alignItems: 'center',
    gap: 4,
  },
  moodBtnActive: {
    backgroundColor: '#f59e0b',
  },
  moodLabel: {
    fontSize: 11,
    color: 'rgba(251, 191, 36, 0.7)',
    textAlign: 'center',
  },
  moodLabelActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: 'rgba(251, 191, 36, 0.7)',
  },
  verseCard: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  verseHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f59e0b',
    marginBottom: 8,
  },
  speaker: {
    fontSize: 12,
    color: 'rgba(251, 191, 36, 0.5)',
  },
  verseText: {
    fontSize: 13,
    color: '#fcd34d',
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: 12,
  },
  viewBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#f59e0b',
    borderRadius: 8,
    alignItems: 'center',
  },
  viewBtnText: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 13,
  },
});
