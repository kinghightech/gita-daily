import QuoteCard from '@/components/gita/QuoteCard';
import FestivalModal from '@/components/gita/FestivalModal';
import LotusLoader from '@/components/ui/LotusLoader';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/theme/colors';
import { MOCK_VERSES, Verse } from '@/Data/mockverses';
import { BADGE_DEFINITIONS, BADGE_ICONS, UserStats, checkAndAwardBadges, fetchUserBadges } from '@/lib/badges';
import {
  FAVORITES_UPDATED_EVENT,
  FESTIVALS_UPDATED_EVENT,
  fetchUserFavorites,
  fetchUserFestivalFavorites,
} from '@/lib/favorites';
import { Festival, fetchAllFestivals, getFestivalSymbol } from '@/lib/festivals';
import { NOTES_UPDATED_EVENT, fetchUserNotes, type UserNote } from '@/lib/notes';
import {
  PREFERRED_LANGUAGE_CHANGED_EVENT,
  loadPreferredLanguageForCurrentUser,
  mapLabelToPreferredLanguage,
  mapPreferredLanguageToLabel,
  savePreferredLanguageForCurrentUser,
} from '@/lib/preferredLanguage';
import { STREAK_UPDATED_EVENT, fetchCurrentUserAndProfile, getProfileDisplayName } from '@/lib/profile';
import { supabase } from '@/lib/supabase';
import { fetchAllGitaVerses } from '@/lib/verses';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import {
  Check,
  ChevronRight,
  Feather,
  Flame,
  Flower2,
  Heart,
  LogOut,
  RotateCcw,
  Settings,
  Star,
  Trash2,
  X,
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  DeviceEventEmitter,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PLACEHOLDER_VERSES: Verse[] = [
  { id: 'placeholder-1', chapter: 1, verse: 47, english: 'Placeholder quote alpha for scroll testing only.', hindi: 'placeholder', speaker: 'Sanjaya' },
  { id: 'placeholder-2', chapter: 1, verse: 1, english: 'Placeholder quote beta to test long scrolling behavior.', hindi: 'placeholder', speaker: 'Dhritarashtra' },
  { id: 'placeholder-3', chapter: 1, verse: 21, english: 'Placeholder quote gamma with italic serif visual alignment.', hindi: 'placeholder', speaker: 'Arjuna' },
  { id: 'placeholder-4', chapter: 2, verse: 11, english: 'Placeholder quote delta for card height consistency.', hindi: 'placeholder', speaker: 'Krishna' },
  { id: 'placeholder-5', chapter: 2, verse: 13, english: 'Placeholder quote epsilon showing truncated two-line text.', hindi: 'placeholder', speaker: 'Krishna' },
  { id: 'placeholder-6', chapter: 2, verse: 17, english: 'Placeholder quote zeta used to verify list card scrolling.', hindi: 'placeholder', speaker: 'Krishna' },
  { id: 'placeholder-7', chapter: 3, verse: 30, english: 'Placeholder quote eta for UI-only layout testing.', hindi: 'placeholder', speaker: 'Krishna' },
  { id: 'placeholder-8', chapter: 4, verse: 7, english: 'Placeholder quote theta to increase vertical content length.', hindi: 'placeholder', speaker: 'Krishna' },
  { id: 'placeholder-9', chapter: 5, verse: 10, english: 'Placeholder quote iota for repeated card style validation.', hindi: 'placeholder', speaker: 'Krishna' },
  { id: 'placeholder-10', chapter: 6, verse: 5, english: 'Placeholder quote kappa to verify footer stays below list.', hindi: 'placeholder', speaker: 'Krishna' },
  { id: 'placeholder-11', chapter: 8, verse: 6, english: 'Placeholder quote lambda for style-only testing.', hindi: 'placeholder', speaker: 'Krishna' },
  { id: 'placeholder-12', chapter: 9, verse: 22, english: 'Placeholder quote mu to stress-test internal scroll area.', hindi: 'placeholder', speaker: 'Krishna' },
];
const ALL_VERSES = [...MOCK_VERSES, ...PLACEHOLDER_VERSES];

type ProfileData = {
  id: string;
  full_name: string;
  email: string;
  streak_count: number;
  longest_streak: number;
  last_opened_at: string | null;
  created_at: string | null;
  preferred_language: string | null;
  current_lotus_level?: number;
  shares_count?: number;
};

const ONBOARDING_COMPLETE_KEY = 'gitaDaily.onboardingComplete.v1';
const ONBOARDING_PROFILE_KEY = 'gitaDaily.onboardingProfile.v1';
const ONBOARDING_REPLAY_EVENT = 'gitaDaily.replayOnboarding';

export default function ProfileScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData>({
    id: '',
    full_name: '',
    email: '',
    streak_count: 0,
    longest_streak: 0,
    last_opened_at: null,
    created_at: null,
    preferred_language: 'english',
    current_lotus_level: 1,
  });
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [favoriteVerseIds, setFavoriteVerseIds] = useState<string[]>([]);
  const [favoriteFestivalIds, setFavoriteFestivalIds] = useState<string[]>([]);
  const [earnedBadgeIds, setEarnedBadgeIds] = useState<string[]>([]);
  const [allFestivals, setAllFestivals] = useState<Festival[]>([]);
  const [userNotes, setUserNotes] = useState<UserNote[]>([]);
  const [supabaseVerses, setSupabaseVerses] = useState<Verse[]>([]);
  const [selectedFavVerse, setSelectedFavVerse] = useState<Verse | null>(null);
  const [selectedFestival, setSelectedFestival] = useState<Festival | null>(null);
  const pageScrollRef = useRef<ScrollView>(null);
  const quoteBoxYRef = useRef(0);
  const profileIdRef = useRef('');

  const refreshProfileIdentity = async () => {
    try {
      const { user, profile: currentProfile } = await fetchCurrentUserAndProfile();
      if (!user) return;

      const resolvedName = getProfileDisplayName(currentProfile, user);
      const resolvedEmail =
        (typeof currentProfile?.email === 'string' ? currentProfile.email : '') ||
        user?.email ||
        '';

      const preferredLanguage = await loadPreferredLanguageForCurrentUser();

      const [favIds, favFestIds, festivals, medalIds, notes, gitaVerses] = await Promise.all([
        fetchUserFavorites(user.id),
        fetchUserFestivalFavorites(user.id),
        fetchAllFestivals(),
        fetchUserBadges(user.id),
        fetchUserNotes(user.id),
        fetchAllGitaVerses(),
      ]);

      setFavoriteVerseIds(favIds);
      setFavoriteFestivalIds(favFestIds);
      setAllFestivals(festivals);
      setUserNotes(notes);

      const mapped: Verse[] = gitaVerses.map((v) => ({
        id: v.id,
        chapter: v.chapter_number,
        verse: v.verse_number,
        english: v.english,
        hindi: v.hindi || '',
        speaker: v.speaker || undefined,
      }));
      setSupabaseVerses(mapped);

      const stats: UserStats = {
        streakCount: currentProfile?.streak_count ?? 0,
        levelCount: currentProfile?.current_lotus_level ?? 1,
        favQuotesCount: favIds.length,
        favFestivalsCount: favFestIds.length,
        lessonsDoneCount: Math.max(0, (currentProfile?.current_lotus_level ?? 1) - 1),
        notesCount: notes.length,
        sharesCount: currentProfile?.shares_count ?? 0,
      };
      const finalBadgeIds = await checkAndAwardBadges(user.id, stats, medalIds);
      setEarnedBadgeIds(finalBadgeIds);

      profileIdRef.current = user.id;
      setProfile({
        id: user.id,
        full_name: resolvedName,
        email: resolvedEmail,
        streak_count: currentProfile?.streak_count ?? 0,
        longest_streak: currentProfile?.longest_streak ?? 0,
        last_opened_at: currentProfile?.last_opened_at ?? null,
        created_at: currentProfile?.created_at ?? null,
        preferred_language: preferredLanguage,
        current_lotus_level: currentProfile?.current_lotus_level ?? 1,
      });
      setSelectedLanguage(mapPreferredLanguageToLabel(preferredLanguage));
    } catch (e) {
      console.error('Profile refresh error:', e);
    } finally {
      setIsProfileLoading(false);
    }
  };

  useEffect(() => {
    void refreshProfileIdentity();
  }, []);

  useEffect(() => {
    const subs = [
      DeviceEventEmitter.addListener(STREAK_UPDATED_EVENT, refreshProfileIdentity),
      DeviceEventEmitter.addListener(FAVORITES_UPDATED_EVENT, refreshProfileIdentity),
      DeviceEventEmitter.addListener(FESTIVALS_UPDATED_EVENT, refreshProfileIdentity),
      DeviceEventEmitter.addListener(NOTES_UPDATED_EVENT, refreshProfileIdentity),
    ];
    return () => subs.forEach((s) => s.remove());
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refreshProfileIdentity();
      return () => {};
    }, [])
  );

  const COMBINED_VERSES = useMemo(() => {
    const supaIds = new Set(supabaseVerses.map((v) => v.id));
    const filtered = ALL_VERSES.filter((v) => !supaIds.has(v.id));
    return [...supabaseVerses, ...filtered];
  }, [supabaseVerses]);

  const favoriteVerses = useMemo(
    () => COMBINED_VERSES.filter((v) => favoriteVerseIds.includes(v.id)),
    [favoriteVerseIds, COMBINED_VERSES]
  );

  const favoriteFestivals = useMemo(
    () => allFestivals.filter((f) => favoriteFestivalIds.includes(f.id)),
    [allFestivals, favoriteFestivalIds]
  );

  const earnedBadges = useMemo(
    () => BADGE_DEFINITIONS.filter((b) => earnedBadgeIds.includes(b.id)),
    [earnedBadgeIds]
  );

  const handleFavSelect = (verse: Verse) => {
    setSelectedFavVerse(verse);
    setTimeout(() => {
      pageScrollRef.current?.scrollTo({
        y: Math.max(quoteBoxYRef.current - 16, 0),
        animated: true,
      });
    }, 120);
  };

  const replayOnboarding = async () => {
    try {
      await AsyncStorage.removeItem(ONBOARDING_COMPLETE_KEY);
      await AsyncStorage.removeItem(ONBOARDING_PROFILE_KEY);
      DeviceEventEmitter.emit(ONBOARDING_REPLAY_EVENT);
    } catch {
      Alert.alert('Error', 'Could not reset onboarding.');
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Error', error.message);
      return;
    }
    await AsyncStorage.removeItem(ONBOARDING_COMPLETE_KEY);
    await AsyncStorage.removeItem(ONBOARDING_PROFILE_KEY);
    DeviceEventEmitter.emit(ONBOARDING_REPLAY_EVENT);
  };

  if (isProfileLoading) {
    return (
      <View style={styles.root}>
        <View style={styles.loadingFull}>
          <LotusLoader size={110} color="#fbbf24" strokeWidth={2.8} />
          <Text style={styles.loadingText}>Loading your journey...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <ScrollView
          ref={pageScrollRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ── */}
          <View style={styles.header}>
            <Text style={styles.name} numberOfLines={1}>
              {profile.full_name || 'Your Name'}
            </Text>
            <Text style={styles.email} numberOfLines={1}>
              {profile.email || 'guest@gita.daily'}
            </Text>
          </View>

          {/* ── Stats Card ── */}
          <View style={styles.glass}>
            <BlurView intensity={20} tint={theme.blurTint} style={StyleSheet.absoluteFill} />
            <View style={styles.statsRow}>
              <StatItem
                icon={<Flame size={18} color="#fbbf24" strokeWidth={1.8} />}
                value={profile.streak_count}
                label="Day Streak"
              />
              <View style={styles.vDivider} />
              <StatItem
                icon={<Flower2 size={18} color="#86efac" strokeWidth={1.8} />}
                value={profile.current_lotus_level || 1}
                label="Lotus Level"
              />
            </View>
            <View style={styles.hDivider} />
            <View style={styles.statsRow}>
              <StatItem
                icon={<Heart size={18} color="#f87171" fill="#f87171" strokeWidth={0} />}
                value={favoriteVerseIds.length}
                label="Saved Verses"
              />
              <View style={styles.vDivider} />
              <StatItem
                icon={<Star size={18} color="#93c5fd" fill="#93c5fd" strokeWidth={0} />}
                value={favoriteFestivalIds.length}
                label="Festivals"
              />
            </View>
          </View>

          {/* ── Achievements ── */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push('/badges')}
            style={styles.glass}
          >
            <BlurView intensity={20} tint={theme.blurTint} style={StyleSheet.absoluteFill} />
            <View style={styles.achHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>Achievements</Text>
                <Text style={styles.achSub}>
                  <Text style={styles.achSubStrong}>{earnedBadgeIds.length}</Text> of{' '}
                  {BADGE_DEFINITIONS.length} unlocked
                </Text>
              </View>
              <ChevronRight size={20} color={theme.subtext} strokeWidth={1.8} />
            </View>

            {earnedBadges.length === 0 ? (
              <Text style={styles.achEmpty}>Begin your journey to earn badges</Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.achList}
                pointerEvents="none"
              >
                {earnedBadges.map((badge) => {
                  const Icon = BADGE_ICONS[badge.icon] || Star;
                  return (
                    <View key={badge.id} style={styles.achPill}>
                      <View style={styles.achIconWrap}>
                        <Icon size={22} color="#fbbf24" strokeWidth={1.7} />
                      </View>
                      <Text style={styles.achPillTitle} numberOfLines={1}>
                        {badge.title}
                      </Text>
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </TouchableOpacity>

          {/* ── Saved Verses ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Heart size={14} color="#f87171" fill="#f87171" strokeWidth={0} />
              <Text style={styles.sectionEyebrow}>Saved Verses</Text>
              {favoriteVerses.length > 0 && (
                <Text style={styles.sectionCount}>{favoriteVerses.length}</Text>
              )}
              {favoriteVerses.length > 0 && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => router.push('/saved-verses')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <ChevronRight size={18} color={theme.subtext} strokeWidth={1.8} />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.glass}>
              <BlurView intensity={20} tint={theme.blurTint} style={StyleSheet.absoluteFill} />
              {favoriteVerses.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <Heart size={28} color="rgba(248,113,113,0.25)" strokeWidth={1.6} />
                  <Text style={styles.emptyText}>No saved verses yet</Text>
                  <Text style={styles.emptySub}>
                    Tap the heart on any verse to save it here.
                  </Text>
                </View>
              ) : (
                <ScrollView
                  nestedScrollEnabled
                  style={styles.verseListScroll}
                  contentContainerStyle={styles.list}
                  showsVerticalScrollIndicator={false}
                >
                  {favoriteVerses.map((verse, index) => {
                    const isSelected = selectedFavVerse?.id === verse.id;
                    return (
                      <TouchableOpacity
                        activeOpacity={0.7}
                        key={verse.id}
                        onPress={() => handleFavSelect(verse)}
                        style={[
                          styles.listItem,
                          index === 0 && styles.listItemFirst,
                          index === favoriteVerses.length - 1 && styles.listItemLast,
                          isSelected && styles.listItemSelected,
                        ]}
                      >
                        <View style={styles.listItemHeader}>
                          <Text style={styles.listItemRef}>
                            {verse.chapter}.{verse.verse}
                          </Text>
                          <Heart size={11} color="#f87171" fill="#f87171" strokeWidth={0} />
                        </View>
                        <Text style={styles.listItemBody} numberOfLines={2}>
                          {verse.english}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>
          </View>

          {/* ── Saved Festivals ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Star size={14} color="#93c5fd" fill="#93c5fd" strokeWidth={0} />
              <Text style={styles.sectionEyebrow}>Saved Festivals</Text>
              {favoriteFestivals.length > 0 && (
                <Text style={styles.sectionCount}>{favoriteFestivals.length}</Text>
              )}
            </View>
            <View style={styles.glass}>
              <BlurView intensity={20} tint={theme.blurTint} style={StyleSheet.absoluteFill} />
              {favoriteFestivals.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <Star size={28} color="rgba(147,197,253,0.25)" strokeWidth={1.6} />
                  <Text style={styles.emptyText}>No saved festivals yet</Text>
                  <Text style={styles.emptySub}>
                    Save festivals from the Learn tab to revisit them here.
                  </Text>
                </View>
              ) : (
                <View style={styles.list}>
                  {favoriteFestivals.map((fest, index) => (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      key={fest.id}
                      onPress={() => setSelectedFestival(fest)}
                      style={[
                        styles.listItem,
                        index === 0 && styles.listItemFirst,
                        index === favoriteFestivals.length - 1 && styles.listItemLast,
                      ]}
                    >
                      <View style={styles.listItemHeader}>
                        <Text style={[styles.listItemRef, { color: '#93c5fd' }]}>
                          {getFestivalSymbol(fest.name, fest.icon_emoji)} {fest.name}
                        </Text>
                        <ChevronRight size={14} color={theme.subtextMuted} strokeWidth={1.8} />
                      </View>
                      <Text style={styles.listItemBody} numberOfLines={1}>
                        {fest.display_date}
                        {fest.deity ? ` · ${fest.deity}` : ''}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* ── Reflections (Notes) ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Feather size={14} color="rgba(251,191,36,0.85)" strokeWidth={1.8} />
              <Text style={styles.sectionEyebrow}>Reflections</Text>
              {userNotes.length > 0 && (
                <Text style={styles.sectionCount}>{userNotes.length}</Text>
              )}
            </View>
            <View style={styles.glass}>
              <BlurView intensity={20} tint={theme.blurTint} style={StyleSheet.absoluteFill} />
              {userNotes.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <Feather size={28} color="rgba(251,191,36,0.2)" strokeWidth={1.6} />
                  <Text style={styles.emptyText}>No reflections yet</Text>
                  <Text style={styles.emptySub}>
                    Add a note from the Read tab to keep your thoughts here.
                  </Text>
                </View>
              ) : (
                <View style={styles.list}>
                  {userNotes.map((note, index) => {
                    const verseData = note.verse;
                    const verseRef = verseData
                      ? `${verseData.chapter_number}:${verseData.verse_number}`
                      : '—';
                    const dateStr = new Date(note.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });
                    return (
                      <View
                        key={note.id}
                        style={[
                          styles.listItem,
                          index === 0 && styles.listItemFirst,
                          index === userNotes.length - 1 && styles.listItemLast,
                        ]}
                      >
                        <View style={styles.listItemHeader}>
                          <Text style={styles.listItemRef}>{verseRef}</Text>
                          <Text style={styles.listItemMeta}>{dateStr}</Text>
                        </View>
                        {verseData && (
                          <Text style={styles.notePreview} numberOfLines={1}>
                            {verseData.english}
                          </Text>
                        )}
                        <Text style={styles.noteBody} numberOfLines={3}>
                          {note.note_text}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </View>

          {/* ── Settings ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Settings size={14} color={theme.subtext} strokeWidth={1.8} />
              <Text style={styles.sectionEyebrow}>Settings</Text>
            </View>
            <View style={styles.glass}>
              <BlurView intensity={20} tint={theme.blurTint} style={StyleSheet.absoluteFill} />
              <Pressable
                onPress={() => setIsLangOpen(!isLangOpen)}
                style={({ pressed }) => [
                  styles.settingRow,
                  styles.settingRowFirst,
                  pressed && styles.settingRowPressed,
                ]}
              >
                <Text style={styles.settingLabel}>Language</Text>
                <View style={styles.settingValueRow}>
                  <Text style={styles.settingValue}>{selectedLanguage}</Text>
                  <ChevronRight
                    size={18}
                    color={theme.subtext}
                    strokeWidth={1.8}
                    style={{ transform: [{ rotate: isLangOpen ? '90deg' : '0deg' }] }}
                  />
                </View>
              </Pressable>

              {isLangOpen && (
                <View style={styles.langOptions}>
                  {['English', 'Hindi'].map((lang) => {
                    const isActive = selectedLanguage === lang;
                    return (
                      <Pressable
                        key={lang}
                        onPress={() => {
                          setSelectedLanguage(lang);
                          setIsLangOpen(false);
                          const code = mapLabelToPreferredLanguage(lang);
                          if (code) {
                            void savePreferredLanguageForCurrentUser(code);
                            DeviceEventEmitter.emit(PREFERRED_LANGUAGE_CHANGED_EVENT, code);
                          }
                        }}
                        style={({ pressed }) => [
                          styles.langOption,
                          pressed && styles.settingRowPressed,
                        ]}
                      >
                        <Text
                          style={[
                            styles.langOptionText,
                            isActive && styles.langOptionTextActive,
                          ]}
                        >
                          {lang}
                        </Text>
                        {isActive && <Check size={16} color="#fbbf24" strokeWidth={2.2} />}
                      </Pressable>
                    );
                  })}
                </View>
              )}

              <View style={styles.rowDivider} />

              <Pressable
                onPress={replayOnboarding}
                style={({ pressed }) => [
                  styles.settingRow,
                  styles.settingRowLast,
                  pressed && styles.settingRowPressed,
                ]}
              >
                <View style={styles.settingLeft}>
                  <RotateCcw size={16} color={theme.subtext} strokeWidth={1.8} />
                  <Text style={styles.settingLabel}>Replay Onboarding</Text>
                </View>
                <ChevronRight size={18} color={theme.subtext} strokeWidth={1.8} />
              </Pressable>
            </View>
          </View>

          {/* ── Account actions ── */}
          <View style={styles.dangerRow}>
            <Pressable
              onPress={handleSignOut}
              style={({ pressed }) => [styles.outlineBtn, pressed && styles.btnPressed]}
            >
              <LogOut size={16} color={theme.text} strokeWidth={1.8} />
              <Text style={styles.outlineBtnText}>Sign Out</Text>
            </Pressable>
            <Pressable
              onPress={() => Alert.alert('Delete', 'Account deletion coming soon.')}
              style={({ pressed }) => [styles.dangerBtn, pressed && styles.btnPressed]}
            >
              <Trash2 size={16} color="rgba(248,113,113,0.85)" strokeWidth={1.8} />
              <Text style={styles.dangerBtnText}>Delete Account</Text>
            </Pressable>
          </View>

          {/* ── Verse Preview ── */}
          {selectedFavVerse && (
            <View
              style={styles.quoteBox}
              onLayout={(e) => {
                quoteBoxYRef.current = e.nativeEvent.layout.y;
              }}
            >
              <View style={styles.quoteBoxHeader}>
                <Text style={styles.quoteBoxTitle}>Revisiting Wisdom</Text>
                <TouchableOpacity activeOpacity={0.7} onPress={() => setSelectedFavVerse(null)}>
                  <X color={theme.subtext} size={22} strokeWidth={1.8} />
                </TouchableOpacity>
              </View>
              <QuoteCard
                verse={selectedFavVerse}
                user={{ id: profile.id, full_name: profile.full_name || '', email: profile.email || '' }}
                preferences={{
                  preferred_language: profile.preferred_language || 'english',
                  favorite_verses: favoriteVerseIds,
                }}
                onFavoriteToggle={() => {}}
                isToday={false}
              />
            </View>
          )}

          <FestivalModal festival={selectedFestival} onClose={() => setSelectedFestival(null)} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function StatItem({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
}) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={styles.statItem}>
      <View style={styles.statIconRow}>{icon}</View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.background },
  safe: { flex: 1 },
  scrollContent: { paddingBottom: 140, paddingHorizontal: 20 },

  header: { paddingTop: 16, paddingBottom: 28 },
  eyebrow: { color: theme.subtext, fontSize: 11, fontWeight: '600', letterSpacing: 1.6, textTransform: 'uppercase', marginBottom: 10 },
  name: { color: theme.text, fontSize: 32, fontWeight: '700', letterSpacing: -0.5, lineHeight: 38 },
  email: { color: theme.subtext, fontSize: 14, fontWeight: '400', marginTop: 4 },

  glass: { borderRadius: 20, overflow: 'hidden', backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, marginBottom: 20 },

  statsRow: { flexDirection: 'row', alignItems: 'stretch' },
  statItem: { flex: 1, paddingVertical: 18, paddingHorizontal: 18, gap: 6 },
  statIconRow: { height: 22, flexDirection: 'row', alignItems: 'center' },
  statValue: { color: theme.text, fontSize: 28, fontWeight: '700', fontFamily: Fonts.serif, lineHeight: 32, letterSpacing: -0.5 },
  statLabel: { color: theme.subtext, fontSize: 11, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase' },
  vDivider: { width: 1, backgroundColor: theme.border, marginVertical: 14 },
  hDivider: { height: 1, backgroundColor: theme.border },

  achHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingTop: 18, paddingBottom: 14 },
  sectionTitle: { color: theme.text, fontSize: 16, fontWeight: '600', letterSpacing: -0.2 },
  achSub: { color: theme.subtext, fontSize: 12, fontWeight: '500', marginTop: 3 },
  achSubStrong: { color: '#fbbf24', fontWeight: '700' },
  achEmpty: { color: theme.subtextMuted, fontSize: 13, paddingHorizontal: 18, paddingBottom: 18, fontStyle: 'italic' },
  achList: { paddingHorizontal: 18, paddingBottom: 18, gap: 14 },
  achPill: { alignItems: 'center', width: 68, gap: 8 },
  achIconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(251,191,36,0.08)', borderWidth: 1, borderColor: 'rgba(251,191,36,0.18)', alignItems: 'center', justifyContent: 'center' },
  achPillTitle: { color: theme.subtext, fontSize: 11, fontWeight: '600', textAlign: 'center', letterSpacing: 0.1 },

  section: { marginBottom: 6 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4, marginBottom: 12 },
  sectionEyebrow: { color: theme.subtext, fontSize: 12, fontWeight: '600', letterSpacing: 1.4, textTransform: 'uppercase', flex: 1 },
  sectionCount: { color: theme.subtextMuted, fontSize: 12, fontWeight: '600', fontVariant: ['tabular-nums'] },

  verseListScroll: { maxHeight: 296 },

  list: { paddingHorizontal: 4, paddingVertical: 4 },
  listItem: { paddingHorizontal: 14, paddingVertical: 14 },
  listItemFirst: { paddingTop: 14 },
  listItemLast: { paddingBottom: 14 },
  listItemSelected: { backgroundColor: 'rgba(251,191,36,0.06)' },
  listItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  listItemRef: { color: '#fbbf24', fontSize: 12, fontWeight: '700', letterSpacing: 0.4 },
  listItemMeta: { color: theme.subtextMuted, fontSize: 11, fontWeight: '500', fontVariant: ['tabular-nums'] },
  listItemBody: { color: theme.text, fontSize: 14, lineHeight: 20, fontWeight: '400' },

  notePreview: { color: theme.subtextMuted, fontSize: 12, fontStyle: 'italic', marginBottom: 6 },
  noteBody: { color: theme.text, fontSize: 14, lineHeight: 20 },

  emptyWrap: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 24, gap: 8 },
  emptyText: { color: theme.subtext, fontSize: 14, fontWeight: '500' },
  emptySub: { color: theme.subtextMuted, fontSize: 12, textAlign: 'center', lineHeight: 18, maxWidth: 240 },

  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 16 },
  settingRowFirst: { paddingTop: 18 },
  settingRowLast: { paddingBottom: 18 },
  settingRowPressed: { backgroundColor: theme.surface },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingLabel: { color: theme.text, fontSize: 15, fontWeight: '500' },
  settingValueRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  settingValue: { color: theme.subtext, fontSize: 14, fontWeight: '500' },
  langOptions: { paddingHorizontal: 8, paddingBottom: 6 },
  langOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, paddingVertical: 12, borderRadius: 10 },
  langOptionText: { color: theme.subtext, fontSize: 14, fontWeight: '500' },
  langOptionTextActive: { color: '#fbbf24', fontWeight: '600' },
  rowDivider: { height: 1, backgroundColor: theme.border, marginHorizontal: 18 },

  dangerRow: { flexDirection: 'row', gap: 12, marginTop: 8, marginBottom: 12 },
  outlineBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 14, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
  outlineBtnText: { color: theme.text, fontSize: 14, fontWeight: '600' },
  dangerBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 14, backgroundColor: 'rgba(248,113,113,0.06)', borderWidth: 1, borderColor: 'rgba(248,113,113,0.15)' },
  dangerBtnText: { color: 'rgba(248,113,113,0.95)', fontSize: 14, fontWeight: '600' },
  btnPressed: { opacity: 0.65 },

  quoteBox: { marginTop: 24 },
  quoteBoxHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 4 },
  quoteBoxTitle: { color: theme.subtext, fontSize: 11, fontWeight: '600', letterSpacing: 1.6, textTransform: 'uppercase' },

  loadingFull: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, minHeight: 400 },
  loadingText: { color: theme.subtext, fontSize: 14, fontWeight: '500', letterSpacing: 0.4 },
});
