import { Fonts } from '@/constants/theme';
import { Verse } from '@/Data/mockverses';
import LotusLoader from '@/components/ui/LotusLoader';
import { LinearGradient } from 'expo-linear-gradient';
import {
    Brain,
    Flame,
    Heart,
    Leaf,
    Moon,
    Shield,
    Sparkles,
    Sun,
    Zap,
} from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { TouchableOpacity, 
    Pressable,
    StyleSheet,
    Text,
    View,
 } from 'react-native';

interface MoodSearchProps {
  verses: Verse[];
  onVerseSelect: (verse: Verse) => void;
  disableInteractions?: boolean;
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
  { id: 'anxious', label: 'Anxious', icon: Brain, gradient: ['#a855f7', '#4f46e5'] },
  { id: 'sad', label: 'Sad', icon: Moon, gradient: ['#3b82f6', '#4f46e5'] },
  { id: 'angry', label: 'Angry', icon: Flame, gradient: ['#ef4444', '#dc2626'] },
  { id: 'confused', label: 'Confused', icon: Zap, gradient: ['#f59e0b', '#d97706'] },
  { id: 'peaceful', label: 'Seeking Peace', icon: Leaf, gradient: ['#22c55e', '#15803d'] },
  { id: 'motivated', label: 'Need Motivation', icon: Sun, gradient: ['#f59e0b', '#ea580c'] },
  { id: 'fearful', label: 'Fearful', icon: Shield, gradient: ['#64748b', '#334155'] },
  { id: 'grateful', label: 'Grateful', icon: Heart, gradient: ['#ec4899', '#be185d'] },
];

export default function MoodSearch({
  verses,
  onVerseSelect,
  disableInteractions = false,
}: MoodSearchProps) {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const lastShownRef = useRef<Record<string, number>>({});

  useEffect(() => {
    if (disableInteractions) {
      setSelectedMood(null);
      setIsLoading(false);
    }
  }, [disableInteractions]);

  const findVerseForMood = (moodId: string) => {
    if (disableInteractions || verses.length === 0) return;

    setSelectedMood(moodId);
    setIsLoading(true);

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
            onVerseSelect(tryVerse);
            setIsLoading(false);
          }, 500);
          return;
        }
      }
    }

    lastShownRef.current[moodId] = nextIndex;

    setTimeout(() => {
      const nextVerse = foundVerse || verses[Math.floor(Math.random() * verses.length)];
      onVerseSelect(nextVerse);
      setIsLoading(false);
    }, 500);
  };

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Find Wisdom for Your Mood</Text>
      </View>

      <Text style={styles.description}>
        How are you feeling today? Select a mood to find a relevant verse. Click again for another verse.
      </Text>

      <View style={styles.moodGrid}>
        {MOODS.map((mood) => {
          const IconComponent = mood.icon;
          const isSelected = selectedMood === mood.id;

          return (
            <TouchableOpacity activeOpacity={0.7}
              key={mood.id}
              disabled={disableInteractions}
              onPress={() => findVerseForMood(mood.id)}
              style={styles.moodBtnWrap}>
              {isSelected ? (
                <LinearGradient
                  colors={mood.gradient as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.moodBtn, styles.moodBtnSelected]}>
                  <IconComponent size={20} color="#ffffff" />
                  <Text numberOfLines={2} style={[styles.moodLabel, styles.moodLabelSelected]}>{mood.label}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.moodBtn}>
                  <IconComponent size={20} color="#fbbf24" />
                  <Text numberOfLines={2} style={styles.moodLabel}>{mood.label}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <LotusLoader size={80} color="#D4AF37" strokeWidth={2.4} duration={1100} />
          <Text style={styles.loadingText}>Finding wisdom for you...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 18,
    marginVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 18,
    color: '#fef3c7',
    fontFamily: Fonts.serif,
  },
  description: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(251,191,36,0.6)',
    marginBottom: 14,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  moodBtnWrap: {
    width: '24%',
    marginBottom: 10,
  },
  moodBtn: {
    height: 92,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  moodBtnSelected: {
    shadowColor: '#000000',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  moodLabel: {
    fontSize: 11,
    lineHeight: 14,
    color: 'rgba(251, 191, 36, 0.7)',
    textAlign: 'center',
    maxWidth: 76,
  },
  moodLabelSelected: {
    color: '#ffffff',
  },
  loadingContainer: {
    paddingVertical: 18,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: 'rgba(251, 191, 36, 0.7)',
  },
});
