import { Fonts, GitaColors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { fetchGuideGlossary, type GuideSection } from '@/lib/guide';
import type { Theme } from '@/theme/colors';
import { router } from 'expo-router';
import { ChevronLeft, Map, Search, X } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CATEGORY_COLORS: Record<string, string> = {
  main_people:               '#F59E0B',
  places_setting:            '#10B981',
  spiritual_terms:           '#8B5CF6',
  three_gunas:               '#EC4899',
  types_of_yoga:             '#06B6D4',
  philosophical_concepts:    '#F97316',
  krishna_names_for_arjuna:  '#FBBF24',
  sanjaya_names:             '#A78BFA',
  chapter_themes:            '#34D399',
};

export default function GuideScreen() {
  const [sections, setSections] = useState<GuideSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<TextInput>(null);
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  useEffect(() => {
    fetchGuideGlossary().then(data => {
      setSections(data);
      setIsLoading(false);
    });
  }, []);

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;
    const q = searchQuery.toLowerCase();
    return sections
      .map(section => ({
        ...section,
        entries: section.entries.filter(
          e =>
            e.term.toLowerCase().includes(q) ||
            e.meaning.toLowerCase().includes(q)
        ),
      }))
      .filter(section => section.entries.length > 0);
  }, [sections, searchQuery]);

  const totalEntries = useMemo(
    () => sections.reduce((acc, s) => acc + s.entries.length, 0),
    [sections]
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
            <ChevronLeft size={26} color={GitaColors.gold} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Map size={20} color={GitaColors.gold} />
            <Text style={styles.headerTitle}>Gita Guide</Text>
          </View>
          <View style={styles.headerRight} />
        </View>

        {/* Subtitle + count */}
        <View style={styles.subtitleRow}>
          <Text style={styles.subtitle}>
            Your complete reference for the Bhagavad Gita
          </Text>
          {!isLoading && (
            <Text style={styles.entryCount}>{totalEntries} entries</Text>
          )}
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <Search size={18} color={theme.goldSubtle} />
          <TextInput
            ref={searchRef}
            style={styles.searchInput}
            placeholder="Search terms, concepts, names..."
            placeholderTextColor={theme.subtextMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            selectionColor={GitaColors.gold}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <X size={18} color={theme.subtext} />
            </Pressable>
          )}
        </View>

        {/* Body */}
        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={GitaColors.gold} size="large" />
            <Text style={styles.loadingText}>Loading guide...</Text>
          </View>
        ) : filteredSections.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Search size={40} color={theme.goldSubtle} />
            <Text style={styles.emptyText}>No results for "{searchQuery}"</Text>
            <Text style={styles.emptySubtext}>Try a different word or Sanskrit term</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {filteredSections.map(section => {
              const accent = CATEGORY_COLORS[section.category] ?? GitaColors.gold;
              return (
                <View key={section.category} style={styles.section}>
                  {/* Section label */}
                  <View style={[styles.sectionHeader, { borderLeftColor: accent }]}>
                    <Text style={[styles.sectionTitle, { color: accent }]}>
                      {section.label}
                    </Text>
                    <View
                      style={[
                        styles.sectionBadge,
                        { backgroundColor: accent + '22' },
                      ]}
                    >
                      <Text style={[styles.sectionBadgeText, { color: accent }]}>
                        {section.entries.length}
                      </Text>
                    </View>
                  </View>

                  {/* Entries */}
                  <View style={styles.entriesCard}>
                    {section.entries.map((entry, idx) => (
                      <View
                        key={idx}
                        style={[
                          styles.entryRow,
                          idx < section.entries.length - 1 &&
                            styles.entryRowBorder,
                        ]}
                      >
                        <Text style={[styles.entryTerm, { color: accent }]}>
                          {entry.term}
                        </Text>
                        <Text style={styles.entryMeaning}>
                          {entry.meaning}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Rooted in the Bhagavad Gita — the Song of God
              </Text>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    root: { flex: 1 },

    /* ── Header ── */
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerCenter: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    headerTitle: {
      color: theme.textWarm,
      fontSize: 20,
      fontWeight: '700',
      fontFamily: Fonts.serif,
    },
    headerRight: { width: 40 },

    /* ── Subtitle ── */
    subtitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingBottom: 14,
    },
    subtitle: {
      color: theme.subtext,
      fontSize: 13,
      fontFamily: Fonts.serif,
      fontStyle: 'italic',
      flex: 1,
    },
    entryCount: {
      color: theme.goldSubtle,
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 8,
    },

    /* ── Search ── */
    searchWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: 'rgba(251,191,36,0.15)',
      borderRadius: 14,
      marginHorizontal: 16,
      marginBottom: 16,
      paddingHorizontal: 14,
      paddingVertical: 10,
      gap: 10,
    },
    searchInput: {
      flex: 1,
      color: theme.textWarm,
      fontSize: 15,
      fontFamily: Fonts.serif,
      padding: 0,
    },

    /* ── Loading / Empty ── */
    loadingWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
    },
    loadingText: {
      color: theme.goldText,
      fontSize: 16,
      fontFamily: Fonts.serif,
    },
    emptyWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      paddingHorizontal: 40,
    },
    emptyText: {
      color: theme.subtext,
      fontSize: 15,
      textAlign: 'center',
      fontFamily: Fonts.serif,
    },
    emptySubtext: {
      color: theme.subtextMuted,
      fontSize: 13,
      textAlign: 'center',
    },

    /* ── Scroll ── */
    scroll: { flex: 1 },
    scrollContent: {
      paddingHorizontal: 16,
      paddingBottom: 60,
      gap: 24,
    },

    /* ── Section ── */
    section: { gap: 10 },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderLeftWidth: 3,
      paddingLeft: 12,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    sectionBadge: {
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    sectionBadgeText: {
      fontSize: 11,
      fontWeight: '700',
    },

    /* ── Entries ── */
    entriesCard: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 16,
      overflow: 'hidden',
    },
    entryRow: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 5,
    },
    entryRowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    entryTerm: {
      fontSize: 16,
      fontWeight: '700',
      fontFamily: Fonts.serif,
    },
    entryMeaning: {
      color: theme.subtext,
      fontSize: 14,
      lineHeight: 21,
      fontFamily: Fonts.serif,
    },

    /* ── Footer ── */
    footer: {
      alignItems: 'center',
      paddingVertical: 20,
    },
    footerText: {
      color: theme.subtextMuted,
      fontSize: 13,
      fontStyle: 'italic',
      fontFamily: Fonts.serif,
    },
  });
