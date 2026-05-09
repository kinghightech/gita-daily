import FestivalModal from '@/components/gita/FestivalModal';
import LearnBackground from '@/components/LearnBackground';
import LotusLevel from '@/components/learning/LotusLevel';
import LotusLoader from '@/components/ui/LotusLoader';
import { Fonts, GitaColors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { fetchAllFestivals, getFestivalSymbol, type Festival } from '@/lib/festivals';
import { fetchLotusLevels, type LotusLevelData } from '@/lib/lotus';
import { fetchCurrentUserAndProfile, STREAK_UPDATED_EVENT } from '@/lib/profile';
import type { Theme } from '@/theme/colors';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Calendar, ChevronRight, Flower2 } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, DeviceEventEmitter, Easing, InteractionManager, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Reanimated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

type LearnTab = 'lotus' | 'festivals';

const TOTAL_LEVELS = 50;
const ROW_HEIGHT = 96;
const PATH_WIDTH = 340;
const NODE_RADIUS = 40;
const PATH_HEIGHT = TOTAL_LEVELS * ROW_HEIGHT;
const LOTUS_SCALE = 1.12;

const FIRST_LEVEL_POS = getLevelPosition(0);
const SECOND_LEVEL_POS = getLevelPosition(1);
const SEGMENT_LENGTH = Math.hypot(
  SECOND_LEVEL_POS.cx - FIRST_LEVEL_POS.cx,
  SECOND_LEVEL_POS.cy - FIRST_LEVEL_POS.cy
);
function getLevelPosition(index: number) {
  const cy = index * ROW_HEIGHT + 50;
  const cx = index % 2 === 0 ? 70 : 270;
  return { cx, cy };
}

function buildPathString() {
  let path = '';
  for (let i = 0; i < TOTAL_LEVELS; i++) {
    const { cx, cy } = getLevelPosition(i);
    path += i === 0 ? `M ${cx} ${cy}` : ` L ${cx} ${cy}`;
  }
  return path;
}

const PATH_STRING = buildPathString();
const AnimatedPath = Animated.createAnimatedComponent(Path);

export default function LearnScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [tab, setTab] = useState<LearnTab>('lotus');
  const [selectedFestival, setSelectedFestival] = useState<Festival | null>(null);
  const tabRef = useRef<LearnTab>('lotus');

  const pillAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    tabRef.current = tab;
  }, [tab]);

  const switchTab = useCallback((nextTab: LearnTab) => {
    if (nextTab === tabRef.current) return;
    tabRef.current = nextTab;
    const target = nextTab === 'lotus' ? 0 : 1;
    pillAnim.stopAnimation((currentValue) => {
      pillAnim.setValue(currentValue);
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
    <LearnBackground>
      <View style={styles.topTabsWrap}>
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
          <TouchableOpacity activeOpacity={0.7} style={styles.topTab} onPress={() => { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); switchTab('lotus'); }}>
            <Flower2 size={15} color="#FFFFFF" />
            <Text style={[styles.topTabText, tab === 'lotus' && styles.topTabTextActive]}>Lotus Path</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7} style={styles.topTab} onPress={() => { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); switchTab('festivals'); }}>
            <Calendar size={15} color="#FFFFFF" />
            <Text style={[styles.topTabText, tab === 'festivals' && styles.topTabTextActive]}>Festivals</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.tabContentWrap}>
        {tab === 'lotus' ? <LotusPathView /> : <FestivalsView onSelectFestival={setSelectedFestival} />}
      </View>
      <FestivalModal festival={selectedFestival} onClose={() => setSelectedFestival(null)} />
    </LearnBackground>
  );
}

function LotusPathView() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [allLevels, setAllLevels] = useState<LotusLevelData[]>([]);
  const [lockedMessage, setLockedMessage] = useState<string | null>(null);
  const [lotusReady, setLotusReady] = useState(false);
  const [prevLevel, setPrevLevel] = useState<number | null>(null);
  const hasInitialPathDrawn = useRef(false);

  const refreshProgress = useCallback(async () => {
    const { profile } = await fetchCurrentUserAndProfile();
    if (profile) {
      setPrevLevel(currentLevel);
      setCurrentLevel(profile.current_lotus_level);
    }
  }, [currentLevel]);

  useEffect(() => {
    (async () => {
      try {
        const levels = await fetchLotusLevels();
        setAllLevels(levels);
      } catch (err) {
        console.error('Failed to fetch lotus levels:', err);
      }
    })();
    refreshProgress();
    const sub = DeviceEventEmitter.addListener(STREAK_UPDATED_EVENT, refreshProgress);
    return () => sub.remove();
  }, [refreshProgress]);

  useFocusEffect(useCallback(() => { refreshProgress(); }, [refreshProgress]));

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => setLotusReady(true));
    return () => task.cancel();
  }, []);

  const totalSegmentLength = (TOTAL_LEVELS - 1) * SEGMENT_LENGTH;
  const progressCount = Math.min(currentLevel - 1, allLevels.length);
  const targetLineLength = progressCount * SEGMENT_LENGTH;
  const lineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const isFirstLoad = !hasInitialPathDrawn.current;
    const duration = (!isFirstLoad && currentLevel > prevLevel!) ? 1200 : 0;

    if (isFirstLoad && allLevels.length > 0) {
      lineAnim.setValue(targetLineLength);
      hasInitialPathDrawn.current = true;
    } else {
      Animated.timing(lineAnim, {
        toValue: targetLineLength,
        duration,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }
  }, [lineAnim, targetLineLength, currentLevel, prevLevel, allLevels.length]);

  const dashOffset = lineAnim.interpolate({
    inputRange: [0, totalSegmentLength || 1],
    outputRange: [totalSegmentLength || 1, 0],
    extrapolate: 'clamp',
  });

  const showLockedMessage = (message: string) => {
    setLockedMessage(message);
    setTimeout(() => setLockedMessage(null), 1600);
  };

  const handleLevelPress = useCallback((level: number) => {
    if (level > currentLevel) {
      showLockedMessage('Complete previous levels first!');
      return;
    }
    const found = allLevels.some(l => l.id === level);
    if (!found) {
      showLockedMessage('Level coming soon!');
      return;
    }
    router.push({ pathname: '/level/[id]', params: { id: level } });
  }, [currentLevel, allLevels]);

  const lotusNodes = useMemo(() => {
    if (!lotusReady || allLevels.length === 0) return null; // Wait for both
    return Array.from({ length: TOTAL_LEVELS }, (_, index) => {
      const level = index + 1;
      const { cx, cy } = getLevelPosition(index);
      const isCompleted = level < currentLevel;
      const isUnlocked = level <= currentLevel;
      const available = allLevels.some(l => l.id === level);
      return (
        <View key={level} style={[styles.nodeWrapper, { left: cx - NODE_RADIUS, top: cy - NODE_RADIUS, transform: [{ scale: LOTUS_SCALE }] }]}>
          <LotusLevel
            level={level}
            isCompleted={isCompleted}
            isLocked={!isUnlocked || !available}
            isActive={isUnlocked && available && !isCompleted}
            allowPressWhenLocked
            onPress={handleLevelPress}
          />
        </View>
      );
    });
  }, [currentLevel, allLevels, handleLevelPress, lotusReady]);

  return (
    <>
      {lockedMessage && <View style={styles.lockedBanner}><Text style={styles.lockedBannerText}>{lockedMessage}</Text></View>}
      {!lotusReady || allLevels.length === 0 ? (
        <View style={styles.loaderCenterContainer}>
          <LotusLoader size={110} color={GitaColors.gold} />
          <Text style={styles.loadingTextMain}>Entering the Lotus Path...</Text>
        </View>
      ) : (
        <ScrollView style={styles.lotusScroll} contentContainerStyle={styles.lotusContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Flower2 size={24} color={GitaColors.gold} />
              <Text style={styles.title}>The Lotus Path</Text>
            </View>
            <Text style={styles.subtitle}>A Guide to Sanātana Dharma</Text>
            <View style={styles.progressContainer}>
              <Text style={styles.progress}>Level {currentLevel} of {TOTAL_LEVELS}</Text>
              <View style={styles.progressBarBg}>
                 <View style={[styles.progressBarFill, { width: `${(Math.min(currentLevel - 1, TOTAL_LEVELS) / TOTAL_LEVELS) * 100}%` }]} />
              </View>
            </View>
          </View>
          <View style={[styles.pathContainer, { width: PATH_WIDTH, height: PATH_HEIGHT }]}>
            <Svg width={PATH_WIDTH} height={PATH_HEIGHT} style={styles.pathSvg}>
              <Path d={PATH_STRING} stroke="#334155" strokeWidth="14" fill="none" strokeLinecap="round" />
              <AnimatedPath d={PATH_STRING} stroke="#22c55e" strokeWidth="12" fill="none" strokeLinecap="round" strokeDasharray={`${totalSegmentLength} ${totalSegmentLength}`} strokeDashoffset={dashOffset as any} />
            </Svg>
            {lotusNodes}
          </View>
        </ScrollView>
      )}
    </>
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

function FestivalsView({ onSelectFestival }: { onSelectFestival: (f: Festival) => void }) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [currentMonthIdx, setCurrentMonthIdx] = useState(new Date().getMonth());
  const [allFestivals, setAllFestivals] = useState<Festival[]>([]);
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
          <TouchableOpacity activeOpacity={0.7} p-4 onPress={prevMonth} hitSlop={20}>
            <Text style={styles.monthArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.monthText}>{monthName}</Text>
          <TouchableOpacity activeOpacity={0.7} p-4 onPress={nextMonth} hitSlop={20}>
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
                  onPress={() => { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onSelectFestival(fest); }}
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
  topTabsWrap: { alignItems: 'center', marginTop: 12, marginBottom: 20 },
  topTabs: { flexDirection: 'row', backgroundColor: 'rgba(15,25,50,0.65)', borderRadius: 9999, padding: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', position: 'relative' },
  slidingPill: { position: 'absolute', top: 4, bottom: 4, left: 4, width: 128, borderRadius: 9999, backgroundColor: GitaColors.orange },
  topTab: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, width: 128 },
  topTabText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  topTabTextActive: { color: '#FFFFFF' },
  tabContentWrap: { flex: 1 },
  lockedBanner: { marginHorizontal: 16, marginBottom: 8, backgroundColor: 'rgba(248,113,113,0.2)', borderWidth: 1, borderColor: '#ef4444', borderRadius: 12, padding: 10, alignItems: 'center' },
  lockedBannerText: { color: '#fca5a5', fontSize: 13, fontWeight: '700' },
  lotusScroll: { flex: 1 },
  lotusContent: { alignItems: 'center', paddingBottom: 120 },
  header: { paddingVertical: 16, alignItems: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  title: { fontSize: 24, color: '#FFFFFF', fontFamily: Fonts.serif, fontWeight: '700' },
  subtitle: { color: 'rgba(207,250,254,0.8)', fontSize: 14, fontWeight: '500' },
  progressContainer: { width: '100%', alignItems: 'center', marginTop: 8 },
  progress: { color: 'rgba(165,243,252,0.6)', fontSize: 12, marginBottom: 6 },
  progressBarBg: { width: 160, height: 4, backgroundColor: theme.surface, borderRadius: 2 },
  progressBarFill: { height: '100%', backgroundColor: GitaColors.gold, borderRadius: 2 },
  pathContainer: { position: 'relative', alignSelf: 'center' },
  pathSvg: { position: 'absolute', top: 0, left: 0 },
  nodeWrapper: { position: 'absolute', zIndex: 10 },
  festScroll: { flex: 1 },
  festContent: { paddingHorizontal: 20, paddingBottom: 100 },
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
  loaderCenterContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingTextMain: { color: theme.text, fontSize: 16, fontFamily: Fonts.serif, opacity: 0.8 },
  loadingText: { color: theme.text, marginTop: 16, fontSize: 16, fontFamily: Fonts.serif, opacity: 0.8 },
});
