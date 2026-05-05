import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/theme/colors';
import { BADGE_DEFINITIONS, BADGE_ICONS, fetchUserBadges, type Badge } from '@/lib/badges';
import { fetchCurrentUserAndProfile } from '@/lib/profile';
import { BlurView } from 'expo-blur';
import { Stack, useRouter } from 'expo-router';
import { ChevronLeft, Lock, Star, Target, X } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
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

const { width } = Dimensions.get('window');
const GRID_PADDING = 20;
const GAP = 12;
const COLUMNS = 3;
const ITEM_WIDTH = (width - (GRID_PADDING * 2) - (GAP * (COLUMNS - 1))) / COLUMNS;

export default function BadgesScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [earnedBadgeIds, setEarnedBadgeIds] = useState<string[]>([]);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { user } = await fetchCurrentUserAndProfile();
      if (user) {
        const ids = await fetchUserBadges(user.id);
        setEarnedBadgeIds(ids);
      }
      setLoading(false);
    };
    void load();
  }, []);

  const total = BADGE_DEFINITIONS.length;
  const earnedCount = earnedBadgeIds.length;
  const progress = total > 0 ? earnedCount / total : 0;

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
          <Text style={styles.headerTitle}>Achievements</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 60 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Summary */}
          <View style={styles.summaryGlass}>
            <BlurView intensity={20} tint={theme.blurTint} style={StyleSheet.absoluteFill} />
            <View style={styles.summaryHeader}>
              <View>
                <Text style={styles.summaryEyebrow}>Progress</Text>
                <Text style={styles.summaryCount}>
                  <Text style={styles.summaryCountStrong}>{earnedCount}</Text>
                  <Text style={styles.summaryCountTotal}> / {total}</Text>
                </Text>
                <Text style={styles.summaryLabel}>badges unlocked</Text>
              </View>
              <View style={styles.summaryPercent}>
                <Text style={styles.summaryPercentValue}>{Math.round(progress * 100)}%</Text>
              </View>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
            </View>
          </View>

          {/* Grid */}
          <View style={styles.grid}>
            {BADGE_DEFINITIONS.map((badge) => {
              const isEarned = earnedBadgeIds.includes(badge.id);
              const Icon = BADGE_ICONS[badge.icon] || Star;
              return (
                <TouchableOpacity
                  key={badge.id}
                  style={[styles.badgeItem, { width: ITEM_WIDTH }]}
                  activeOpacity={0.75}
                  onPress={() => setSelectedBadge(badge)}
                >
                  <View
                    style={[
                      styles.badgeCircle,
                      isEarned ? styles.badgeCircleEarned : styles.badgeCircleLocked,
                    ]}
                  >
                    <Icon
                      size={28}
                      color={isEarned ? '#fbbf24' : theme.subtextMuted}
                      strokeWidth={isEarned ? 1.7 : 1.6}
                    />
                    {!isEarned && (
                      <View style={styles.lockBadge}>
                        <Lock size={9} color={theme.subtext} strokeWidth={2.4} />
                      </View>
                    )}
                  </View>
                  <Text
                    style={[styles.badgeTitle, !isEarned && styles.badgeTitleLocked]}
                    numberOfLines={2}
                  >
                    {badge.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {!loading && earnedCount === 0 && (
            <View style={styles.emptyHint}>
              <Text style={styles.emptyHintText}>
                Open the app, save verses, and complete lessons to unlock your first achievements.
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Detail Modal */}
      <Modal
        visible={!!selectedBadge}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setSelectedBadge(null)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={40} tint={theme.blurTint} style={StyleSheet.absoluteFill} />
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setSelectedBadge(null)}
          />

          {selectedBadge && (
            <View style={styles.modalCard}>
              <BlurView intensity={30} tint={theme.blurTint} style={StyleSheet.absoluteFill} />

              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.modalClose}
                onPress={() => setSelectedBadge(null)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X color={theme.subtext} size={20} strokeWidth={2} />
              </TouchableOpacity>

              <View style={styles.modalIconWrap}>
                {(() => {
                  const Icon = BADGE_ICONS[selectedBadge.icon] || Star;
                  const isEarned = earnedBadgeIds.includes(selectedBadge.id);
                  return (
                    <Icon
                      size={56}
                      color={isEarned ? '#fbbf24' : theme.subtext}
                      strokeWidth={1.6}
                    />
                  );
                })()}
              </View>

              <View
                style={[
                  styles.statusPill,
                  earnedBadgeIds.includes(selectedBadge.id)
                    ? styles.statusPillEarned
                    : styles.statusPillLocked,
                ]}
              >
                <Text
                  style={[
                    styles.statusPillText,
                    {
                      color: earnedBadgeIds.includes(selectedBadge.id)
                        ? '#86efac'
                        : theme.subtext,
                    },
                  ]}
                >
                  {earnedBadgeIds.includes(selectedBadge.id) ? 'Unlocked' : 'Locked'}
                </Text>
              </View>

              <Text style={styles.modalTitle}>{selectedBadge.title}</Text>
              <Text style={styles.modalDescription}>{selectedBadge.description}</Text>

              {!earnedBadgeIds.includes(selectedBadge.id) && (
                <View style={styles.criteriaBox}>
                  <Target size={14} color="#fbbf24" strokeWidth={1.8} />
                  <Text style={styles.criteriaText}>
                    Continue your journey to unlock this achievement.
                  </Text>
                </View>
              )}

              <Pressable
                onPress={() => setSelectedBadge(null)}
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

  scrollContent: { paddingHorizontal: GRID_PADDING },

  summaryGlass: { borderRadius: 22, overflow: 'hidden', backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, padding: 22, marginBottom: 28 },
  summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  summaryEyebrow: { color: theme.subtext, fontSize: 11, fontWeight: '600', letterSpacing: 1.6, textTransform: 'uppercase', marginBottom: 8 },
  summaryCount: { color: theme.text, lineHeight: 38 },
  summaryCountStrong: { color: theme.text, fontSize: 36, fontWeight: '700', fontFamily: Fonts.serif, letterSpacing: -0.5 },
  summaryCountTotal: { color: theme.subtextMuted, fontSize: 22, fontWeight: '500', fontFamily: Fonts.serif },
  summaryLabel: { color: theme.subtext, fontSize: 13, fontWeight: '500', marginTop: 4 },
  summaryPercent: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(251,191,36,0.1)', borderWidth: 1, borderColor: 'rgba(251,191,36,0.18)', borderRadius: 999 },
  summaryPercentValue: { color: '#fbbf24', fontSize: 13, fontWeight: '700', letterSpacing: 0.3, fontVariant: ['tabular-nums'] },
  progressBarBg: { height: 5, backgroundColor: theme.surface, borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#fbbf24', borderRadius: 3 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  badgeItem: { alignItems: 'center', marginBottom: 18, paddingTop: 4 },
  badgeCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 10, borderWidth: 1, position: 'relative' },
  badgeCircleEarned: { backgroundColor: 'rgba(251,191,36,0.08)', borderColor: 'rgba(251,191,36,0.22)' },
  badgeCircleLocked: { backgroundColor: theme.surface, borderColor: theme.border },
  lockBadge: { position: 'absolute', top: -2, right: -2, width: 20, height: 20, borderRadius: 10, backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border, alignItems: 'center', justifyContent: 'center' },
  badgeTitle: { color: theme.text, fontSize: 12, fontWeight: '600', textAlign: 'center', letterSpacing: 0.1, lineHeight: 16 },
  badgeTitleLocked: { color: theme.subtextMuted, fontWeight: '500' },
  emptyHint: { paddingHorizontal: 24, paddingVertical: 12, alignItems: 'center' },
  emptyHintText: { color: theme.subtextMuted, fontSize: 13, textAlign: 'center', lineHeight: 20, maxWidth: 280 },

  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalCard: { width: '100%', maxWidth: 360, borderRadius: 24, overflow: 'hidden', backgroundColor: theme.popup, borderWidth: 1, borderColor: theme.border, paddingTop: 32, paddingHorizontal: 28, paddingBottom: 24, alignItems: 'center' },
  modalClose: { position: 'absolute', top: 14, right: 14, width: 32, height: 32, borderRadius: 16, backgroundColor: theme.surface, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  modalIconWrap: { width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(251,191,36,0.08)', borderWidth: 1, borderColor: 'rgba(251,191,36,0.18)', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  statusPill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, marginBottom: 14, borderWidth: 1 },
  statusPillEarned: { backgroundColor: 'rgba(134,239,172,0.08)', borderColor: 'rgba(134,239,172,0.2)' },
  statusPillLocked: { backgroundColor: theme.surface, borderColor: theme.border },
  statusPillText: { fontSize: 11, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase' },
  modalTitle: { color: theme.text, fontSize: 22, fontWeight: '700', letterSpacing: -0.3, marginBottom: 8, textAlign: 'center' },
  modalDescription: { color: theme.subtext, fontSize: 15, lineHeight: 22, textAlign: 'center', marginBottom: 20 },
  criteriaBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(251,191,36,0.06)', borderWidth: 1, borderColor: 'rgba(251,191,36,0.12)', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, marginBottom: 22, width: '100%' },
  criteriaText: { color: 'rgba(251,191,36,0.85)', fontSize: 12.5, flex: 1, fontWeight: '500', lineHeight: 17 },
  modalButton: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, height: 48, borderRadius: 14, width: '100%', alignItems: 'center', justifyContent: 'center' },
  modalButtonText: { color: theme.text, fontSize: 14, fontWeight: '600', letterSpacing: 0.2 },
});
