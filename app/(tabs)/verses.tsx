import BackgroundLayout from '@/components/BackgroundLayout';
import MoodSearch from '@/components/gita/MoodSearch';
import QuoteCard from '@/components/gita/QuoteCard';
import LotusLoader from '@/components/ui/LotusLoader';
import { Fonts } from '@/constants/theme';
import { MOCK_VERSES, Verse } from '@/Data/mockverses';
import { fetchAllGitaVerses, stripHindiVerseRef } from '@/lib/verses';
import { BookOpen, ChevronDown, Filter, Search } from 'lucide-react-native';
import { FAVORITES_UPDATED_EVENT, fetchUserFavorites } from '@/lib/favorites';
import { fetchCurrentUserAndProfile } from '@/lib/profile';
import { loadPreferredLanguageForCurrentUser, PREFERRED_LANGUAGE_CHANGED_EVENT } from '@/lib/preferredLanguage';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/theme/colors';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TouchableOpacity, DeviceEventEmitter, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

type ChapterFilter = 'all' | number;

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

const LOCAL_VERSES: Verse[] = [...MOCK_VERSES, ...PLACEHOLDER_VERSES];

export default function VersesScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [search, setSearch] = useState('');
  const [selectedChapter, setSelectedChapter] = useState<ChapterFilter>('all');
  const [isChapterOpen, setIsChapterOpen] = useState(false);
  const [selectedVerse, setSelectedVerse] = useState<Verse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [user, setUser] = useState<{ id: string; full_name: string | null; email: string | null } | null>(null);
  const [favoriteVerseIds, setFavoriteVerseIds] = useState<string[]>([]);
  const [supabaseVerses, setSupabaseVerses] = useState<Verse[]>([]);
  const [preferredLanguage, setPreferredLanguage] = useState<'english' | 'hindi'>('english');
  const pageScrollRef = useRef<ScrollView>(null);
  const selectedVerseBoxYRef = useRef(0);

  const refreshUserContext = useCallback(async () => {
    try {
      const { user, profile } = await fetchCurrentUserAndProfile();
      if (user) {
        setUser({ id: user.id, full_name: profile?.full_name ?? user.auth_name, email: user.email });
        const favs = await fetchUserFavorites(user.id);
        setFavoriteVerseIds(favs);
      }
    } catch (error) {
      console.error('Error refreshing user context in verses.tsx:', error);
    }
  }, []);

  useEffect(() => {
    const loadAll = async () => {
      refreshUserContext();
      try {
        const [gitaVerses, lang] = await Promise.all([
          fetchAllGitaVerses(),
          loadPreferredLanguageForCurrentUser(),
        ]);
        setPreferredLanguage(lang as 'english' | 'hindi');
        const mapped: Verse[] = gitaVerses.map(v => ({
          id: v.id,
          chapter: v.chapter_number,
          verse: v.verse_number,
          english: v.english,
          hindi: v.hindi || '',
          speaker: v.speaker || undefined,
        }));
        setSupabaseVerses(mapped);
      } catch (err) {
        console.error('Error fetching gita verses:', err);
      }
      setIsLoading(false);
    };
    loadAll();
  }, [refreshUserContext]);

  useFocusEffect(
    useCallback(() => {
      refreshUserContext();
      return () => {};
    }, [refreshUserContext])
  );

  useEffect(() => {
    const favSub = DeviceEventEmitter.addListener(
      FAVORITES_UPDATED_EVENT,
      (data: { verseId: string; liked: boolean }) => {
        setFavoriteVerseIds((prev) => {
          if (data.liked) return prev.includes(data.verseId) ? prev : [...prev, data.verseId];
          return prev.filter((id) => id !== data.verseId);
        });
      }
    );
    const langSub = DeviceEventEmitter.addListener(
      PREFERRED_LANGUAGE_CHANGED_EVENT,
      (newLang: string) => { setPreferredLanguage(newLang as 'english' | 'hindi'); }
    );
    return () => { favSub.remove(); langSub.remove(); };
  }, []);

  const ALL_VERSES = useMemo(() => {
    const supaIds = new Set(supabaseVerses.map(v => v.id));
    const filtered = LOCAL_VERSES.filter(v => !supaIds.has(v.id));
    return [...supabaseVerses, ...filtered];
  }, [supabaseVerses]);

  const chapters = useMemo(
    () => [...new Set(ALL_VERSES.map((verse) => verse.chapter))].sort((a, b) => a - b),
    [ALL_VERSES]
  );

  const filteredVerses = useMemo(() => {
    const query = search.trim().toLowerCase();
    return ALL_VERSES.filter((verse) => {
      const matchesChapter = selectedChapter === 'all' || verse.chapter === selectedChapter;
      const verseRef = `${verse.chapter}.${verse.verse}`;
      const matchesSearch =
        query.length === 0 ||
        verseRef.includes(query) ||
        verse.english.toLowerCase().includes(query) ||
        verse.speaker?.toLowerCase().includes(query);
      return matchesChapter && matchesSearch;
    });
  }, [search, selectedChapter, ALL_VERSES]);

  const selectChapter = (chapter: ChapterFilter) => {
    setSelectedChapter(chapter);
    setIsChapterOpen(false);
  };

  const handleVerseSelect = (verse: Verse) => {
    if (verse.english) {
      setSelectedVerse(verse);
      setTimeout(() => {
        pageScrollRef.current?.scrollTo({
          y: Math.max(selectedVerseBoxYRef.current - 16, 0),
          animated: true,
        });
      }, 120);
    }
  };

  return (
    <BackgroundLayout>
      <ScrollView
        ref={pageScrollRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <View style={styles.filtersSection}>
            <View style={[styles.searchInputWrap, isSearchFocused && styles.searchInputWrapFocused]}>
              <Search size={16} color={theme.goldSubtle} />
              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Search verses or type 2.47..."
                placeholderTextColor={theme.goldSubtle}
                selectionColor={theme.primary}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
              />
            </View>

            <View style={styles.chapterWrap}>
              <TouchableOpacity activeOpacity={0.7} style={styles.chapterTrigger} onPress={() => setIsChapterOpen((prev) => !prev)}>
                <Filter size={16} color={theme.goldSubtle} />
                <Text style={styles.chapterTriggerText}>
                  {selectedChapter === 'all' ? 'All Chapters' : `Chapter ${selectedChapter}`}
                </Text>
                <ChevronDown size={20} color={theme.goldSubtle} />
              </TouchableOpacity>

              {isChapterOpen && (
                <View style={styles.chapterMenu}>
                  <TouchableOpacity activeOpacity={0.7} style={styles.chapterMenuItem} onPress={() => selectChapter('all')}>
                    <Text style={styles.chapterMenuItemText}>All Chapters</Text>
                  </TouchableOpacity>
                  {chapters.map((chapter) => (
                    <TouchableOpacity activeOpacity={0.7}
                      key={chapter}
                      style={styles.chapterMenuItem}
                      onPress={() => selectChapter(chapter)}>
                      <Text style={styles.chapterMenuItemText}>Chapter {chapter}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          <View style={styles.versesSection}>
            {isLoading ? (
              <View style={styles.loadingWrap}>
                <LotusLoader size={110} color="#D4AF37" strokeWidth={2.8} duration={1200} />
                <Text style={styles.loadingText}>Loading verses...</Text>
              </View>
            ) : filteredVerses.length === 0 ? (
              <View style={styles.emptyWrap}>
                <BookOpen size={48} color={theme.goldSubtle} />
                <Text style={styles.emptyText}>No verses found</Text>
              </View>
            ) : (
              <View style={styles.listCard}>
                <ScrollView
                  style={styles.listScroll}
                  contentContainerStyle={styles.listScrollContent}
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled>
                  {filteredVerses.map((verse) => {
                    const isSelected = selectedVerse?.id === verse.id;
                    return (
                      <TouchableOpacity activeOpacity={0.7}
                        key={verse.id}
                        onPress={() => handleVerseSelect(verse)}
                        style={[styles.verseItem, isSelected && styles.verseItemSelected]}>
                        <View style={styles.verseRefCircle}>
                          <Text style={styles.verseRefText}>{verse.chapter}.{verse.verse}</Text>
                        </View>
                        <View style={styles.verseContent}>
                          <Text style={styles.verseEnglish}>
                            &quot;{preferredLanguage === 'hindi' ? (stripHindiVerseRef(verse.hindi) || verse.english) : verse.english}&quot;
                          </Text>
                          {verse.speaker ? <Text style={styles.verseSpeaker}>— {verse.speaker}</Text> : null}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>

          <Text style={styles.footerCount}>{filteredVerses.length} verses found</Text>

          <MoodSearch verses={ALL_VERSES} onVerseSelect={handleVerseSelect} />

          <View
            style={styles.selectedVerseBox}
            onLayout={(event) => { selectedVerseBoxYRef.current = event.nativeEvent.layout.y; }}>
            {selectedVerse ? (
              <QuoteCard
                verse={selectedVerse}
                user={user}
                preferences={{ favorite_verses: favoriteVerseIds, preferred_language: preferredLanguage }}
                onFavoriteToggle={(verseId, isLiked) => {
                  setFavoriteVerseIds(prev => {
                    if (isLiked) return prev.includes(verseId) ? prev : [...prev, verseId];
                    return prev.filter(id => id !== verseId);
                  });
                }}
                isToday={false}
              />
            ) : (
              <View style={styles.selectedVerseEmpty}>
                <View style={styles.selectedVerseIconCircle}>
                  <BookOpen size={32} color={theme.goldSubtle} />
                </View>
                <Text style={styles.selectedVerseTitle}>Select a Verse</Text>
                <Text style={styles.selectedVerseDescription}>
                  Click on any verse from the list to view it in detail with translations and audio
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </BackgroundLayout>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 120,
  },
  container: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    gap: 14,
  },
  selectedVerseBox: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 22,
  },
  selectedVerseEmpty: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  selectedVerseIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(51,65,85,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  selectedVerseTitle: {
    color: theme.textWarm,
    fontSize: 18,
    fontWeight: '500',
    fontFamily: Fonts.serif,
    marginBottom: 10,
  },
  selectedVerseDescription: {
    color: theme.goldSubtle,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 460,
  },
  filtersSection: {
    gap: 10,
    marginTop: 6,
  },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
  },
  searchInputWrapFocused: {
    borderColor: 'rgba(251,191,36,0.5)',
  },
  searchInput: {
    flex: 1,
    color: theme.textWarm,
    fontSize: 16,
    paddingVertical: 0,
  },
  chapterWrap: {
    position: 'relative',
    zIndex: 5,
  },
  chapterTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  chapterTriggerText: {
    flex: 1,
    color: theme.textWarm,
    fontSize: 16,
    textAlign: 'center',
    marginRight: 14,
  },
  chapterMenu: {
    marginTop: 8,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.2)',
    borderRadius: 14,
    overflow: 'hidden',
  },
  chapterMenuItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(251,191,36,0.1)',
  },
  chapterMenuItemText: {
    color: theme.textWarm,
    fontSize: 15,
  },
  versesSection: {
    marginTop: 8,
  },
  listScroll: {
    maxHeight: 620,
  },
  listScrollContent: {
    gap: 12,
    paddingBottom: 8,
  },
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 44,
    gap: 12,
  },
  loadingText: {
    color: theme.goldText,
    fontSize: 16,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 44,
    gap: 14,
  },
  emptyText: {
    color: theme.goldText,
    fontSize: 16,
  },
  listCard: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 24,
    padding: 14,
    elevation: 8,
  },
  verseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    padding: 14,
  },
  verseItemSelected: {
    backgroundColor: 'rgba(251,191,36,0.2)',
    borderWidth: 2,
    borderColor: theme.primary,
  },
  verseRefCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(71,85,105,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verseRefText: {
    color: theme.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  verseContent: {
    flex: 1,
  },
  verseEnglish: {
    color: theme.textWarm,
    fontSize: 15,
    fontFamily: Fonts.serif,
    fontStyle: 'italic',
    lineHeight: 24,
  },
  verseSpeaker: {
    marginTop: 6,
    color: theme.goldText,
    fontSize: 12,
  },
  footerCount: {
    marginTop: 8,
    textAlign: 'center',
    color: theme.goldSubtle,
    fontSize: 14,
  },
});
