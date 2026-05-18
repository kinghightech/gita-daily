import QuoteCard from '@/components/gita/QuoteCard';
import LotusLoader from '@/components/ui/LotusLoader';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import {
  FAVORITES_UPDATED_EVENT,
  FESTIVALS_UPDATED_EVENT,
  fetchUserFavorites,
  fetchUserFestivalFavorites,
} from '@/lib/favorites';
import { fetchAllFestivals, getFestivalSymbol, type Festival } from '@/lib/festivals';
import { fetchUserNotes, NOTES_UPDATED_EVENT, type UserNote } from '@/lib/notes';
import { loadPreferredLanguageForCurrentUser } from '@/lib/preferredLanguage';
import { fetchCurrentUserAndProfile } from '@/lib/profile';
import { fetchAllGitaVerses, getVerseDisplayText } from '@/lib/verses';
import type { Theme } from '@/theme/colors';
import { useFocusEffect } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { Stack, useRouter } from 'expo-router';
import {
  ChevronLeft,
  ChevronRight,
  Feather,
  Heart,
  Bookmark,
  Sparkles,
  Star,
  X,
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DeviceEventEmitter,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const RED = '#f87171';
const BLUE = '#93c5fd';

type SavedTab = 'all' | 'verses' | 'festivals' | 'reflections';

type SavedVerse = {
  id: string;
  chapter: number;
  verse: number;
  english: string;
  hindi: string;
  speaker?: string;
};

type QuoteUser = {
  id: string;
  full_name: string | null;
  email: string | null;
};

const TAB_LABELS: { id: SavedTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'verses', label: 'Verses' },
  { id: 'festivals', label: 'Festivals' },
  { id: 'reflections', label: 'Reflections' },
];

export default function SavedScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<SavedTab>('all');
  const [loading, setLoading] = useState(true);
  const [favoriteVerseIds, setFavoriteVerseIds] = useState<string[]>([]);
  const [favoriteFestivalIds, setFavoriteFestivalIds] = useState<string[]>([]);
  const [allVerses, setAllVerses] = useState<SavedVerse[]>([]);
  const [allFestivals, setAllFestivals] = useState<Festival[]>([]);
  const [notes, setNotes] = useState<UserNote[]>([]);
  const [selectedVerse, setSelectedVerse] = useState<SavedVerse | null>(null);
  const [preferredLanguage, setPreferredLanguage] = useState<'english' | 'hindi'>('english');
  const [quoteUser, setQuoteUser] = useState<QuoteUser | null>(null);

  const loadSavedContent = useCallback(async () => {
    try {
      const { user, profile } = await fetchCurrentUserAndProfile();
      if (!user) {
        setFavoriteVerseIds([]);
        setFavoriteFestivalIds([]);
        setNotes([]);
        return;
      }

      const [favIds, favFestivalIds, verses, festivals, userNotes, language] = await Promise.all([
        fetchUserFavorites(user.id),
        fetchUserFestivalFavorites(user.id),
        fetchAllGitaVerses(),
        fetchAllFestivals(),
        fetchUserNotes(user.id),
        loadPreferredLanguageForCurrentUser(),
      ]);

      setQuoteUser({
        id: user.id,
        full_name:
          (typeof profile?.full_name === 'string' ? profile.full_name : '') ||
          user.auth_name ||
          null,
        email: user.email ?? null,
      });
      setFavoriteVerseIds(favIds);
      setFavoriteFestivalIds(favFestivalIds);
      setNotes(userNotes);
      setPreferredLanguage(language);
      setAllFestivals(festivals);
      setAllVerses(
        verses.map((verse) => ({
          id: verse.id,
          chapter: verse.chapter_number,
          verse: verse.verse_number,
          english: verse.english,
          hindi: verse.hindi || '',
          speaker: verse.speaker || undefined,
        }))
      );
    } catch (error) {
      console.error('Saved content load error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSavedContent();
  }, [loadSavedContent]);

  useEffect(() => {
    const subs = [
      DeviceEventEmitter.addListener(FAVORITES_UPDATED_EVENT, loadSavedContent),
      DeviceEventEmitter.addListener(FESTIVALS_UPDATED_EVENT, loadSavedContent),
      DeviceEventEmitter.addListener(NOTES_UPDATED_EVENT, loadSavedContent),
    ];

    return () => subs.forEach((sub) => sub.remove());
  }, [loadSavedContent]);

  useFocusEffect(
    useCallback(() => {
      void loadSavedContent();
      return () => {};
    }, [loadSavedContent])
  );

  const favoriteVerses = useMemo(
    () => allVerses.filter((verse) => favoriteVerseIds.includes(verse.id)),
    [allVerses, favoriteVerseIds]
  );

  const favoriteFestivals = useMemo(
    () => allFestivals.filter((festival) => favoriteFestivalIds.includes(festival.id)),
    [allFestivals, favoriteFestivalIds]
  );

  const counts: Record<SavedTab, number> = {
    all: favoriteVerses.length + favoriteFestivals.length + notes.length,
    verses: favoriteVerses.length,
    festivals: favoriteFestivals.length,
    reflections: notes.length,
  };

  const showVerses = activeTab === 'all' || activeTab === 'verses';
  const showFestivals = activeTab === 'all' || activeTab === 'festivals';
  const showReflections = activeTab === 'all' || activeTab === 'reflections';

  const openNoteVerse = (note: UserNote) => {
    if (!note.verse) return;

    setSelectedVerse({
      id: note.verse_id,
      chapter: note.verse.chapter_number,
      verse: note.verse.verse_number,
      english: note.verse.english,
      hindi: note.verse.hindi || '',
      speaker: note.verse.speaker || undefined,
    });
  };

  const renderEmptyState = () => {
    const label = TAB_LABELS.find((tab) => tab.id === activeTab)?.label ?? 'Saved';
    const emptyCopy =
      activeTab === 'all'
        ? 'Save verses, festivals, and reflections to build your library.'
        : `Nothing saved in ${label.toLowerCase()} yet.`;

    return (
      <View style={styles.emptyWrap}>
        <Sparkles size={34} color="rgba(251,191,36,0.22)" strokeWidth={1.5} />
        <Text style={styles.emptyText}>No saved items yet</Text>
        <Text style={styles.emptySub}>{emptyCopy}</Text>
      </View>
    );
  };

  const renderVerseCard = (verse: SavedVerse) => (
    <TouchableOpacity
      key={verse.id}
      activeOpacity={0.76}
      onPress={() => setSelectedVerse(verse)}
      style={styles.itemCard}
    >
      <BlurView intensity={20} tint={theme.blurTint} style={StyleSheet.absoluteFill} />
      <View style={styles.itemInner}>
        <View style={styles.itemHeader}>
          <View style={styles.itemTitleRow}>
            <Heart size={14} color={RED} fill={RED} strokeWidth={0} />
            <Text style={styles.verseRef}>
              Chapter {verse.chapter}, Verse {verse.verse}
            </Text>
          </View>
          {verse.speaker && <Text style={styles.itemMeta}>{verse.speaker}</Text>}
        </View>
        <Text style={styles.itemBody} numberOfLines={3}>
          &quot;{getVerseDisplayText(
            { english: verse.english, hindi: verse.hindi },
            preferredLanguage
          )}&quot;
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderFestivalCard = (festival: Festival) => (
    <TouchableOpacity
      key={festival.id}
      activeOpacity={0.76}
      onPress={() => router.push(`/festival-detail?id=${festival.id}`)}
      style={styles.itemCard}
    >
      <BlurView intensity={20} tint={theme.blurTint} style={StyleSheet.absoluteFill} />
      <View style={styles.itemInner}>
        <View style={styles.itemHeader}>
          <View style={styles.itemTitleRow}>
            <Text style={styles.festivalSymbol}>
              {getFestivalSymbol(festival.name, festival.icon_emoji)}
            </Text>
            <Text style={styles.festivalTitle} numberOfLines={1}>
              {festival.name}
            </Text>
          </View>
          <ChevronRight size={17} color={theme.subtextMuted} strokeWidth={1.8} />
        </View>
        <Text style={styles.itemBody} numberOfLines={2}>
          {festival.display_date}
          {festival.deity ? ` - ${festival.deity}` : ''}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderReflectionCard = (note: UserNote) => {
    const verseData = note.verse;
    const verseRef = verseData
      ? `Chapter ${verseData.chapter_number}, Verse ${verseData.verse_number}`
      : 'Reflection';
    const dateStr = new Date(note.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return (
      <TouchableOpacity
        key={note.id}
        activeOpacity={verseData ? 0.76 : 1}
        onPress={() => openNoteVerse(note)}
        style={styles.itemCard}
      >
        <BlurView intensity={20} tint={theme.blurTint} style={StyleSheet.absoluteFill} />
        <View style={styles.itemInner}>
          <View style={styles.itemHeader}>
            <View style={styles.itemTitleRow}>
              <Feather size={14} color={theme.goldText} strokeWidth={1.8} />
              <Text style={styles.verseRef}>{verseRef}</Text>
            </View>
            <Text style={styles.itemMeta}>{dateStr}</Text>
          </View>
          {verseData && (
            <Text style={styles.noteVersePreview} numberOfLines={1}>
              &quot;{getVerseDisplayText(
                { english: verseData.english, hindi: verseData.hindi },
                preferredLanguage
              )}&quot;
            </Text>
          )}
          <Text style={styles.itemBody} numberOfLines={4}>
            {note.note_text}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSection = (
    title: string,
    count: number,
    icon: React.ReactNode,
    children: React.ReactNode
  ) => {
    if (activeTab === 'all' && count === 0) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            {icon}
            <Text style={styles.sectionTitle}>{title}</Text>
          </View>
          <Text style={styles.sectionCount}>{count}</Text>
        </View>
        {count === 0 ? renderEmptyState() : children}
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
      <StatusBar
        barStyle={theme.blurTint === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />

      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ChevronLeft color={theme.text} size={25} strokeWidth={2.1} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Saved</Text>
            <Text style={styles.headerSub}>{counts.all} items in your library</Text>
          </View>
          <View style={styles.headerPill}>
            <Bookmark size={18} color={theme.primary} fill="rgba(251,191,36,0.18)" strokeWidth={1.8} />
          </View>
        </View>

        <View style={styles.tabsWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContent}
          >
            {TAB_LABELS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  activeOpacity={0.78}
                  onPress={() => setActiveTab(tab.id)}
                  style={[styles.tabChip, active && styles.tabChipActive]}
                >
                  <Text style={[styles.tabChipText, active && styles.tabChipTextActive]}>
                    {tab.label}
                  </Text>
                  <Text style={[styles.tabCount, active && styles.tabCountActive]}>
                    {counts[tab.id]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {loading ? (
          <View style={styles.loadingFull}>
            <LotusLoader size={96} color="#fbbf24" strokeWidth={2.8} />
            <Text style={styles.loadingText}>Loading saved wisdom...</Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 52 }]}
            showsVerticalScrollIndicator={false}
          >
            {counts[activeTab] === 0 ? (
              renderEmptyState()
            ) : (
              <>
                {showVerses &&
                  renderSection(
                    'Verses',
                    favoriteVerses.length,
                    <Heart size={15} color={RED} fill={RED} strokeWidth={0} />,
                    <View style={styles.list}>{favoriteVerses.map(renderVerseCard)}</View>
                  )}

                {showFestivals &&
                  renderSection(
                    'Festivals',
                    favoriteFestivals.length,
                    <Star size={15} color={BLUE} fill={BLUE} strokeWidth={0} />,
                    <View style={styles.list}>{favoriteFestivals.map(renderFestivalCard)}</View>
                  )}

                {showReflections &&
                  renderSection(
                    'Reflections',
                    notes.length,
                    <Feather size={15} color={theme.goldText} strokeWidth={1.8} />,
                    <View style={styles.list}>{notes.map(renderReflectionCard)}</View>
                  )}
              </>
            )}
          </ScrollView>
        )}
      </SafeAreaView>

      {selectedVerse && (
        <View style={styles.sheetOverlay} pointerEvents="box-none">
          <Pressable style={styles.sheetBackdrop} onPress={() => setSelectedVerse(null)} />
          <View style={styles.sheetCardWrap} pointerEvents="box-none">
            <View style={styles.sheetCardHeader}>
              <Text style={styles.sheetTitle}>Revisiting Wisdom</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setSelectedVerse(null)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X color={theme.subtext} size={22} strokeWidth={1.8} />
              </TouchableOpacity>
            </View>
            <QuoteCard
              verse={{
                id: selectedVerse.id,
                chapter: selectedVerse.chapter,
                verse: selectedVerse.verse,
                english: selectedVerse.english,
                hindi: selectedVerse.hindi,
                speaker: selectedVerse.speaker,
              }}
              user={quoteUser}
              preferences={{
                preferred_language: preferredLanguage,
                favorite_verses: favoriteVerseIds,
              }}
              onFavoriteToggle={(verseId, isLiked) => {
                setFavoriteVerseIds((current) =>
                  isLiked
                    ? Array.from(new Set([...current, verseId]))
                    : current.filter((id) => id !== verseId)
                );
                if (!isLiked) setSelectedVerse(null);
              }}
              isToday={false}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.background },
    safe: { flex: 1 },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 18,
      paddingTop: 8,
      paddingBottom: 16,
      gap: 14,
    },
    backButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerText: { flex: 1, minWidth: 0 },
    headerTitle: {
      color: theme.text,
      fontSize: 28,
      fontWeight: '800',
      letterSpacing: 0,
      lineHeight: 34,
    },
    headerSub: {
      color: theme.subtext,
      fontSize: 12,
      fontWeight: '600',
      marginTop: 2,
    },
    headerPill: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: 'rgba(251,191,36,0.08)',
      borderWidth: 1,
      borderColor: 'rgba(251,191,36,0.18)',
      alignItems: 'center',
      justifyContent: 'center',
    },

    tabsWrap: { paddingBottom: 18 },
    tabsContent: { paddingHorizontal: 18, gap: 10 },
    tabChip: {
      minHeight: 44,
      borderRadius: 22,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: 'rgba(251,191,36,0.08)',
      borderWidth: 1,
      borderColor: 'rgba(251,191,36,0.14)',
    },
    tabChipActive: {
      backgroundColor: 'rgba(251,191,36,0.2)',
      borderColor: 'rgba(251,191,36,0.45)',
    },
    tabChipText: {
      color: theme.text,
      fontSize: 14,
      fontWeight: '800',
      letterSpacing: 0,
    },
    tabChipTextActive: { color: theme.primary },
    tabCount: {
      color: theme.subtext,
      fontSize: 12,
      fontWeight: '800',
      fontVariant: ['tabular-nums'],
    },
    tabCountActive: { color: theme.primary },

    scrollContent: { paddingHorizontal: 18 },
    section: { marginBottom: 24 },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 2,
      marginBottom: 10,
    },
    sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    sectionTitle: {
      color: theme.text,
      fontSize: 15,
      fontWeight: '800',
      letterSpacing: 0,
    },
    sectionCount: {
      color: theme.subtextMuted,
      fontSize: 12,
      fontWeight: '800',
      fontVariant: ['tabular-nums'],
    },
    list: { gap: 12 },

    itemCard: {
      borderRadius: 18,
      overflow: 'hidden',
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    itemInner: { padding: 17 },
    itemHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      marginBottom: 9,
    },
    itemTitleRow: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 8 },
    verseRef: {
      color: theme.primary,
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 0,
    },
    festivalSymbol: { fontSize: 19, lineHeight: 22 },
    festivalTitle: {
      flex: 1,
      minWidth: 0,
      color: BLUE,
      fontSize: 14,
      fontWeight: '800',
      letterSpacing: 0,
    },
    itemMeta: {
      color: theme.subtextMuted,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    itemBody: {
      color: theme.text,
      fontSize: 14,
      lineHeight: 21,
      fontWeight: '400',
    },
    noteVersePreview: {
      color: theme.subtextMuted,
      fontSize: 12,
      lineHeight: 18,
      fontFamily: Fonts.serif,
      marginBottom: 7,
    },

    emptyWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 28,
      paddingVertical: 74,
      gap: 11,
    },
    emptyText: { color: theme.text, fontSize: 16, fontWeight: '800', letterSpacing: 0 },
    emptySub: {
      color: theme.subtext,
      fontSize: 13,
      lineHeight: 20,
      textAlign: 'center',
      maxWidth: 270,
    },

    loadingFull: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 16,
      minHeight: 360,
    },
    loadingText: { color: theme.subtext, fontSize: 14, fontWeight: '600' },

    sheetOverlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.42)',
    },
    sheetBackdrop: { ...StyleSheet.absoluteFillObject },
    sheetCardWrap: { paddingHorizontal: 16, paddingBottom: 16 },
    sheetCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
      paddingHorizontal: 6,
    },
    sheetTitle: {
      color: theme.subtext,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
    },
  });
