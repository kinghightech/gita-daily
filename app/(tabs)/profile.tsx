import BackgroundLayout from '@/components/BackgroundLayout';
import QuoteCard from '@/components/gita/QuoteCard';
import { Fonts, GitaColors } from '@/constants/theme';
import { FAVORITES_UPDATED_EVENT, FESTIVALS_UPDATED_EVENT, fetchUserFavorites, fetchUserFestivalFavorites } from '@/lib/favorites';
import {
    loadPreferredLanguageForCurrentUser,
    mapLabelToPreferredLanguage,
    mapPreferredLanguageToLabel,
    PREFERRED_LANGUAGE_CHANGED_EVENT,
    savePreferredLanguageForCurrentUser,
} from '@/lib/preferredLanguage';
import { fetchCurrentUserAndProfile, getProfileDisplayName, STREAK_UPDATED_EVENT } from '@/lib/profile';
import { supabase } from '@/lib/supabase';
import { fetchAllFestivals, Festival, getFestivalSymbol } from '@/lib/festivals';
import { BADGE_DEFINITIONS, fetchUserBadges, checkAndAwardBadges, UserStats } from '@/lib/badges';
import { fetchUserNotes, NOTES_UPDATED_EVENT, type UserNote } from '@/lib/notes';
import { fetchAllGitaVerses } from '@/lib/verses';
import LotusLoader from '@/components/ui/LotusLoader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    useFocusEffect,
} from '@react-navigation/native';
import {
    Calendar,
    ChevronDown,
    Flower2,
    Globe,
    Heart,
    LogOut,
    Sparkles,
    Star,
    Target,
    Trash2,
    Trophy,
    Flame,
    User,
    X,

    Settings,
    QrCode,
    Lock,
    Bookmark,
    Medal,
    Compass,
    StickyNote,
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TouchableOpacity, 
    Alert,
    DeviceEventEmitter,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
    Dimensions,
 } from 'react-native';

import { MOCK_VERSES, Verse } from '@/Data/mockverses';
import FestivalModal from '@/components/gita/FestivalModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// For searching/filtering favorites, we consolidate all known verses
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

const BADGE_ICONS: Record<string, any> = {
  Sparkles,
  Flame,
  Trophy,
  Medal,
  Compass,
  Heart,
  Calendar,
};

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
};

const ONBOARDING_COMPLETE_KEY = 'gitaDaily.onboardingComplete.v1';
const ONBOARDING_PROFILE_KEY = 'gitaDaily.onboardingProfile.v1';
const ONBOARDING_REPLAY_EVENT = 'gitaDaily.replayOnboarding';

export default function ProfileScreen() {
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
  const favoritesSectionRef = useRef<View>(null);
  const quoteBoxYRef = useRef(0);
  const favoritesYRef = useRef(0);
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

      // Map supabase gita_verses for favorites lookup
      const mapped: Verse[] = gitaVerses.map(v => ({
        id: v.id,
        chapter: v.chapter_number,
        verse: v.verse_number,
        english: v.english,
        hindi: v.hindi || '',
        speaker: v.speaker || undefined,
      }));
      setSupabaseVerses(mapped);

      // Award logic
      const stats: UserStats = {
        streakCount: currentProfile?.streak_count ?? 0,
        levelCount: currentProfile?.current_lotus_level ?? 1,
        favQuotesCount: favIds.length,
        favFestivalsCount: favFestIds.length,
        lessonsDoneCount: Math.max(0, (currentProfile?.current_lotus_level ?? 1) - 1),
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
    return () => subs.forEach(s => s.remove());
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refreshProfileIdentity();
      return () => {};
    }, [])
  );

  const COMBINED_VERSES = useMemo(() => {
    const supaIds = new Set(supabaseVerses.map(v => v.id));
    const filtered = ALL_VERSES.filter(v => !supaIds.has(v.id));
    return [...supabaseVerses, ...filtered];
  }, [supabaseVerses]);

  const favoriteVerses = useMemo(() => {
    return COMBINED_VERSES.filter(v => favoriteVerseIds.includes(v.id));
  }, [favoriteVerseIds, COMBINED_VERSES]);

  const favoriteFestivals = useMemo(() => {
    return allFestivals.filter(f => favoriteFestivalIds.includes(f.id));
  }, [allFestivals, favoriteFestivalIds]);

  const handleFavSelect = (verse: Verse) => {
    setSelectedFavVerse(verse);
    setTimeout(() => {
      pageScrollRef.current?.scrollTo({
        y: Math.max(quoteBoxYRef.current - 16, 0),
        animated: true,
      });
    }, 120);
  };



  const scrollToSaved = () => {
    pageScrollRef.current?.scrollTo({
      y: favoritesYRef.current - 20,
      animated: true,
    });
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

  const handleBadgePress = (badge: any, isEarned: boolean) => {
    Alert.alert(
      isEarned ? `Unlocked: ${badge.title}` : `Locked: ${badge.title}`,
      `${badge.description}\n\n${isEarned ? 'You have earned this badge! ✨' : 'Keep going to unlock this achievement!'}`
    );
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
      <BackgroundLayout>
        <View style={styles.loadingFull}>
          <LotusLoader size={110} color="#fbbf24" strokeWidth={2.8} />
          <Text style={styles.loadingText}>Loading your journey...</Text>
        </View>
      </BackgroundLayout>
    );
  }

  return (
    <BackgroundLayout>
      <ScrollView
        ref={pageScrollRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* ── New Header Redesign ── */}
          <View style={styles.topHeader}>
            <View style={styles.userInfoRow}>
              <View style={styles.nameSection}>
                <Text style={styles.userNameText}>{profile.full_name || 'Your Name'}</Text>
                <Text style={styles.userEmailText}>{profile.email || 'guest@gita.daily'}</Text>
              </View>
              
              <View style={styles.avatarContainer}>
                <View style={styles.avatarOutline}>
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitial}>
                      {(profile.full_name || 'U').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* ── Quick Actions ── */}
          <View style={styles.quickActions}>
            <TouchableOpacity activeOpacity={0.7} style={styles.qaCard} onPress={scrollToSaved}>
              <Bookmark size={20} color="#fbbf24" />
              <Text style={styles.qaText}>Saved</Text>
            </TouchableOpacity>
          </View>

          {/* ── Streak Bar ── */}
          <View style={styles.streakBar}>
            <View style={styles.streakCol}>
              <Text style={styles.streakBigValue}>{profile.streak_count}</Text>
              <Text style={styles.streakTinyLabel}>App Streak</Text>
            </View>
            <Trophy size={18} color="#fbbf24" style={{ opacity: 0.8 }} />
          </View>

          {/* ── Badges Section ── */}
          <View style={styles.badgesSection}>
            <View style={styles.badgesHeader}>
              <Text style={styles.badgesTitle}>{earnedBadgeIds.length} Badges Unlocked</Text>
              <Target size={18} color="#fbbf24" style={{ opacity: 0.8 }} />
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.badgesList}
            >
              {BADGE_DEFINITIONS.map((badge) => {
                const isEarned = earnedBadgeIds.includes(badge.id);
                const BadgeIcon = BADGE_ICONS[badge.icon] || Star;
                return (
                  <View key={badge.id} style={styles.badgeWrapper}>
                    <TouchableOpacity activeOpacity={0.7} 
                      style={[styles.badgeCircle, !isEarned && styles.badgeLocked]}
                      onPress={() => handleBadgePress(badge, isEarned)}
                    >
                      <BadgeIcon 
                        size={28} 
                        color={isEarned ? "#fbbf24" : "rgba(251, 191, 36, 0.2)"} 
                        strokeWidth={1.5}
                      />
                      {!isEarned && (
                        <View style={styles.lockOverlay}>
                          <Lock size={12} color="white" opacity={0.6} />
                        </View>
                      )}
                    </TouchableOpacity>
                    <Text style={[styles.badgeName, !isEarned && { opacity: 0.4 }]}>
                      {badge.title}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>

          {/* ── Your Journey ── */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.headerIconBg}>
                <Trophy size={18} color="#fbbf24" />
              </View>
              <Text style={styles.sectionTitle}>Your Journey</Text>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statsCard}>
                <Sparkles size={20} color="#fbbf24" style={styles.statsIcon} />
                <Text style={styles.statsValue}>{profile.streak_count} Day Streak</Text>
                <Text style={styles.statsLabel}>Daily Sadhana</Text>
              </View>
              <View style={styles.statsCard}>
                <Flower2 size={20} color="#4ade80" style={styles.statsIcon} />
                <Text style={styles.statsValue}>Level {profile.current_lotus_level || 1}</Text>
                <Text style={styles.statsLabel}>Lotus Path</Text>
              </View>
              <View style={styles.statsCard}>
                <Heart size={20} color="#FE2C55" fill="#FE2C55" style={styles.statsIcon} />
                <Text style={styles.statsValue}>{favoriteVerseIds.length} Quotes</Text>
                <Text style={styles.statsLabel}>Treasured</Text>
              </View>
              <View style={styles.statsCard}>
                <Star size={20} color="#60a5fa" style={styles.statsIcon} fill="#60a5fa" />
                <Text style={styles.statsValue}>{favoriteFestivalIds.length} Festivals</Text>
                <Text style={styles.statsLabel}>Saved</Text>
              </View>
            </View>
          </View>

          {/* ── Favorite Quotes Section ── */}
          <View 
            style={styles.sectionCard}
            onLayout={(e) => {
              favoritesYRef.current = e.nativeEvent.layout.y;
            }}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.headerIconBg}>
                <Heart size={18} color="#FE2C55" fill="#FE2C55" />
              </View>
              <Text style={styles.sectionTitle}>Favorite Quotes</Text>
            </View>
            {favoriteVerses.length === 0 ? (
              <View style={styles.noFavWrap}>
                <Heart size={40} color="rgba(251,191,36,0.15)" />
                <Text style={styles.noFavText}>No favorites yet</Text>
              </View>
            ) : (
              <ScrollView
                style={styles.favScroll}
                contentContainerStyle={styles.favScrollContent}
                showsVerticalScrollIndicator
                nestedScrollEnabled
              >
                {favoriteVerses.map((verse) => {
                  const isSelected = selectedFavVerse?.id === verse.id;
                  return (
                    <TouchableOpacity activeOpacity={0.7}
                      key={verse.id}
                      onPress={() => handleFavSelect(verse)}
                      style={[
                        styles.favItem,
                        isSelected && styles.favItemSelected,
                      ]}
                    >
                      <View style={styles.favItemHeader}>
                        <Text style={styles.favRef}>Chapter {verse.chapter}, Verse {verse.verse}</Text>
                        <Heart size={12} color="#FE2C55" fill="#FE2C55" />
                      </View>
                      <Text style={styles.favText} numberOfLines={2}>&quot;{verse.english}&quot;</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>

          {/* ── Favorite Festivals ── */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.headerIconBg}>
                <Star size={18} color="#60a5fa" fill="#60a5fa" />
              </View>
              <Text style={styles.sectionTitle}>Favorite Festivals</Text>
            </View>
            {favoriteFestivals.length === 0 ? (
              <View style={styles.noFavWrap}>
                <Star size={40} color="rgba(96,165,250,0.15)" />
                <Text style={styles.noFavText}>No saved festivals</Text>
              </View>
            ) : (
              <ScrollView
                style={styles.favScroll}
                contentContainerStyle={styles.favScrollContent}
                showsVerticalScrollIndicator
                nestedScrollEnabled
              >
                {favoriteFestivals.map((fest) => (
                  <TouchableOpacity activeOpacity={0.7}
                    key={fest.id}
                    onPress={() => setSelectedFestival(fest)}
                    style={styles.favItem}
                  >
                    <View style={styles.favItemHeader}>
                      <Text style={[styles.favRef, { color: '#60a5fa' }]}>
                        {getFestivalSymbol(fest.name, fest.icon_emoji)} {fest.name.toUpperCase()}
                      </Text>
                      <Star size={12} color="#60a5fa" fill="#60a5fa" />
                    </View>
                    <Text style={styles.favText} numberOfLines={1}>{fest.display_date} • {fest.deity}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* ── Notes Section ── */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.headerIconBg}>
                <StickyNote size={18} color="#fbbf24" />
              </View>
              <Text style={styles.sectionTitle}>Your Notes</Text>
            </View>
            {userNotes.length === 0 ? (
              <View style={styles.noFavWrap}>
                <StickyNote size={40} color="rgba(251,191,36,0.15)" />
                <Text style={styles.noFavText}>No notes yet</Text>
                <Text style={styles.noFavSubtext}>Tap "Note" on any verse in the Read section to add one</Text>
              </View>
            ) : (
              <ScrollView
                style={styles.favScroll}
                contentContainerStyle={styles.favScrollContent}
                showsVerticalScrollIndicator
                nestedScrollEnabled
              >
                {userNotes.map((note) => {
                  const verseData = note.verse;
                  const verseRef = verseData
                    ? `${verseData.chapter_number}.${verseData.verse_number}`
                    : '—';
                  const dateStr = new Date(note.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });
                  return (
                    <View key={note.id} style={styles.noteItem}>
                      <View style={styles.noteItemHeader}>
                        <Text style={styles.noteVerseRef}>Verse {verseRef}</Text>
                        <Text style={styles.noteDate}>{dateStr}</Text>
                      </View>
                      {verseData && (
                        <Text style={styles.noteVersePreview} numberOfLines={1}>
                          &quot;{verseData.english}&quot;
                        </Text>
                      )}
                      <Text style={styles.noteText} numberOfLines={3}>
                        {note.note_text}
                      </Text>
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>

          {/* ── Language ── */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.headerIconBg}>
                <Globe size={18} color="#fbbf24" />
              </View>
              <Text style={styles.sectionTitle}>Language</Text>
            </View>
            <TouchableOpacity activeOpacity={0.7} style={styles.langTrigger} onPress={() => setIsLangOpen(!isLangOpen)}>
              <Text style={styles.langTriggerText}>{selectedLanguage}</Text>
              <ChevronDown size={20} color="rgba(251,191,36,0.3)" />
            </TouchableOpacity>
            {isLangOpen && (
              <View style={styles.langMenu}>
                {['English', 'Hindi'].map((lang) => (
                  <TouchableOpacity activeOpacity={0.7} 
                    key={lang} 
                    style={styles.langMenuItem}
                    onPress={() => {
                      setSelectedLanguage(lang);
                      setIsLangOpen(false);
                      const code = mapLabelToPreferredLanguage(lang);
                      if (code) {
                        void savePreferredLanguageForCurrentUser(code);
                        DeviceEventEmitter.emit(PREFERRED_LANGUAGE_CHANGED_EVENT, code);
                      }
                    }}
                  >
                    <Text style={styles.langMenuItemText}>{lang}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* ── Actions ── */}
          <View style={styles.actionsRow}>
            <TouchableOpacity activeOpacity={0.7} style={styles.actionBtn} onPress={handleSignOut}>
              <LogOut size={16} color="rgba(251,191,36,0.5)" />
              <Text style={styles.actionBtnText}>Sign Out</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7} style={styles.actionBtnDanger} onPress={() => Alert.alert('Delete', 'Integrating soon.')}>
              <Trash2 size={16} color="rgba(239,68,68,0.5)" />
              <Text style={styles.actionBtnDangerText}>Delete Account</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity activeOpacity={0.7} style={styles.replayBtn} onPress={replayOnboarding}>
            <Text style={styles.replayBtnText}>Replay Onboarding</Text>
          </TouchableOpacity>

          {/* ── Verse Preview ── */}
          {selectedFavVerse && (
            <View style={styles.quoteBox} onLayout={(e) => { quoteBoxYRef.current = e.nativeEvent.layout.y; }}>
              <View style={styles.quoteBoxHeader}>
                <Text style={styles.previewTitle}>REVISITING WISDOM</Text>
                <TouchableOpacity activeOpacity={0.7} onPress={() => setSelectedFavVerse(null)}><X color="#fbbf24" size={24} /></TouchableOpacity>
              </View>
              <QuoteCard 
                verse={selectedFavVerse} 
                user={{ id: profile.id, full_name: profile.full_name || '', email: profile.email || '' }}
                preferences={{ preferred_language: profile.preferred_language || 'english', favorite_verses: favoriteVerseIds }}
                onFavoriteToggle={() => {}}
                isToday={false}
              />
            </View>
          )}

          <FestivalModal festival={selectedFestival} onClose={() => setSelectedFestival(null)} />
        </View>
      </ScrollView>
    </BackgroundLayout>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 120,
  },
  container: {
    paddingBottom: 40,
    paddingHorizontal: 16,
  },
  topHeader: {
    marginTop: 10,
    marginBottom: 20,
    paddingHorizontal: 16, // Added to keep info aligned without a box
  },
  headerControls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 20,
    marginBottom: 24,
  },
  controlIcon: {
    opacity: 0.9,
  },
  hamburger: {
    gap: 5,
  },
  hamLine: {
    height: 2.5,
    backgroundColor: 'white',
    borderRadius: 2,
  },
  userInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nameSection: {
    flex: 1,
  },
  userNameText: {
    color: 'white',
    fontSize: 34,
    fontWeight: '700',
    fontFamily: Fonts.serif,
  },
  userEmailText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 15,
    marginTop: 4,
    fontFamily: Fonts.sans,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarOutline: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.2)',
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 32,
    fontWeight: '600',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: -4,
    backgroundColor: '#0f172a',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(251,191,36,0.3)',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  qaCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  qaText: {
    color: '#fbbf24',
    fontSize: 14,
    fontWeight: '600',
  },
  streakBar: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  streakCol: {
    gap: 2,
  },
  streakBigValue: {
    color: '#fbbf24',
    fontSize: 22,
    fontWeight: '700',
    fontFamily: Fonts.serif,
  },
  streakTinyLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
  badgesSection: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  badgesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  badgesTitle: {
    color: '#fbbf24',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Fonts.serif,
  },
  badgesList: {
    gap: 20,
    paddingRight: 10,
  },
  badgeWrapper: {
    alignItems: 'center',
    width: 70,
  },
  badgeCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
    borderWidth: 1.5,
    borderColor: 'rgba(251,191,36,0.1)',
  },
  badgeLocked: {
    backgroundColor: 'rgba(255,255,255,0.01)',
    borderColor: 'rgba(251,191,36,0.05)',
  },
  badgeIcon: {
    fontSize: 28,
  },
  badgeName: {
    color: 'white',
    fontSize: 10,
    textAlign: 'center',
    fontWeight: '500',
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  headerIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    color: '#fbbf24',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Fonts.serif,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statsCard: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.05)',
  },
  statsIcon: {
    marginBottom: 8,
  },
  statsValue: {
    color: '#fef3c7',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Fonts.serif,
    textAlign: 'center',
    marginBottom: 3,
  },
  statsLabel: {
    color: 'rgba(254,243,199,0.3)',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  langTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.1)',
  },
  langTriggerText: {
    color: '#fef3c7',
    fontSize: 16,
  },
  langMenu: {
    backgroundColor: '#0a101e',
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.2)',
    overflow: 'hidden',
  },
  langMenuItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(251,191,36,0.05)',
  },
  langMenuItemText: {
    color: '#fef3c7',
    fontSize: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    paddingHorizontal: 0,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(251,191,36,0.05)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.1)',
  },
  actionBtnText: {
    color: 'rgba(251,191,36,0.6)',
    fontSize: 14,
    fontWeight: '600',
  },
  actionBtnDanger: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(239,68,68,0.05)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.1)',
  },
  actionBtnDangerText: {
    color: 'rgba(239,68,68,0.6)',
    fontSize: 14,
    fontWeight: '600',
  },
  replayBtn: {
    alignItems: 'center',
    padding: 12,
  },
  replayBtnText: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  noFavWrap: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  noFavText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
  },
  favScroll: {
    maxHeight: 250,
  },
  favScrollContent: {
    gap: 10,
  },
  favItem: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.05)',
  },
  favItemSelected: {
    borderColor: 'rgba(251,191,36,0.2)',
  },
  favItemPressed: {
    opacity: 0.7,
  },
  favItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  favRef: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Fonts.serif,
  },
  favText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  quoteBox: {
    marginTop: 20,
  },
  quoteBoxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  previewTitle: {
    color: '#fbbf24',
    fontSize: 10,
    opacity: 0.5,
    letterSpacing: 1,
  },
  loadingFull: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    minHeight: 400,
  },
  loadingText: {
    color: 'rgba(251,191,36,0.6)',
    fontFamily: Fonts.serif,
    fontSize: 16,
  },
  noFavSubtext: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 18,
  },
  noteItem: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.05)',
    gap: 6,
  },
  noteItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noteVerseRef: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Fonts.serif,
  },
  noteDate: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
  },
  noteVersePreview: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontStyle: 'italic',
    fontFamily: Fonts.serif,
  },
  noteText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    lineHeight: 20,
  },
});
