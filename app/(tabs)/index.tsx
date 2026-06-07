import DharmaCoinPill from '@/components/gita/DharmaCoinPill';
import QuoteCard from '@/components/gita/QuoteCard';
import StreakModal from '@/components/gita/StreakModal';
import LotusLevel from '@/components/learning/LotusLevel';
import MountainShrine from '@/components/learning/MountainShrine';
import SunflowerLevel from '@/components/learning/SunflowerLevel';
import WoodSliceLevel from '@/components/learning/WoodSliceLevel';
import DiyaStreak from '@/components/ui/DiyaStreak';
import LotusLoader from '@/components/ui/LotusLoader';
import { PRAYERS } from '@/Data/prayers';
import { useTheme } from '@/hooks/useTheme';
import { FAVORITES_UPDATED_EVENT, fetchUserFavorites } from '@/lib/favorites';
import { fetchNextUpcomingFestival, type Festival } from '@/lib/festivals';
import {
  fetchActiveJourneyProgress,
  type ActiveJourneyProgress,
} from '@/lib/pathProgress';
import {
    loadPreferredLanguageForCurrentUser,
    PREFERRED_LANGUAGE_CHANGED_EVENT,
    type PreferredLanguage,
} from '@/lib/preferredLanguage';
import { fetchCurrentUserAndProfile, getProfileDisplayName, STREAK_UPDATED_EVENT } from '@/lib/profile';
import { getFestivalImageUrl } from '@/lib/storageAssets';
import { fetchVerseOfTheDay, type GitaVerse } from '@/lib/verses';
import type { Theme } from '@/theme/colors';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { ChevronRight } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { DeviceEventEmitter, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const DEFAULT_JOURNEY_PROGRESS: ActiveJourneyProgress = {
  slug: 'lotus',
  title: 'Lotus Path',
  currentLevel: 1,
  targetLevel: 1,
  gateLevel: 21,
  isFirstLotusLevel: true,
  isComplete: false,
};

function getDailyPrayerForDate(date: Date) {
  const calendarDay = Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000,
  );
  return PRAYERS[calendarDay % PRAYERS.length] ?? PRAYERS[0];
}

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
  const [upcomingFestival, setUpcomingFestival] = useState<Festival | null>(null);
  const [journeyProgress, setJourneyProgress] = useState<ActiveJourneyProgress>(DEFAULT_JOURNEY_PROGRESS);

  const refreshPreferredLanguage = useCallback(async () => {
    const language = await loadPreferredLanguageForCurrentUser();
    setPreferredLanguage(language);
  }, []);

  const refreshJourneyProgress = useCallback(async () => {
    const progress = await fetchActiveJourneyProgress();
    setJourneyProgress(progress);
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
      const [verse, festival] = await Promise.all([
        fetchVerseOfTheDay(),
        fetchNextUpcomingFestival(),
      ]);
      if (!cancelled) {
        setVerseOfTheDay(verse);
        setIsLoading(false);
        setUpcomingFestival(festival);
      }
    })();
    void refreshJourneyProgress();

    return () => { cancelled = true; };
  }, [refreshJourneyProgress]);

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
      void refreshJourneyProgress();
      return () => {};
    }, [refreshIdentity, refreshJourneyProgress, refreshPreferredLanguage])
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
  const dailyPrayer = getDailyPrayerForDate(new Date());
  const journeyTitle = journeyProgress.isFirstLotusLevel ? 'Start your journey' : 'Continue journey';
  const journeyDetail = `${journeyProgress.title} level ${journeyProgress.targetLevel}`;

  const openJourneyLevel = () => {
    if (journeyProgress.slug === 'lotus') {
      router.push({
        pathname: '/world-level/[id]',
        params: { id: String(journeyProgress.targetLevel), returnToPath: 'lotus' },
      });
      return;
    }

    if (journeyProgress.slug === 'mountain') {
      router.push({
        pathname: '/mountain-level/[id]',
        params: { id: String(journeyProgress.targetLevel), returnToPath: 'mountain' },
      });
      return;
    }

    if (journeyProgress.slug === 'garden') {
      router.push({
        pathname: '/garden-level/[id]',
        params: { id: String(journeyProgress.targetLevel), returnToPath: 'garden' },
      });
      return;
    }

    router.push({
      pathname: '/forest-level/[id]',
      params: { id: String(journeyProgress.targetLevel), returnToPath: 'forest' },
    });
  };

  const openDailyPrayer = () => {
    router.push({
      pathname: '/(tabs)/prayer',
      params: { id: dailyPrayer.id },
    });
  };

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
              <View style={styles.headerRight}>
                <DharmaCoinPill />
                <DiyaStreak
                  streak={currentStreak}
                  onPress={() => setIsStreakModalOpen(true)}
                  textColor={theme.primary}
                />
              </View>
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

            {upcomingFestival && (
              <Animated.View entering={FadeIn.delay(400)} style={styles.festivalCardWrapper}>
                <TouchableOpacity
                  style={styles.festivalCard}
                  activeOpacity={0.75}
                  onPress={() => router.push({ pathname: '/festival-detail', params: { id: upcomingFestival.id } })}
                >
                  <FestivalImage name={upcomingFestival.name} emoji={upcomingFestival.icon_emoji} />
                  <View style={styles.festivalTextGroup}>
                    <Text style={styles.festivalLabel}>UPCOMING FESTIVAL</Text>
                    <Text style={styles.festivalName} numberOfLines={1}>{upcomingFestival.name}</Text>
                    <Text style={styles.festivalDate}>{formatFestivalDate(upcomingFestival.main_date)}</Text>
                  </View>
                  <ChevronRight size={18} color="rgba(251,191,36,0.5)" />
                </TouchableOpacity>
              </Animated.View>
            )}

            <Animated.View entering={FadeIn.delay(500)} style={styles.actionCardsRow}>
              <TouchableOpacity
                style={styles.homeActionCard}
                activeOpacity={0.78}
                onPress={openJourneyLevel}
              >
                <View style={styles.homeActionIconSlot} pointerEvents="none">
                  <JourneyLevelNode progress={journeyProgress} />
                </View>
                <View style={styles.homeActionChevron}>
                  <ChevronRight size={16} color="rgba(251,191,36,0.45)" />
                </View>
                <View style={styles.homeActionTextGroup}>
                  <Text
                    style={styles.homeActionTitle}
                    numberOfLines={1}
                  >
                    {journeyTitle}
                  </Text>
                  <Text style={styles.homeActionDetail} numberOfLines={1}>
                    {journeyDetail}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.homeActionCard}
                activeOpacity={0.78}
                onPress={openDailyPrayer}
              >
                <View style={styles.homeActionIconSlot}>
                  <Image
                    source={dailyPrayer.thumbnail}
                    style={styles.prayerThumb}
                    contentFit="cover"
                  />
                </View>
                <View style={styles.homeActionChevron}>
                  <ChevronRight size={16} color="rgba(251,191,36,0.45)" />
                </View>
                <View style={styles.homeActionTextGroup}>
                  <Text
                    style={styles.homeActionTitle}
                    numberOfLines={1}
                  >
                    Daily prayer
                  </Text>
                  <Text style={styles.homeActionDetail} numberOfLines={1}>
                    {dailyPrayer.name}
                  </Text>
                </View>
              </TouchableOpacity>
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

function JourneyLevelNode({ progress }: { progress: ActiveJourneyProgress }) {
  const noop = useCallback(() => {}, []);
  const isGate = progress.targetLevel === progress.gateLevel;

  if (progress.slug === 'mountain') {
    return (
      <View style={journeyNodeStyles.mountainScale}>
        <MountainShrine
          level={progress.targetLevel}
          side="left"
          isCompleted={false}
          isLocked={false}
          isActive={true}
          isWisdomGate={isGate}
          onPress={noop}
        />
      </View>
    );
  }

  if (progress.slug === 'garden') {
    return (
      <View style={journeyNodeStyles.gardenScale}>
        <SunflowerLevel
          level={progress.targetLevel}
          isCompleted={false}
          isLocked={false}
          isActive={true}
          onPress={noop}
        />
      </View>
    );
  }

  if (progress.slug === 'forest') {
    return (
      <View style={journeyNodeStyles.forestScale}>
        <WoodSliceLevel
          level={progress.targetLevel}
          isCompleted={false}
          isLocked={false}
          isActive={true}
          onPress={noop}
        />
      </View>
    );
  }

  return (
    <View style={journeyNodeStyles.lotusScale}>
      <LotusLevel
        level={progress.targetLevel}
        isCompleted={false}
        isLocked={false}
        isActive={true}
        onPress={noop}
        size="sm"
        showEffects={false}
      />
    </View>
  );
}

const journeyNodeStyles = StyleSheet.create({
  lotusScale: {
    transform: [{ scale: 1.04 }],
  },
  mountainScale: {
    transform: [{ scale: 0.58 }],
  },
  gardenScale: {
    transform: [{ scale: 0.58 }],
  },
  forestScale: {
    transform: [{ scale: 0.5 }],
  },
});

function formatFestivalDate(mainDate: string): string {
  const [year, month, day] = mainDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const monthName = date.toLocaleDateString('en-US', { month: 'long' });
  const d = date.getDate();
  const suffix = d === 1 || d === 21 || d === 31 ? 'st' : d === 2 || d === 22 ? 'nd' : d === 3 || d === 23 ? 'rd' : 'th';
  return `${monthName} ${d}${suffix}`;
}

function FestivalImage({ name, emoji }: { name: string; emoji: string }) {
  const [hasError, setHasError] = useState(false);
  const imageUrl = getFestivalImageUrl(name);

  if (!imageUrl || hasError) {
    return (
      <View style={festivalImageStyles.fallback}>
        <Text style={festivalImageStyles.emoji}>{emoji || '🕉️'}</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: imageUrl }}
      style={festivalImageStyles.image}
      contentFit="cover"
      onError={() => setHasError(true)}
    />
  );
}

const festivalImageStyles = StyleSheet.create({
  image: {
    width: 52,
    height: 52,
    borderRadius: 12,
  },
  fallback: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: 'rgba(251,191,36,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 26,
  },
});

const createStyles = (theme: Theme) => StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: 720,
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 14,
    flexShrink: 0,
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
  festivalCardWrapper: {
    marginTop: 16,
    width: '100%',
  },
  festivalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: theme.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.2)',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  festivalTextGroup: {
    flex: 1,
    gap: 2,
  },
  festivalLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.8,
    color: theme.goldSubtle,
  },
  festivalName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textWarm,
    fontFamily: 'Georgia',
  },
  festivalDate: {
    fontSize: 13,
    color: theme.goldText,
    fontWeight: '500',
  },
  actionCardsRow: {
    marginTop: 14,
    width: '100%',
    flexDirection: 'row',
    gap: 12,
  },
  homeActionCard: {
    flex: 1,
    minWidth: 0,
    height: 122,
    backgroundColor: theme.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.2)',
    position: 'relative',
  },
  homeActionIconSlot: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeActionChevron: {
    position: 'absolute',
    top: 28,
    right: 14,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prayerThumb: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(251,191,36,0.1)',
  },
  homeActionTextGroup: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: 70,
    height: 40,
  },
  homeActionTitle: {
    color: theme.textWarm,
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '800',
    fontFamily: 'Georgia',
  },
  homeActionDetail: {
    marginTop: 2,
    color: theme.goldText,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '600',
  },
});
