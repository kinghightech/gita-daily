import { Fonts } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Heart,
  HelpCircle,
  LoaderCircle,
  Share2,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react-native';
import { useCallback, useRef, useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, Text, View } from 'react-native';

interface QuoteCardProps {
  verse: {
    id: string;
    chapter: number;
    verse: number;
    english?: string;
    hindi?: string;
    speaker?: string;
    meaning?: string;
  } | null;
  user: { full_name?: string; email?: string } | null;
  preferences: { preferred_language?: string; favorite_verses?: string[] } | null;
  onFavoriteToggle?: (verseId: string) => void;
  isToday?: boolean;
}

export default function QuoteCard({
  verse,
  user,
  preferences,
  onFavoriteToggle,
  isToday = false,
}: QuoteCardProps) {
  const [activeLanguage] = useState(preferences?.preferred_language || 'english');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [isExplaining, setIsExplaining] = useState(false);
  const [optimisticFavorite, setOptimisticFavorite] = useState<boolean | null>(null);
  const lastTapRef = useRef(0);

  const isFavorite =
    optimisticFavorite !== null
      ? optimisticFavorite
      : (preferences?.favorite_verses?.includes(verse?.id ?? '') ?? false);

  const getQuoteText = () => {
    const text =
      activeLanguage === 'hindi'
        ? (verse?.hindi ?? verse?.english)
        : (verse?.english ?? verse?.hindi);
    return text ?? '';
  };

  const explainVerse = useCallback(() => {
    if (explanation) {
      setShowExplanation(true);
      return;
    }
    setIsExplaining(true);
    setShowExplanation(true);
    if (verse?.meaning) {
      setExplanation(verse.meaning);
    } else {
      setExplanation('Explanation not available. Add verse meanings to enable explanations.');
    }
    setIsExplaining(false);
  }, [explanation, verse?.meaning]);

  const handleFavorite = useCallback(() => {
    if (!user || !onFavoriteToggle || !verse) return;
    setOptimisticFavorite(!isFavorite);
    onFavoriteToggle(verse.id);
  }, [user, onFavoriteToggle, verse, isFavorite]);

  const handleShare = useCallback(async () => {
    if (!verse) return;
    const shareText =
      `"${verse.english ?? verse.hindi ?? ''}"\n\n` +
      `— Bhagavad Gita, Chapter ${verse.chapter}, Verse ${verse.verse}` +
      `${verse.speaker ? ` (${verse.speaker})` : ''}\n\n` +
      `${verse.hindi ?? ''}`;

    try {
      await Share.share({ title: 'Gita Daily Wisdom', message: shareText });
    } catch {
      // canceled
    }
  }, [verse]);

  const handleCardDoubleTap = useCallback(() => {
    const now = Date.now();
    const diff = now - lastTapRef.current;

    if (diff < 400 && diff > 0) {
      // double tap
      if (user && onFavoriteToggle && verse && !isFavorite) {
        setOptimisticFavorite(true);
        onFavoriteToggle(verse.id);
      }
      lastTapRef.current = 0;
      return;
    }

    lastTapRef.current = now;
  }, [user, onFavoriteToggle, isFavorite, verse]);

  const speakQuote = useCallback(() => {
    // keep your existing behavior
    Alert.alert(
      'Listen',
      'Audio playback requires the web version. On mobile, you can read the verse aloud.',
      [{ text: 'OK' }]
    );
  }, []);

  if (!verse) return null;

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        // closer to the website “deep navy → rich blue” look
        colors={['rgba(10,16,30,0.97)', 'rgba(12,34,74,0.97)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* Header */}
        <Pressable style={styles.pressable} onPress={handleCardDoubleTap}>
          <LinearGradient
            colors={['rgba(20,30,55,1)', 'rgba(20,60,160,0.55)', 'rgba(20,30,55,1)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.header}
          >
            {isToday && (
              <View style={styles.todayRow}>
                <View style={styles.todayLine} />
                <Text style={styles.todayLabel}>TODAY&apos;S VERSE</Text>
                <View style={styles.todayLine} />
              </View>
            )}

            <Text style={styles.chapterVerse}>
              Chapter {verse.chapter}, Verse {verse.verse}
            </Text>

            {verse.speaker && <Text style={styles.speaker}>Spoken by {verse.speaker}</Text>}
          </LinearGradient>
        </Pressable>

        {/* Quote */}
        <View style={styles.quoteBlock}>
          <Text style={[styles.quoteText, activeLanguage === 'hindi' && styles.quoteHindi]}>
            &quot;{getQuoteText()}&quot;
          </Text>
        </View>

        {/* Explanation panel (optional UI, keep it) */}
        {showExplanation && (
          <View style={styles.explanationBox}>
            <Pressable
              style={styles.closeBtn}
              onPress={() => setShowExplanation(false)}
              hitSlop={8}
            >
              <X color="rgba(212,175,55,0.65)" size={18} />
            </Pressable>

            <View style={styles.explanationHeader}>
              <HelpCircle color="rgba(212,175,55,0.95)" size={18} />
              <Text style={styles.explanationTitle}>Meaning &amp; Explanation</Text>
            </View>

            {isExplaining ? (
              <View style={styles.loadingRow}>
                <LoaderCircle color="rgba(212,175,55,0.75)" size={16} />
                <Text style={styles.loadingText}>Understanding the verse...</Text>
              </View>
            ) : (
              <Text style={styles.explanationText}>{explanation}</Text>
            )}
          </View>
        )}

        {/* Action buttons (bigger pills + more spacing) */}
        <View style={styles.actions}>
          <Pressable style={[styles.iconBtn, isSpeaking && styles.iconBtnActive]} onPress={speakQuote}>
            {isSpeaking ? (
              <VolumeX color="#0a101e" size={20} />
            ) : (
              <Volume2 color="rgba(212,175,55,0.95)" size={20} />
            )}
          </Pressable>

          {user && onFavoriteToggle && (
            <Pressable style={[styles.iconBtn, isFavorite && styles.favoriteBtn]} onPress={handleFavorite}>
              <Heart
                color={isFavorite ? '#fbbf24' : 'rgba(212,175,55,0.95)'}
                size={20}
                fill={isFavorite ? '#fbbf24' : 'transparent'}
              />
            </Pressable>
          )}

          <Pressable style={styles.iconBtn} onPress={handleShare}>
            <Share2 color="rgba(212,175,55,0.95)" size={20} />
          </Pressable>

          <Pressable
            style={[styles.iconBtn, showExplanation && styles.iconBtnActive]}
            onPress={explainVerse}
            disabled={isExplaining}
          >
            {isExplaining ? (
              <LoaderCircle color="rgba(212,175,55,0.75)" size={20} />
            ) : (
              <HelpCircle color="rgba(212,175,55,0.95)" size={20} />
            )}
          </Pressable>
        </View>
      </LinearGradient>
    </View>
  );
}

const GOLD = 'rgba(212,175,55,0.65)'; // slightly “richer” gold than your old amber

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },

  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.3)',
    overflow: 'hidden',
  },

  pressable: { width: '100%' },

  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(251,191,36,0.2)',
    alignItems: 'center',
  },

  todayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 4,
  },
  todayLine: {
    width: 40,
    height: 1,
    backgroundColor: 'rgba(251,191,36,0.6)',
  },
  todayLabel: {
    color: 'rgba(251,191,36,0.9)',
    fontSize: 12,
    letterSpacing: 4.8,
    fontWeight: '300',
    textTransform: 'uppercase',
  },

  chapterVerse: {
    color: 'rgba(254,243,199,1)',
    fontSize: 20,
    fontWeight: '500',
    letterSpacing: 0.5,
    fontFamily: Fonts.serif,
  },

  speaker: {
    color: 'rgba(251,191,36,0.7)',
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 2,
    fontWeight: '300',
  },

  quoteBlock: {
    paddingTop: 28,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },

  quoteInner: {
    paddingHorizontal: 8,
    paddingVertical: 12,
  },

  quoteText: {
    color: 'rgba(254,243,199,1)',
    fontSize: 24,
    lineHeight: 39,
    textAlign: 'center',
    fontStyle: 'italic',
    fontFamily: Fonts.serif,
  },

  quoteHindi: {
    fontStyle: 'normal',
    fontWeight: '500',
    fontFamily: undefined,
  },

  explanationBox: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: 'rgba(30,41,59,0.5)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.2)',
  },

  closeBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
    padding: 4,
  },

  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },

  explanationTitle: {
    color: 'rgba(251,191,36,0.9)',
    fontSize: 14,
    fontWeight: '600',
  },

  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  loadingText: {
    color: 'rgba(212,175,55,0.75)',
    fontSize: 14,
  },

  explanationText: {
    color: 'rgba(255,244,210,0.88)',
    fontSize: 14,
    lineHeight: 22,
  },

  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,          // more space like website
    paddingTop: 10,
    paddingBottom: 18,
    paddingHorizontal: 18,
  },

  iconBtn: {
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: GOLD,
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    paddingVertical: 8,
    minHeight: 44,
  },

  iconBtnActive: {
    backgroundColor: 'rgba(212,175,55,0.95)',
    borderColor: 'rgba(212,175,55,0.95)',
  },

  favoriteBtn: {
    borderColor: 'rgba(212,175,55,0.75)',
    backgroundColor: 'rgba(212,175,55,0.14)',
  },
});