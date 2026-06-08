import LearnBackground from '@/components/LearnBackground';
import WorldOfHinduism from '@/components/learning/WorldOfHinduism';
import LotusLoader from '@/components/ui/LotusLoader';
import { Fonts, GitaColors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { fetchAllFestivals, getFestivalSymbol } from '@/lib/festivals';
import type { Theme } from '@/theme/colors';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Calendar, ChevronRight, Globe } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Reanimated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type LearnTab = 'world' | 'festivals';

export default function LearnScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<LearnTab>('world');
  // Festivals mounts lazily on first open and then stays mounted. It must never
  // mount while hidden — its loader measures SVG paths, which throws if the
  // node is detached (display:none).
  const [festivalsMounted, setFestivalsMounted] = useState(false);
  const tabRef = useRef<LearnTab>('world');

  const pillAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    tabRef.current = tab;
  }, [tab]);

  const switchTab = useCallback((nextTab: LearnTab) => {
    if (nextTab === tabRef.current) return;
    tabRef.current = nextTab;
    const target = nextTab === 'world' ? 0 : 1;
    pillAnim.stopAnimation((currentValue) => {
      pillAnim.setValue(currentValue);
      // Mount Festivals in the same render that makes it active, so it is never
      // mounted while hidden.
      if (nextTab === 'festivals') setFestivalsMounted(true);
      setTab(nextTab);
      Animated.timing(pillAnim, {
        toValue: target,
        duration: 320,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
  }, [pillAnim]);

  return (
    <View style={styles.root}>
      {/* Keep the 3D world mounted and laid out while Festivals is open. Detaching
          the Expo GL canvas with display:none can make it jump when restored. */}
      <View style={styles.tabContentWrap}>
        <View
          accessibilityElementsHidden={tab !== 'world'}
          importantForAccessibility={tab === 'world' ? 'auto' : 'no-hide-descendants'}
          pointerEvents={tab === 'world' ? 'auto' : 'none'}
          style={[StyleSheet.absoluteFill, tab !== 'world' && styles.inactiveWorldLayer]}
        >
          <WorldOfHinduism active={tab === 'world'} />
        </View>
        {festivalsMounted && (
          <View style={[StyleSheet.absoluteFill, tab !== 'festivals' && styles.hiddenLayer]}>
            <LearnBackground>
              <FestivalsView />
            </LearnBackground>
          </View>
        )}
      </View>

      {/* Floating toggle — overlays whichever view is active */}
      <View style={[styles.topTabsWrap, { top: insets.top + 8 }]} pointerEvents="box-none">
        <View style={styles.topTabs}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.slidingPill,
              {
                transform: [
                  {
                    translateX: pillAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 128],
                    }),
                  },
                ],
              },
            ]}
          />
          <TouchableOpacity activeOpacity={0.7} style={styles.topTab} onPress={() => { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); switchTab('world'); }}>
            <Globe size={15} color="#FFFFFF" />
            <Text style={[styles.topTabText, tab === 'world' && styles.topTabTextActive]}>World</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7} style={styles.topTab} onPress={() => { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); switchTab('festivals'); }}>
            <Calendar size={15} color="#FFFFFF" />
            <Text style={[styles.topTabText, tab === 'festivals' && styles.topTabTextActive]}>Festivals</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const getOrdinalDay = (day: number) => {
  if (day > 3 && day < 21) return day + 'th';
  switch (day % 10) {
    case 1: return day + 'st';
    case 2: return day + 'nd';
    case 3: return day + 'rd';
    default: return day + 'th';
  }
};

function FestivalsView() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [currentMonthIdx, setCurrentMonthIdx] = useState(new Date().getMonth());
  const [allFestivals, setAllFestivals] = useState<Awaited<ReturnType<typeof fetchAllFestivals>>>([]);
  const [loading, setLoading] = useState(true);

  // Animation values
  const listOpacity = useSharedValue(1);
  const listTranslateX = useSharedValue(0);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await fetchAllFestivals();
      setAllFestivals(data);
      setLoading(false);
    })();
  }, []);

  const monthName = MONTHS[currentMonthIdx];
  const filtered = useMemo(() => {
    return allFestivals.filter(f => f.month.includes(monthName));
  }, [allFestivals, monthName]);

  const listAnimatedStyle = useAnimatedStyle(() => ({
    opacity: listOpacity.value,
    transform: [{ translateX: listTranslateX.value }]
  }));

  const animateTransition = (direction: 'next' | 'prev', callback: () => void) => {
    const isNext = direction === 'next';
    const outX = isNext ? -30 : 30;
    const inX = isNext ? 30 : -30;

    listOpacity.value = withTiming(0, { duration: 150 }, (finished) => {
      if (finished) {
        runOnJS(callback)();
        listTranslateX.value = inX;
        listOpacity.value = withTiming(1, { duration: 250 });
        listTranslateX.value = withTiming(0, { duration: 250 });
      }
    });
    listTranslateX.value = withTiming(outX, { duration: 150 });
  };

  const nextMonth = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    animateTransition('next', () => {
      setCurrentMonthIdx(prev => (prev + 1) % 12);
    });
  };

  const prevMonth = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    animateTransition('prev', () => {
      setCurrentMonthIdx(prev => (prev - 1 + 12) % 12);
    });
  };

  return (
    <ScrollView style={styles.festScroll} contentContainerStyle={styles.festContent} showsVerticalScrollIndicator={false}>
      <View style={styles.festCard}>
        <View style={styles.festHeader}>
          <Text style={styles.festTitle}>Hindu Festival Calendar</Text>
          <Text style={styles.festYear}>2026</Text>
        </View>

        <View style={styles.monthRow}>
          <TouchableOpacity activeOpacity={0.7} onPress={prevMonth} hitSlop={20}>
            <Text style={styles.monthArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.monthText}>{monthName}</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={nextMonth} hitSlop={20}>
            <Text style={styles.monthArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loaderArea}>
            <LotusLoader size={80} color={GitaColors.gold} />
            <Text style={styles.loadingText}>Loading festivals...</Text>
          </View>
        ) : (
          <Reanimated.View style={[styles.festivalList, listAnimatedStyle]}>
            {filtered.length === 0 ? (
              <View style={styles.emptyArea}>
                <Text style={styles.emptyText}>No major festivals this month.</Text>
              </View>
            ) : (
              filtered.map((fest) => (
                <TouchableOpacity activeOpacity={0.7}
                  key={fest.id}
                  style={styles.festivalItemCard}
                  onPress={() => { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(`/festival-detail?id=${fest.id}`); }}
                >
                  <View style={styles.festItemLeft}>
                    <View style={styles.symbolBadge}>
                      <Text style={styles.festItemIcon}>{getFestivalSymbol(fest.name, fest.icon_emoji)}</Text>
                    </View>
                    <View style={styles.festItemMeta}>
                      <Text style={styles.festItemName}>{fest.name}</Text>
                      <Text style={styles.festItemDeity}>{fest.deity}</Text>
                      <Text style={styles.festItemDateText}>{fest.month} {getOrdinalDay(new Date(fest.main_date).getUTCDate())}</Text>
                    </View>
                  </View>
                  <ChevronRight size={20} color="rgba(251, 191, 36, 0.3)" />
                </TouchableOpacity>
              ))
            )}
          </Reanimated.View>
        )}
      </View>
    </ScrollView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  root: { flex: 1 },
  // Toggle floats above whichever view is active (the World planet fills the
  // whole screen, so the toggle is absolutely positioned rather than in-flow).
  topTabsWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 50 },
  topTabs: { flexDirection: 'row', backgroundColor: 'rgba(15,25,50,0.65)', borderRadius: 9999, padding: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', position: 'relative' },
  slidingPill: { position: 'absolute', top: 4, bottom: 4, left: 4, width: 128, borderRadius: 9999, backgroundColor: GitaColors.orange },
  topTab: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, width: 128 },
  topTabText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  topTabTextActive: { color: '#FFFFFF' },
  tabContentWrap: { flex: 1 },
  inactiveWorldLayer: { opacity: 0 },
  hiddenLayer: { display: 'none' },
  // Festivals — content clears the floating toggle.
  festScroll: { flex: 1 },
  festContent: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 132 },
  festCard: { backgroundColor: 'rgba(15,25,50,0.65)', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(251,191,36,0.15)' },
  festHeader: { alignItems: 'center', paddingVertical: 18 },
  festTitle: { color: GitaColors.gold, fontSize: 30, fontWeight: '800', fontFamily: Fonts.serif, textAlign: 'center', lineHeight: 36 },
  festYear: { color: 'rgba(251,191,36,0.6)', fontSize: 16, marginTop: 4, fontWeight: '700', letterSpacing: 4, textAlign: 'center' },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, marginBottom: 20, backgroundColor: theme.surface, borderRadius: 20, paddingHorizontal: 24, paddingVertical: 16, borderWidth: 1, borderColor: theme.border },
  monthText: { color: 'white', fontSize: 20, fontWeight: '800', letterSpacing: 0.5 },
  monthArrow: { color: GitaColors.gold, fontSize: 36, fontWeight: '300', lineHeight: 36, paddingHorizontal: 10 },
  loaderArea: { paddingVertical: 60, alignItems: 'center' },
  emptyArea: { paddingVertical: 60, alignItems: 'center' },
  emptyText: { color: theme.subtextMuted, fontSize: 16, textAlign: 'center' },
  festivalList: { marginTop: 4 },
  festivalItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.surface,
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.12)',
    boxShadow: '0px 6px 10px rgba(0, 0, 0, 0.15)',
    elevation: 4,
  },
  festItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 20, flex: 1 },
  symbolBadge: { width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(251, 191, 36, 0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(251, 191, 36, 0.2)' },
  festItemIcon: { fontSize: 28 },
  festItemMeta: { flex: 1 },
  festItemName: { color: 'white', fontSize: 20, fontWeight: '800', fontFamily: Fonts.serif, lineHeight: 24 },
  festItemDeity: { color: 'rgba(251, 191, 36, 0.7)', fontSize: 14, marginTop: 2, fontWeight: '600' },
  festItemDateText: { color: 'rgba(251, 191, 36, 0.5)', fontSize: 13, marginTop: 6, fontWeight: '700', letterSpacing: 0.5 },
  loadingText: { color: theme.text, marginTop: 16, fontSize: 16, fontFamily: Fonts.serif, opacity: 0.8 },
});
