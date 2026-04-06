import QuoteCard from '@/components/gita/QuoteCard';
import StreakModal from '@/components/gita/StreakModal';
import LotusLoader from '@/components/ui/LotusLoader';
import { MOCK_VERSES } from '@/Data/mockverses';
import { FAVORITES_UPDATED_EVENT, fetchUserFavorites } from '@/lib/favorites';
import {
    loadPreferredLanguageForCurrentUser,
    PREFERRED_LANGUAGE_CHANGED_EVENT,
    type PreferredLanguage,
} from '@/lib/preferredLanguage';
import { fetchCurrentUserAndProfile, getProfileDisplayName, STREAK_UPDATED_EVENT } from '@/lib/profile';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Flame } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { TouchableOpacity,  DeviceEventEmitter, Pressable, ScrollView, StyleSheet, Text, View  } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Home() {
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
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
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 0);
    const diff = today.getTime() - startOfYear.getTime();
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
    setCurrentVerseIndex(dayOfYear % MOCK_VERSES.length);

    // Set greeting based on time of day
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Good Morning');
    } else if (hour < 18) {
      setGreeting('Good Afternoon');
    } else {
      setGreeting('Good Evening');
    }

    setTimeout(() => setIsLoading(false), 500);
  }, []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!mounted) return;
      await refreshIdentity();
    })();

    return () => {
      mounted = false;
    };
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
      (language: PreferredLanguage) => {
        setPreferredLanguage(language);
      }
    );

    const sub2 = DeviceEventEmitter.addListener(
      FAVORITES_UPDATED_EVENT,
      (data: { verseId: string; liked: boolean }) => {
        setFavoriteVerseIds(prev => {
          if (data.liked) {
            return prev.includes(data.verseId) ? prev : [...prev, data.verseId];
          } else {
            return prev.filter(id => id !== data.verseId);
          }
        });
      }
    );

    return () => {
      sub1.remove();
      sub2.remove();
    };
  }, []);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(STREAK_UPDATED_EVENT, (newStreak: number) => {
      setCurrentStreak(newStreak);
      // Also refresh the whole identity to get longest_streak etc. up to date
      void refreshIdentity();
    });

    return () => {
      subscription.remove();
    };
  }, [refreshIdentity]);

  const currentVerse = MOCK_VERSES[currentVerseIndex];

  return (
    <LinearGradient
      colors={['#0f172a', '#172554', '#0f172a']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <LinearGradient
            colors={['rgba(245, 158, 11, 0.08)', 'rgba(245, 158, 11, 0.03)', 'transparent']}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.glowTopRight}
          />
          <LinearGradient
            colors={['rgba(147, 197, 253, 0.05)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.glowTopLeft}
          />
        </View>

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
                <Flame size={20} color="#fbbf24" />
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
            ) : MOCK_VERSES.length === 0 ? (
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
                    // Local state update if needed (mostly handled by listener)
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  glowTopRight: {
    position: 'absolute',
    top: -200,
    right: -200,
    width: 600,
    height: 600,
    borderRadius: 300,
  },
  glowTopLeft: {
    position: 'absolute',
    top: -150,
    left: -150,
    width: 500,
    height: 500,
    borderRadius: 250,
  },
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
    color: 'rgba(251,191,36,0.5)',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 2.4,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  userName: {
    color: '#fef3c7',
    fontSize: 26,
    fontWeight: '700',
    fontFamily: 'Georgia',
    lineHeight: 32,
    marginBottom: 2,
  },
  subtitle: {
    color: 'rgba(251,191,36,0.4)',
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 2.4,
    textTransform: 'uppercase',
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
  streakIndicatorPressed: {
    opacity: 0.82,
  },
  streakText: {
    color: '#fbbf24',
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
    color: 'rgba(254,243,199,1)',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: 'rgba(251,191,36,0.7)',
  },
  footerContainer: {
    marginTop: 48,
    alignItems: 'center',
  },
  hindiQuote: {
    fontSize: 14,
    color: 'rgba(251,191,36,0.4)',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  englishQuote: {
    marginTop: 4,
    fontSize: 14,
    color: 'rgba(251,191,36,0.4)',
    textAlign: 'center',
    fontWeight: '300',
  },
});
