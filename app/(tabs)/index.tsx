import QuoteCard from '@/components/gita/QuoteCard';
import StreakModal from '@/components/gita/StreakModal';
import LotusLoader from '@/components/ui/LotusLoader';
import { FAVORITES_UPDATED_EVENT, fetchUserFavorites } from '@/lib/favorites';
import {
    loadPreferredLanguageForCurrentUser,
    PREFERRED_LANGUAGE_CHANGED_EVENT,
    type PreferredLanguage,
} from '@/lib/preferredLanguage';
import { fetchCurrentUserAndProfile, getProfileDisplayName, STREAK_UPDATED_EVENT } from '@/lib/profile';
import { fetchVerseOfTheDay, type GitaVerse } from '@/lib/verses';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/theme/colors';
import { useFocusEffect } from '@react-navigation/native';
import { Flame } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { TouchableOpacity, DeviceEventEmitter, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Home() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [verseOfTheDay, setVerseOfTheDay] = useState<GitaVerse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [greeting, setGreeting] = useState('Good Morning');
  const [isStreakModalOpen, setIsStreakModalOpen] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [isIdentityLoading, setIsIdentityLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email: string | null; auth_name: string | null } | null>(null);
  const [favoriteVerseIds, setFavoriteVerseIds] = useState<string[]>([]);
  const [preferredLanguage, setPreferredLanguage] = useState<PreferredLanguage>('english');
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [lastVisitDate, setLastVisitDate] = useState<string | null>(null);

  const refreshPreferredLanguage = useCallback(async () => {
    const language = await loadPreferredLanguageForCurrentUser();
    setPreferredLanguage(language);
  }, []);

  const refreshIdentity = useCallback(async () => {
    try {
      const { user: authUser, profile } = await fetchCurrentUserAndProfile();
      const resolvedName = getProfileDisplayName(profile, authUser);

      setDisplayName(resolvedName);
      setUser(authUser);

      if (profile) {
        setCurrentStreak(profile.streak_count);
        setLongestStreak(profile.longest_streak);
        setLastVisitDate(profile.last_opened_at);
      }

      if (authUser?.id) {
        const favs = await fetchUserFavorites(authUser.id);
        setFavoriteVerseIds(favs);
      }
    } catch {
      setDisplayName('Your Name');
    } finally {
      setIsIdentityLoading(false);
    }
  }, []);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Good Morning');
    } else if (hour < 18) {
      setGreeting('Good Afternoon');
    } else {
      setGreeting('Good Evening');
    }

    let cancelled = false;
    (async () => {
      const verse = await fetchVerseOfTheDay();
      if (!cancelled) {
        setVerseOfTheDay(verse);
        setIsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      await refreshIdentity();
    })();
    return () => { mounted = false; };
  }, [refreshIdentity]);

  useFocusEffect(
    useCallback(() => {
      void refreshPreferredLanguage();
      void refreshIdentity();
      return () => {};
    }, [refreshIdentity, refreshPreferredLanguage])
  );

  useEffect(() => {
    const sub1 = DeviceEventEmitter.addListener(
      PREFERRED_LANGUAGE_CHANGED_EVENT,
      (language: PreferredLanguage) => { setPreferredLanguage(language); }
    );
    const sub2 = DeviceEventEmitter.addListener(
      FAVORITES_UPDATED_EVENT,
      (data: { verseId: string; liked: boolean }) => {
        setFavoriteVerseIds(prev => {
          if (data.liked) return prev.includes(data.verseId) ? prev : [...prev, data.verseId];
          return prev.filter(id => id !== data.verseId);
        });
      }
    );
    return () => { sub1.remove(); sub2.remove(); };
  }, []);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(STREAK_UPDATED_EVENT, (newStreak: number) => {
      setCurrentStreak(newStreak);
      void refreshIdentity();
    });
    return () => { subscription.remove(); };
  }, [refreshIdentity]);

  const currentVerse = verseOfTheDay ? {
    id: verseOfTheDay.id,
    chapter: verseOfTheDay.chapter_number,
    verse: verseOfTheDay.verse_number,
    english: verseOfTheDay.english,
    hindi: verseOfTheDay.hindi ?? undefined,
    speaker: verseOfTheDay.speaker ?? undefined,
    meaning: verseOfTheDay.context ?? undefined,
  } : null;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            <Animated.View entering={FadeIn} style={styles.headerSection}>
              <View style={styles.headerLeft}>
                <Text style={styles.greeting}>{greeting.toUpperCase()}</Text>
                <Text style={styles.userName}>{isIdentityLoading ? 'Loading...' : displayName || 'Your Name'}</Text>
              </View>
              <TouchableOpacity activeOpacity={0.7}
                style={styles.streakIndicator}
                onPress={() => setIsStreakModalOpen(true)}
              >
                <Flame size={20} color={theme.primary} />
                <Text style={styles.streakText}>
                  <Text style={styles.streakNumber}>{currentStreak}</Text>
                  <Text style={styles.streakLabel}> days</Text>
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {isLoading ? (
              <Animated.View entering={FadeIn} style={styles.loadingContainer}>
                <LotusLoader size={110} color="#D4AF37" strokeWidth={2.8} duration={1200} />
                <Text style={styles.loadingText}>Loading divine wisdom...</Text>
              </Animated.View>
            ) : verseOfTheDay === null ? (
              <Animated.View entering={FadeIn} style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>No Verses Available</Text>
                <Text style={styles.emptySubtitle}>
                  Verses from the Bhagavad Gita will appear here soon.
                </Text>
              </Animated.View>
            ) : (
              <Animated.View entering={SlideInDown.delay(100)}>
                <QuoteCard
                  verse={currentVerse}
                  user={user ? { id: user.id, full_name: displayName, email: user.email } : null}
                  preferences={{ preferred_language: preferredLanguage, favorite_verses: favoriteVerseIds }}
                  onFavoriteToggle={(verseId, isLiked) => {
                    setFavoriteVerseIds(prev => {
                      if (isLiked) return prev.includes(verseId) ? prev : [...prev, verseId];
                      return prev.filter(id => id !== verseId);
                    });
                  }}
                  isToday={true}
                />
              </Animated.View>
            )}

            <Animated.View entering={FadeIn.delay(600)} style={styles.footerContainer}>
              <Text style={styles.hindiQuote}>
                &quot;कर्मण्येवाधिकारस्ते मा फलेषु कदाचन&quot;
              </Text>
              <Text style={styles.englishQuote}>
                You have the right to work, but never to the fruit of work
              </Text>
            </Animated.View>
          </View>
        </ScrollView>

        <StreakModal
          open={isStreakModalOpen}
          onClose={() => setIsStreakModalOpen(false)}
          preferences={{
            streak_count: currentStreak,
            longest_streak: longestStreak,
            last_visit_date: lastVisitDate ?? undefined,
          }}
        />
      </SafeAreaView>
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 21,
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: 720,
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    color: theme.goldSubtle,
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 2.4,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  userName: {
    color: theme.textWarm,
    fontSize: 26,
    fontWeight: '700',
    fontFamily: 'Georgia',
    lineHeight: 32,
    marginBottom: 2,
  },
  streakIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.6)',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 12,
  },
  streakText: {
    color: theme.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  streakNumber: {
    fontWeight: '700',
  },
  streakLabel: {
    fontWeight: '400',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 10,
  },
  loadingText: {
    color: 'rgba(253,224,112,0.7)',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.textWarm,
    marginBottom: 8,
  },
  emptySubtitle: {
    color: theme.goldText,
  },
  footerContainer: {
    marginTop: 48,
    alignItems: 'center',
  },
  hindiQuote: {
    fontSize: 14,
    color: theme.goldSubtle,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  englishQuote: {
    marginTop: 4,
    fontSize: 14,
    color: theme.goldSubtle,
    textAlign: 'center',
    fontWeight: '300',
  },
});
