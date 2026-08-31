import OmCoinPill from '@/components/gita/OmCoinPill';
import LotusLoader from '@/components/ui/LotusLoader';
import { useTheme } from '@/hooks/useTheme';
import { BADGE_DEFINITIONS, BADGE_ICONS, refreshAndAwardUserBadges } from '@/lib/badges';
import {
    FAVORITES_UPDATED_EVENT,
    FESTIVALS_UPDATED_EVENT,
    fetchUserFavorites,
    fetchUserFestivalFavorites,
} from '@/lib/favorites';
import { NOTES_UPDATED_EVENT, fetchUserNotes } from '@/lib/notes';
import { PRAYER_VERSES_UPDATED_EVENT, fetchUserPrayerVerses } from '@/lib/prayerFavorites';
import {
    PREFERRED_LANGUAGE_CHANGED_EVENT,
    loadPreferredLanguageForCurrentUser,
    mapLabelToPreferredLanguage,
    mapPreferredLanguageToLabel,
    savePreferredLanguageForCurrentUser,
} from '@/lib/preferredLanguage';
import { STREAK_UPDATED_EVENT, deleteCurrentUserAccount, fetchCurrentUserAndProfile, getProfileDisplayName } from '@/lib/profile';
import { supabase } from '@/lib/supabase';
import type { Theme } from '@/theme/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import {
    BookOpen,
    Bookmark,
    Check,
    ChevronRight,
    Feather,
    Heart,
    LogOut,
    Medal,
    Settings,
    Star,
    Trash2,
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    DeviceEventEmitter,
    Linking,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

const ONBOARDING_COMPLETE_KEY = 'omDaily.onboardingComplete.v1';
const ONBOARDING_PROFILE_KEY = 'omDaily.onboardingProfile.v1';
const ONBOARDING_REPLAY_EVENT = 'omDaily.replayOnboarding';

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
  const [prayerVersesCount, setPrayerVersesCount] = useState(0);
  const [notesCount, setNotesCount] = useState(0);
  const [earnedBadgeIds, setEarnedBadgeIds] = useState<string[]>([]);

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

      const [favIds, favFestIds, finalBadgeIds, notes, prayerVerses] = await Promise.all([
        fetchUserFavorites(user.id),
        fetchUserFestivalFavorites(user.id),
        refreshAndAwardUserBadges(user.id),
        fetchUserNotes(user.id),
        fetchUserPrayerVerses(user.id),
      ]);

      setFavoriteVerseIds(favIds);
      setFavoriteFestivalIds(favFestIds);
      setPrayerVersesCount(prayerVerses.length);
      setNotesCount(notes.length);

      setEarnedBadgeIds(finalBadgeIds);

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
      DeviceEventEmitter.addListener(PRAYER_VERSES_UPDATED_EVENT, refreshProfileIdentity),
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

  const earnedBadges = useMemo(
    () => BADGE_DEFINITIONS.filter((b) => earnedBadgeIds.includes(b.id)),
    [earnedBadgeIds]
  );

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

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This permanently deletes your account, streak, saved verses, notes, badges, and Om Coins. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you sure?',
              'Your account and all data will be permanently deleted.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Permanently Delete',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await deleteCurrentUserAccount();
                      await AsyncStorage.removeItem(ONBOARDING_COMPLETE_KEY);
                      await AsyncStorage.removeItem(ONBOARDING_PROFILE_KEY);
                      DeviceEventEmitter.emit(ONBOARDING_REPLAY_EVENT);
                    } catch (error) {
                      const message =
                        error instanceof Error ? error.message : 'Please try again.';
                      Alert.alert('Could not delete account', message);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
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
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ── */}
          <View style={styles.header}>
            <View style={styles.headerTextWrap}>
              <Text style={styles.name} numberOfLines={1}>
                {profile.full_name || 'Your Name'}
              </Text>
              <Text style={styles.email} numberOfLines={1}>
                {profile.email || 'guest@gita.daily'}
              </Text>
            </View>
            <OmCoinPill />
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
                <View style={styles.cardTitleRow}>
                  <Medal size={17} color="#fbbf24" fill="rgba(251,191,36,0.18)" strokeWidth={1.8} />
                  <Text style={styles.sectionTitle}>Achievements</Text>
                </View>
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

          {/* ── Saved Library ── */}
          <View style={styles.section}>
            <TouchableOpacity
              activeOpacity={0.84}
              onPress={() => router.push('/saved')}
              style={styles.glass}
            >
              <BlurView intensity={20} tint={theme.blurTint} style={StyleSheet.absoluteFill} />
              <View style={styles.savedLibraryInner}>
                <View style={styles.savedLibraryHeader}>
                  <View style={styles.savedTitleWrap}>
                    <View style={styles.cardTitleRow}>
                      <Bookmark size={17} color="#fbbf24" fill="rgba(251,191,36,0.18)" strokeWidth={1.8} />
                      <Text style={styles.savedTitle}>Saved Library</Text>
                    </View>
                    <Text style={styles.savedSub}>
                      Verses, prayers, festivals, and reflections in one place.
                    </Text>
                  </View>
                  <ChevronRight size={20} color={theme.subtext} strokeWidth={1.8} />
                </View>

                <View style={styles.savedMetricsRow}>
                  <SavedMetric
                    icon={<Heart size={15} color="#f87171" fill="#f87171" strokeWidth={0} />}
                    value={favoriteVerseIds.length}
                    label="Verses"
                  />
                  <View style={styles.savedMetricDivider} />
                  <SavedMetric
                    icon={<BookOpen size={15} color="#c4b5fd" strokeWidth={2} />}
                    value={prayerVersesCount}
                    label="Prayers"
                  />
                  <View style={styles.savedMetricDivider} />
                  <SavedMetric
                    icon={<Star size={15} color="#93c5fd" fill="#93c5fd" strokeWidth={0} />}
                    value={favoriteFestivalIds.length}
                    label="Festivals"
                  />
                  <View style={styles.savedMetricDivider} />
                  <SavedMetric
                    icon={<Feather size={15} color={theme.goldText} strokeWidth={1.8} />}
                    value={notesCount}
                    label="Reflections"
                  />
                </View>
              </View>
            </TouchableOpacity>
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
              onPress={handleDeleteAccount}
              style={({ pressed }) => [styles.dangerBtn, pressed && styles.btnPressed]}
            >
              <Trash2 size={16} color="rgba(248,113,113,0.85)" strokeWidth={1.8} />
              <Text style={styles.dangerBtnText}>Delete Account</Text>
            </Pressable>
          </View>

          <View style={styles.footerLinks}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => Linking.openURL('https://omdailyprivacypolicy.notion.site')}
            >
              <Text style={styles.privacyButtonText}>Privacy Policy</Text>
            </TouchableOpacity>
            <Text style={styles.footerDot}>·</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => Linking.openURL('https://omdailysupport.notion.site/')}
            >
              <Text style={styles.privacyButtonText}>Support</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function SavedMetric({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={styles.savedMetric}>
      <View style={styles.savedMetricIcon}>{icon}</View>
      <Text style={styles.savedMetricValue}>{value}</Text>
      <Text style={styles.savedMetricLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.background },
  safe: { flex: 1 },
  scrollContent: { paddingBottom: 140, paddingHorizontal: 20 },

  header: { paddingTop: 16, paddingBottom: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  headerTextWrap: { flex: 1, minWidth: 0 },
  eyebrow: { color: theme.subtext, fontSize: 11, fontWeight: '600', letterSpacing: 1.6, textTransform: 'uppercase', marginBottom: 10 },
  name: { color: theme.text, fontSize: 32, fontWeight: '700', fontFamily: 'Georgia', letterSpacing: -0.5, lineHeight: 38 },
  email: { color: theme.subtext, fontSize: 14, fontWeight: '400', marginTop: 4 },

  glass: { borderRadius: 20, overflow: 'hidden', backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, marginBottom: 20 },

  achHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingTop: 18, paddingBottom: 14 },
  sectionTitle: { color: theme.text, fontSize: 16, fontWeight: '700', letterSpacing: 0 },
  achSub: { color: theme.subtext, fontSize: 12, fontWeight: '500', lineHeight: 18, marginTop: 3 },
  achSubStrong: { color: '#fbbf24', fontWeight: '700' },
  achEmpty: { color: theme.subtextMuted, fontSize: 13, paddingHorizontal: 18, paddingBottom: 18, fontStyle: 'italic' },
  achList: { paddingHorizontal: 18, paddingBottom: 18, gap: 14 },
  achPill: { alignItems: 'center', width: 68, gap: 8 },
  achIconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(251,191,36,0.08)', borderWidth: 1, borderColor: 'rgba(251,191,36,0.18)', alignItems: 'center', justifyContent: 'center' },
  achPillTitle: { color: theme.subtext, fontSize: 11, fontWeight: '600', textAlign: 'center', letterSpacing: 0.1 },

  savedLibraryInner: { padding: 18, gap: 18 },
  savedLibraryHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  savedTitleWrap: { flex: 1, minWidth: 0 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  savedTitle: { color: theme.text, fontSize: 16, fontWeight: '700', letterSpacing: 0 },
  savedSub: { color: theme.subtext, fontSize: 12, fontWeight: '500', lineHeight: 18, marginTop: 3 },
  savedMetricsRow: { flexDirection: 'row', alignItems: 'stretch', borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 16 },
  savedMetric: { flex: 1, alignItems: 'center', gap: 5, minWidth: 0 },
  savedMetricIcon: { height: 18, alignItems: 'center', justifyContent: 'center' },
  savedMetricValue: { color: theme.text, fontSize: 21, fontWeight: '700', lineHeight: 25 },
  savedMetricLabel: { color: theme.subtextMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0, textAlign: 'center' },
  savedMetricDivider: { width: 1, backgroundColor: theme.border, marginHorizontal: 5 },

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
  settingRowPressed: { backgroundColor: theme.surface },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingLabel: { color: theme.text, fontSize: 15, fontWeight: '500' },
  settingValueRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  settingValue: { color: theme.subtext, fontSize: 14, fontWeight: '500' },
  langOptions: { paddingHorizontal: 8, paddingBottom: 6 },
  langOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, paddingVertical: 12, borderRadius: 10 },
  langOptionText: { color: theme.subtext, fontSize: 14, fontWeight: '500' },
  langOptionTextActive: { color: '#fbbf24', fontWeight: '600' },

  dangerRow: { flexDirection: 'row', gap: 12, marginTop: 8, marginBottom: 12 },
  outlineBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 14, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
  outlineBtnText: { color: theme.text, fontSize: 14, fontWeight: '600' },
  dangerBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 14, backgroundColor: 'rgba(248,113,113,0.06)', borderWidth: 1, borderColor: 'rgba(248,113,113,0.15)' },
  dangerBtnText: { color: 'rgba(248,113,113,0.95)', fontSize: 14, fontWeight: '600' },
  btnPressed: { opacity: 0.65 },

  footerLinks: { marginTop: 12, marginBottom: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  footerDot: { color: theme.subtextMuted, fontSize: 12, fontWeight: '500' },
  privacyButtonText: { color: theme.subtextMuted, fontSize: 12, fontWeight: '500', textDecorationLine: 'underline' },

  quoteBox: { marginTop: 24 },
  quoteBoxHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 4 },
  quoteBoxTitle: { color: theme.subtext, fontSize: 11, fontWeight: '600', letterSpacing: 1.6, textTransform: 'uppercase' },

  loadingFull: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, minHeight: 400 },
  loadingText: { color: theme.subtext, fontSize: 14, fontWeight: '500', letterSpacing: 0.4 },
});
