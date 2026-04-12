import { Fonts } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import {
    Heart,
    Share2,
    Volume2,
} from 'lucide-react-native';
import { FAVORITES_UPDATED_EVENT, toggleFavoriteVerse } from '@/lib/favorites';
import { incrementSharesCount } from '@/lib/profile';
import { useCallback, useEffect, useRef, useState } from 'react';
import { TouchableOpacity,  Alert, Animated, DeviceEventEmitter, Pressable, Share, StyleSheet, Text, View, type GestureResponderEvent  } from 'react-native';

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
  user: { id: string; full_name: string | null; email: string | null } | null;
  preferences: { preferred_language?: string; favorite_verses?: string[] } | null;
  onFavoriteToggle?: (verseId: string, isLiked: boolean) => void;
  isToday?: boolean;
}

export default function QuoteCard({
  verse,
  user,
  preferences,
  onFavoriteToggle,
  isToday = false,
}: QuoteCardProps) {
  const activeLanguage = preferences?.preferred_language || 'english';
  const [optimisticFavorite, setOptimisticFavorite] = useState<boolean | null>(null);
  const [tapHeartPoint, setTapHeartPoint] = useState<{ x: number; y: number; nonce: number } | null>(null);
  const lastTapRef = useRef(0);
  const tapHeartScale = useRef(new Animated.Value(0.35)).current;
  const tapHeartOpacity = useRef(new Animated.Value(0)).current;
  const hideTapHeartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isFavorite =
    optimisticFavorite !== null
      ? optimisticFavorite
      : (preferences?.favorite_verses?.includes(verse?.id ?? '') ?? false);

  useEffect(() => {
    if (!verse?.id) return;

    const subscription = DeviceEventEmitter.addListener(
      FAVORITES_UPDATED_EVENT,
      (data: { verseId: string; liked: boolean }) => {
        if (data.verseId === verse.id) {
          setOptimisticFavorite(data.liked);
        }
      }
    );

    return () => {
      subscription.remove();
      if (hideTapHeartTimeoutRef.current) {
        clearTimeout(hideTapHeartTimeoutRef.current);
      }
    };
  }, [verse?.id]);

  const getQuoteText = () => {
    const text =
      activeLanguage === 'hindi'
        ? (verse?.hindi ?? verse?.english)
        : (verse?.english ?? verse?.hindi);
    return text ?? '';
  };

  const handleFavorite = useCallback(async () => {
    if (!verse || !user?.id) return;

    const currentlyLiked = isFavorite;
    const nextFavorite = !currentlyLiked;
    
    // 1. Optimistic Update
    setOptimisticFavorite(nextFavorite);

    // 2. Persist to DB
    try {
      const successStatus = await toggleFavoriteVerse(user.id, verse.id, currentlyLiked);
      if (onFavoriteToggle) {
        onFavoriteToggle(verse.id, successStatus);
      }
    } catch (error) {
      // Revert on error
      setOptimisticFavorite(currentlyLiked);
      console.error('Favorite toggle failed:', error);
    }
  }, [onFavoriteToggle, verse, isFavorite, user?.id]);

  const handleShare = useCallback(async () => {
    if (!verse) return;
    const shareText =
      `"${verse.english ?? verse.hindi ?? ''}"\n\n` +
      `— Bhagavad Gita, Chapter ${verse.chapter}, Verse ${verse.verse}` +
      `${verse.speaker ? ` (${verse.speaker})` : ''}\n\n` +
      `${verse.hindi ?? ''}`;

    try {
      await Share.share({ title: 'Gita Daily Wisdom', message: shareText });
      if (user?.id) {
        await incrementSharesCount(user.id);
      }
    } catch {
      // canceled
    }
  }, [verse, user]);

  const showTapHeart = useCallback((x: number, y: number) => {
    if (hideTapHeartTimeoutRef.current) {
      clearTimeout(hideTapHeartTimeoutRef.current);
    }

    setTapHeartPoint({ x, y, nonce: Date.now() });
    tapHeartScale.setValue(0.35);
    tapHeartOpacity.setValue(0);

    Animated.sequence([
      Animated.parallel([
        Animated.timing(tapHeartScale, {
          toValue: 1.15,
          duration: 170,
          useNativeDriver: true,
        }),
        Animated.timing(tapHeartOpacity, {
          toValue: 1,
          duration: 140,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(tapHeartScale, {
          toValue: 1,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(tapHeartOpacity, {
          toValue: 0,
          duration: 260,
          delay: 220,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      setTapHeartPoint(null);
    });
  }, [tapHeartOpacity, tapHeartScale]);

  const handleQuoteDoubleTap = useCallback((event: GestureResponderEvent) => {
    const now = Date.now();
    const diff = now - lastTapRef.current;
    const { locationX, locationY } = event.nativeEvent;

    if (diff < 400 && diff > 0) {
      showTapHeart(locationX, locationY);

      if (verse && !isFavorite && user?.id) {
        // Double tap always ensures "liked" if not already liked
        void handleFavorite();
      }

      lastTapRef.current = 0;
      return;
    }

    lastTapRef.current = now;
  }, [isFavorite, handleFavorite, showTapHeart, verse, user?.id]);

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
        <TouchableOpacity activeOpacity={0.7} style={styles.pressable}>
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
        </TouchableOpacity>

        {/* Quote */}
        <TouchableOpacity activeOpacity={0.7} style={styles.quoteTapArea} onPress={handleQuoteDoubleTap}>
          <View style={styles.quoteBlock}>
            <Text style={[styles.quoteText, activeLanguage === 'hindi' && styles.quoteHindi]}>
              &quot;{getQuoteText()}&quot;
            </Text>
          </View>

          {tapHeartPoint && (
            <Animated.View
              key={`tap-heart-${tapHeartPoint.nonce}`}
              pointerEvents="none"
              style={[
                styles.tapHeart,
                {
                  left: tapHeartPoint.x - 22,
                  top: tapHeartPoint.y - 22,
                  opacity: tapHeartOpacity,
                  transform: [{ scale: tapHeartScale }],
                },
              ]}
            >
              <Heart size={44} color="#FE2C55" fill="#FE2C55" />
            </Animated.View>
          )}
        </TouchableOpacity>

        <View style={styles.actions}>
          <TouchableOpacity activeOpacity={0.7} style={styles.iconBtn} onPress={speakQuote}>
            <Volume2 color="rgba(212,175,55,0.95)" size={20} />
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.7} style={styles.iconBtn} onPress={handleShare}>
            <Share2 color="rgba(212,175,55,0.95)" size={20} />
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.7} style={[styles.iconBtn, isFavorite && styles.favoriteBtn]} onPress={handleFavorite}>
            <Heart
              color={isFavorite ? '#FE2C55' : 'rgba(212,175,55,0.95)'}
              size={20}
              fill={isFavorite ? '#FE2C55' : 'transparent'}
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

const GOLD = 'rgba(212,175,55,0.65)'; // slightly “richer” gold than your old amber

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    maxWidth: 760,
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
    paddingVertical: 18,
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
    color: '#fbbf24',
    fontSize: 12,
    letterSpacing: 4.8,
    fontWeight: '300',
    textTransform: 'uppercase',
  },

  chapterVerse: {
    color: '#fef3c7',
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

  quoteTapArea: {
    position: 'relative',
  },

  quoteBlock: {
    paddingTop: 34,
    paddingBottom: 26,
    paddingHorizontal: 22,
    minHeight: 212,
    justifyContent: 'center',
  },

  quoteText: {
    color: '#fef3c7',
    fontSize: 26,
    lineHeight: 38,
    textAlign: 'center',
    fontStyle: 'italic',
    fontFamily: Fonts.serif,
    fontWeight: '400',
  },

  tapHeart: {
    position: 'absolute',
  },

  quoteHindi: {
    fontStyle: 'normal',
    fontWeight: '500',
    fontFamily: undefined,
  },

  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    paddingTop: 4,
    paddingBottom: 20,
    paddingHorizontal: 18,
  },

  iconBtn: {
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: GOLD,
    backgroundColor: 'transparent',
    paddingHorizontal: 22,
    paddingVertical: 9,
    minHeight: 44,
  },

  favoriteBtn: {
    borderColor: 'rgba(212,175,55,0.75)',
    backgroundColor: 'rgba(212,175,55,0.14)',
  },
});