import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/theme/colors';
import { fetchUserFavorites } from '@/lib/favorites';
import { fetchCurrentUserAndProfile } from '@/lib/profile';
import { fetchAllGitaVerses } from '@/lib/verses';
import { BlurView } from 'expo-blur';
import { Stack, useRouter } from 'expo-router';
import { ChevronLeft, Heart, X } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
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

type Verse = {
  id: string;
  chapter: number;
  verse: number;
  english: string;
  hindi: string;
  speaker?: string;
};

export default function SavedVersesScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVerse, setSelectedVerse] = useState<Verse | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { user } = await fetchCurrentUserAndProfile();
        if (!user) return;
        const [favIds, allVerses] = await Promise.all([
          fetchUserFavorites(user.id),
          fetchAllGitaVerses(),
        ]);
        const mapped: Verse[] = allVerses.map((v) => ({
          id: v.id,
          chapter: v.chapter_number,
          verse: v.verse_number,
          english: v.english,
          hindi: v.hindi || '',
          speaker: v.speaker || undefined,
        }));
        setVerses(mapped.filter((v) => favIds.includes(v.id)));
      } catch (e) {
        console.error('SavedVerses load error:', e);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

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
            activeOpacity={0.7}
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ChevronLeft color={theme.text} size={24} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Saved Verses</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 60 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Summary card */}
          <View style={styles.summaryGlass}>
            <BlurView intensity={20} tint={theme.blurTint} style={StyleSheet.absoluteFill} />
            <View style={styles.summaryRow}>
              <View>
                <Text style={styles.summaryEyebrow}>Collection</Text>
                <Text style={styles.summaryCount}>
                  <Text style={styles.summaryCountStrong}>{verses.length}</Text>
                  <Text style={styles.summaryCountLabel}> saved</Text>
                </Text>
              </View>
              <View style={styles.heartPill}>
                <Heart size={16} color={RED} fill={RED} strokeWidth={0} />
              </View>
            </View>
          </View>

          {/* Verse list */}
          {loading ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>Loading...</Text>
            </View>
          ) : verses.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Heart size={36} color="rgba(248,113,113,0.2)" strokeWidth={1.5} />
              <Text style={styles.emptyText}>No saved verses yet</Text>
              <Text style={styles.emptySub}>
                Tap the heart on any verse to save it here.
              </Text>
            </View>
          ) : (
            <View style={styles.verseList}>
              {verses.map((verse, index) => (
                <TouchableOpacity
                  key={verse.id}
                  activeOpacity={0.75}
                  onPress={() => setSelectedVerse(verse)}
                  style={[
                    styles.verseCard,
                    index === 0 && styles.verseCardFirst,
                  ]}
                >
                  <BlurView intensity={20} tint={theme.blurTint} style={StyleSheet.absoluteFill} />
                  <View style={styles.verseCardInner}>
                    <View style={styles.verseCardHeader}>
                      <Text style={styles.verseRef}>
                        {verse.chapter}.{verse.verse}
                      </Text>
                      {verse.speaker && (
                        <Text style={styles.verseSpeaker}>{verse.speaker}</Text>
                      )}
                    </View>
                    <Text style={styles.verseText} numberOfLines={3}>
                      {verse.english}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Detail Modal */}
      <Modal
        visible={!!selectedVerse}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setSelectedVerse(null)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={40} tint={theme.blurTint} style={StyleSheet.absoluteFill} />
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSelectedVerse(null)} />

          {selectedVerse && (
            <View style={styles.modalCard}>
              <BlurView intensity={30} tint={theme.blurTint} style={StyleSheet.absoluteFill} />

              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.modalClose}
                onPress={() => setSelectedVerse(null)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X color={theme.subtext} size={20} strokeWidth={2} />
              </TouchableOpacity>

              <View style={styles.modalRefRow}>
                <Text style={styles.modalRef}>
                  {selectedVerse.chapter}.{selectedVerse.verse}
                </Text>
                {selectedVerse.speaker && (
                  <Text style={styles.modalSpeaker}>{selectedVerse.speaker}</Text>
                )}
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                style={styles.modalScroll}
                contentContainerStyle={styles.modalScrollContent}
              >
                <Text style={styles.modalText}>{selectedVerse.english}</Text>
                {selectedVerse.hindi ? (
                  <Text style={styles.modalHindi}>{selectedVerse.hindi}</Text>
                ) : null}
              </ScrollView>

              <Pressable
                onPress={() => setSelectedVerse(null)}
                style={({ pressed }) => [styles.modalButton, pressed && { opacity: 0.7 }]}
              >
                <Text style={styles.modalButtonText}>Close</Text>
              </Pressable>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.background },
  safe: { flex: 1 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: theme.text, fontSize: 18, fontWeight: '600', letterSpacing: -0.2 },

  scrollContent: { paddingHorizontal: 20 },

  summaryGlass: { borderRadius: 22, overflow: 'hidden', backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, padding: 22, marginBottom: 24 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryEyebrow: { color: theme.subtext, fontSize: 11, fontWeight: '600', letterSpacing: 1.6, textTransform: 'uppercase', marginBottom: 6 },
  summaryCount: { flexDirection: 'row', alignItems: 'baseline' },
  summaryCountStrong: { color: theme.text, fontSize: 36, fontWeight: '700', fontFamily: Fonts.serif, letterSpacing: -0.5 },
  summaryCountLabel: { color: theme.subtextMuted, fontSize: 18, fontWeight: '500', fontFamily: Fonts.serif },
  heartPill: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(248,113,113,0.08)', borderWidth: 1, borderColor: 'rgba(248,113,113,0.18)', alignItems: 'center', justifyContent: 'center' },

  verseList: { gap: 12 },
  verseCard: { borderRadius: 18, overflow: 'hidden', backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
  verseCardFirst: {},
  verseCardInner: { padding: 18 },
  verseCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  verseRef: { color: '#fbbf24', fontSize: 13, fontWeight: '700', letterSpacing: 0.4 },
  verseSpeaker: { color: theme.subtextMuted, fontSize: 11, fontWeight: '500', letterSpacing: 0.6, textTransform: 'uppercase' },
  verseText: { color: theme.text, fontSize: 14, lineHeight: 22, fontWeight: '400' },

  emptyWrap: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { color: theme.subtext, fontSize: 15, fontWeight: '500' },
  emptySub: { color: theme.subtextMuted, fontSize: 13, textAlign: 'center', lineHeight: 20, maxWidth: 240 },

  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalCard: { width: '100%', maxWidth: 380, maxHeight: '78%', borderRadius: 24, overflow: 'hidden', backgroundColor: theme.popup, borderWidth: 1, borderColor: theme.border, paddingTop: 28, paddingHorizontal: 24, paddingBottom: 24 },
  modalClose: { position: 'absolute', top: 14, right: 14, width: 32, height: 32, borderRadius: 16, backgroundColor: theme.surface, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  modalRefRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18, paddingRight: 36 },
  modalRef: { color: '#fbbf24', fontSize: 15, fontWeight: '700', letterSpacing: 0.4 },
  modalSpeaker: { color: theme.subtext, fontSize: 11, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase' },
  modalScroll: { flexGrow: 0, marginBottom: 20 },
  modalScrollContent: { gap: 16 },
  modalText: { color: theme.text, fontSize: 16, lineHeight: 26, fontWeight: '400', fontFamily: Fonts.serif },
  modalHindi: { color: theme.subtext, fontSize: 14, lineHeight: 22, fontWeight: '400' },
  modalButton: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  modalButtonText: { color: theme.text, fontSize: 14, fontWeight: '600', letterSpacing: 0.2 },
});
