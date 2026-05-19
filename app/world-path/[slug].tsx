import { getWorldPathBySlug } from '@/lib/worldPaths';
import { useTheme } from '@/hooks/useTheme';
import { GitaColors, Fonts } from '@/constants/theme';
import LearnBackground from '@/components/LearnBackground';
import LotusLevel from '@/components/learning/LotusLevel';
import MountainShrine from '@/components/learning/MountainShrine';
import LotusLoader from '@/components/ui/LotusLoader';
import {
  fetchCurrentWorldLotusLevel,
  fetchWorldLotusLevels,
  type WorldLotusLevelData,
} from '@/lib/worldLotus';
import {
  fetchCurrentMountainLevel,
  fetchMountainLevels,
  type MountainLevelData,
} from '@/lib/mountainPath';
import { STREAK_UPDATED_EVENT } from '@/lib/profile';
import { useFocusEffect } from '@react-navigation/native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, BookOpen, ChevronRight, Flower2, MapPin, Sparkles } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  DeviceEventEmitter,
  Easing,
  InteractionManager,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path as SvgPath, Rect, Circle, Ellipse, Polygon } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import type { Theme } from '@/theme/colors';

// ── World Lotus Path constants ────────────────────────────────────────────────
const WL_TOTAL = 20;
const WL_ROW_H = 96;
const WL_PATH_W = 340;
const WL_NODE_R = 40;
const WL_SCALE = 1.12;
const WL_PATH_H = WL_TOTAL * WL_ROW_H; // 1920

function wlPos(i: number) {
  return { cx: i % 2 === 0 ? 70 : 270, cy: i * WL_ROW_H + 50 };
}

function buildWlPathD() {
  let d = '';
  for (let i = 0; i < WL_TOTAL; i++) {
    const { cx, cy } = wlPos(i);
    d += i === 0 ? `M ${cx} ${cy}` : ` L ${cx} ${cy}`;
  }
  return d;
}

const WL_PATH_D = buildWlPathD();
const WL_LAST = wlPos(WL_TOTAL - 1); // index 19 → cx=270, cy=1874

const WL_FIRST_POS = wlPos(0);
const WL_SECOND_POS = wlPos(1);
const WL_SEGMENT_LENGTH = Math.hypot(
  WL_SECOND_POS.cx - WL_FIRST_POS.cx,
  WL_SECOND_POS.cy - WL_FIRST_POS.cy,
);
const AnimatedWlPath = Animated.createAnimatedComponent(SvgPath);

// ── Wisdom Gate geometry ──────────────────────────────────────────────────────
const WG_CX = 170;
const WG_PILLAR_TOP = 1946;
const WG_ARCH_PEAK = 1910;
const WG_PILLAR_BOT = 1998;
const WG_LEFT_X = 128;
const WG_RIGHT_X = 212;
const WG_CAP_HW = 12;   // capital half-width (capital = 24px wide)
const WG_SHAFT_HW = 7;  // shaft half-width    (shaft   = 14px wide)
const WG_GATE_AREA = 165;
const WG_CONTAINER_H = WL_PATH_H + WG_GATE_AREA; // 2085
const WG_OM_CY = Math.round((WG_ARCH_PEAK + WG_PILLAR_TOP) / 2); // 1928
// ─────────────────────────────────────────────────────────────────────────────

export default function WorldPathScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (slug === 'lotus') {
    return <WorldLotusScreen />;
  }

  if (slug === 'mountain') {
    return <MountainPathScreen />;
  }

  const path = getWorldPathBySlug(slug);

  if (!path) {
    return (
      <View style={[styles.root, styles.center, { paddingTop: insets.top + 24 }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.missingTitle}>Path not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.missingButton} activeOpacity={0.75}>
          <Text style={styles.missingButtonText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />

      <View style={[styles.navBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navButton} activeOpacity={0.72}>
          <ArrowLeft size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>
          {path.title}
        </Text>
        <View style={styles.navSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 38 }]}
      >
        <View style={[styles.hero, { borderColor: path.accent }]}>
          <View style={[styles.heroIcon, { backgroundColor: `${path.accent}24`, borderColor: path.accent }]}>
            <MapPin size={24} color={path.accent} strokeWidth={2.6} />
          </View>
          <View style={styles.testPill}>
            <Sparkles size={13} color={GitaColors.gold} />
            <Text style={styles.testPillText}>Test Page</Text>
          </View>
          <Text style={styles.heroTitle}>{path.title}</Text>
          <Text style={styles.heroSubtitle}>{path.subtitle}</Text>
          <Text style={styles.regionText}>{path.region}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <BookOpen size={17} color={GitaColors.gold} />
            <Text style={styles.sectionTitle}>Overview</Text>
          </View>
          <Text style={styles.bodyText}>{path.overview}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Sparkles size={17} color={GitaColors.gold} />
            <Text style={styles.sectionTitle}>Sample Lessons</Text>
          </View>
          <View style={styles.lessonList}>
            {path.testLessons.map((lesson, index) => (
              <View key={lesson} style={styles.lessonRow}>
                <View style={[styles.lessonNumber, { borderColor: path.accent }]}>
                  <Text style={styles.lessonNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.lessonText}>{lesson}</Text>
                <ChevronRight size={17} color={theme.subtextMuted} />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ── World Lotus Screen ────────────────────────────────────────────────────────
function WorldLotusScreen() {
  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
      <LearnBackground>
        <View style={wlStyles.navBar}>
          <TouchableOpacity onPress={() => router.back()} style={wlStyles.navBtn} activeOpacity={0.72}>
            <ArrowLeft size={22} color="#FEF3C7" />
          </TouchableOpacity>
          <Text style={wlStyles.navTitle}>The Lotus Path</Text>
          <View style={wlStyles.navSpacer} />
        </View>
        <WorldLotusPathContent />
      </LearnBackground>
    </View>
  );
}

// ── World Lotus Path content ──────────────────────────────────────────────────
function WorldLotusPathContent() {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [allLevels, setAllLevels] = useState<WorldLotusLevelData[]>([]);
  const [lockedMessage, setLockedMessage] = useState<string | null>(null);
  const [lotusReady, setLotusReady] = useState(false);
  const [prevLevel, setPrevLevel] = useState<number | null>(null);
  const hasInitialPathDrawn = useRef(false);

  const refreshProgress = useCallback(async () => {
    const next = await fetchCurrentWorldLotusLevel();
    setPrevLevel((prev) => (prev === null ? next : prev));
    setCurrentLevel(next);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const levels = await fetchWorldLotusLevels();
        setAllLevels(levels);
      } catch (err) {
        console.error('Failed to fetch world lotus levels:', err);
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

  const totalSegmentLength = (WL_TOTAL - 1) * WL_SEGMENT_LENGTH;
  const progressCount = Math.min(currentLevel - 1, allLevels.length);
  const targetLineLength = progressCount * WL_SEGMENT_LENGTH;
  const lineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const isFirstLoad = !hasInitialPathDrawn.current;
    const duration = (!isFirstLoad && prevLevel !== null && currentLevel > prevLevel) ? 1200 : 0;

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
    const found = allLevels.some((l) => l.level_number === level);
    if (!found) {
      showLockedMessage('Level coming soon!');
      return;
    }
    router.push({ pathname: '/world-level/[id]', params: { id: level } });
  }, [currentLevel, allLevels]);

  const lotusNodes = useMemo(() => {
    if (!lotusReady || allLevels.length === 0) return null;
    return Array.from({ length: WL_TOTAL }, (_, index) => {
      const level = index + 1;
      const { cx, cy } = wlPos(index);
      const isCompleted = level < currentLevel;
      const isUnlocked = level <= currentLevel;
      const available = allLevels.some((l) => l.level_number === level);
      return (
        <View
          key={level}
          style={[
            wlStyles.nodeWrap,
            { left: cx - WL_NODE_R, top: cy - WL_NODE_R, transform: [{ scale: WL_SCALE }] },
          ]}
        >
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

  if (!lotusReady || allLevels.length === 0) {
    return (
      <View style={wlStyles.loaderCenter}>
        <LotusLoader size={110} color={GitaColors.gold} />
        <Text style={wlStyles.loadingTextMain}>Entering the Lotus Path...</Text>
      </View>
    );
  }

  return (
    <>
      {lockedMessage && (
        <View style={wlStyles.lockedBanner}>
          <Text style={wlStyles.lockedBannerText}>{lockedMessage}</Text>
        </View>
      )}
      <ScrollView
        style={wlStyles.scroll}
        contentContainerStyle={wlStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
      {/* Header */}
      <View style={wlStyles.header}>
        <View style={wlStyles.titleRow}>
          <Flower2 size={22} color={GitaColors.gold} />
          <Text style={wlStyles.title}>The Lotus Path</Text>
        </View>
        <Text style={wlStyles.subtitle}>20 milestones on the path to wisdom</Text>
        <View style={wlStyles.progressContainer}>
          <Text style={wlStyles.progress}>Level {currentLevel} of {WL_TOTAL}</Text>
          <View style={wlStyles.progressBarBg}>
            <View
              style={[
                wlStyles.progressBarFill,
                { width: `${(Math.min(currentLevel - 1, WL_TOTAL) / WL_TOTAL) * 100}%` },
              ]}
            />
          </View>
        </View>
      </View>

      {/* Path container */}
      <View style={[wlStyles.pathContainer, { width: WL_PATH_W, height: WG_CONTAINER_H }]}>

        {/* SVG layer — zigzag track + Wisdom Gate */}
        <Svg width={WL_PATH_W} height={WG_CONTAINER_H} style={wlStyles.pathSvg}>

          {/* Grey background track */}
          <SvgPath
            d={WL_PATH_D}
            stroke="#334155"
            strokeWidth="14"
            fill="none"
            strokeLinecap="round"
          />

          {/* Animated green progress track */}
          <AnimatedWlPath
            d={WL_PATH_D}
            stroke="#22c55e"
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${totalSegmentLength} ${totalSegmentLength}`}
            strokeDashoffset={dashOffset as any}
          />

          {/* Dashed gold connector from last lotus to gate entrance */}
          <SvgPath
            d={`M ${WL_LAST.cx} ${WL_LAST.cy} L ${WG_CX} ${WG_PILLAR_TOP}`}
            stroke="rgba(251,191,36,0.45)"
            strokeWidth="3.5"
            fill="none"
            strokeDasharray="7 5"
            strokeLinecap="round"
          />

          {/* Gate ambient glow */}
          <Ellipse
            cx={WG_CX}
            cy={Math.round((WG_ARCH_PEAK + WG_PILLAR_BOT) / 2)}
            rx={72}
            ry={52}
            fill="rgba(251,191,36,0.05)"
          />

          {/* Arch interior fill */}
          <SvgPath
            d={`M ${WG_LEFT_X - WG_CAP_HW} ${WG_PILLAR_TOP} Q ${WG_CX} ${WG_ARCH_PEAK} ${WG_RIGHT_X + WG_CAP_HW} ${WG_PILLAR_TOP} L ${WG_RIGHT_X + WG_CAP_HW} ${WG_PILLAR_BOT} L ${WG_LEFT_X - WG_CAP_HW} ${WG_PILLAR_BOT} Z`}
            fill="rgba(251,191,36,0.07)"
          />

          {/* Arch stroke */}
          <SvgPath
            d={`M ${WG_LEFT_X - WG_CAP_HW} ${WG_PILLAR_TOP} Q ${WG_CX} ${WG_ARCH_PEAK} ${WG_RIGHT_X + WG_CAP_HW} ${WG_PILLAR_TOP}`}
            stroke="#FBBF24"
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
          />

          {/* Left capital */}
          <Rect
            x={WG_LEFT_X - WG_CAP_HW}
            y={WG_PILLAR_TOP - 7}
            width={WG_CAP_HW * 2}
            height={8}
            rx={3}
            fill="#FBBF24"
          />
          {/* Right capital */}
          <Rect
            x={WG_RIGHT_X - WG_CAP_HW}
            y={WG_PILLAR_TOP - 7}
            width={WG_CAP_HW * 2}
            height={8}
            rx={3}
            fill="#FBBF24"
          />

          {/* Left pillar shaft */}
          <Rect
            x={WG_LEFT_X - WG_SHAFT_HW}
            y={WG_PILLAR_TOP + 1}
            width={WG_SHAFT_HW * 2}
            height={WG_PILLAR_BOT - WG_PILLAR_TOP - 1}
            rx={3}
            fill="rgba(251,191,36,0.78)"
          />
          {/* Right pillar shaft */}
          <Rect
            x={WG_RIGHT_X - WG_SHAFT_HW}
            y={WG_PILLAR_TOP + 1}
            width={WG_SHAFT_HW * 2}
            height={WG_PILLAR_BOT - WG_PILLAR_TOP - 1}
            rx={3}
            fill="rgba(251,191,36,0.78)"
          />

          {/* Left pillar base */}
          <Rect
            x={WG_LEFT_X - WG_CAP_HW}
            y={WG_PILLAR_BOT}
            width={WG_CAP_HW * 2}
            height={10}
            rx={2}
            fill="#FBBF24"
          />
          {/* Right pillar base */}
          <Rect
            x={WG_RIGHT_X - WG_CAP_HW}
            y={WG_PILLAR_BOT}
            width={WG_CAP_HW * 2}
            height={10}
            rx={2}
            fill="#FBBF24"
          />

          {/* Om halo circle */}
          <Circle
            cx={WG_CX}
            cy={WG_OM_CY}
            r={16}
            fill="rgba(251,191,36,0.11)"
            stroke="rgba(251,191,36,0.42)"
            strokeWidth={1.5}
          />
        </Svg>

        {/* Om symbol overlay (inside arch) */}
        <View
          style={[
            wlStyles.omWrap,
            { top: WG_OM_CY - 14, left: WG_CX - 14 },
          ]}
        >
          <Text style={wlStyles.omText}>ॐ</Text>
        </View>

        {/* Wisdom Gate label — left of gate */}
        <View
          style={[
            wlStyles.gateLabel,
            { top: WG_ARCH_PEAK - 6, left: 8 },
          ]}
        >
          <Text style={wlStyles.gateStar}>✦</Text>
          <Text style={wlStyles.gateWord}>Wisdom</Text>
          <Text style={wlStyles.gateWord}>Gate</Text>
        </View>

        {/* Lotus nodes */}
        {lotusNodes}
      </View>
    </ScrollView>
    </>
  );
}

// ── World Lotus styles ────────────────────────────────────────────────────────
const wlStyles = StyleSheet.create({
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(103,232,249,0.12)',
  },
  navBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20,50,100,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(103,232,249,0.22)',
  },
  navTitle: {
    flex: 1,
    color: '#FEF3C7',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    fontFamily: Fonts.serif,
    paddingHorizontal: 10,
  },
  navSpacer: { width: 42 },
  scroll: { flex: 1 },
  scrollContent: { alignItems: 'center', paddingBottom: 120 },
  header: { paddingVertical: 18, alignItems: 'center', gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: {
    fontSize: 24,
    color: '#FEF3C7',
    fontFamily: Fonts.serif,
    fontWeight: '700',
  },
  subtitle: {
    color: 'rgba(207,250,254,0.75)',
    fontSize: 13,
    fontWeight: '500',
  },
  progressContainer: { width: '100%', alignItems: 'center', marginTop: 8 },
  progress: { color: 'rgba(165,243,252,0.6)', fontSize: 12, marginBottom: 6 },
  progressBarBg: { width: 160, height: 4, backgroundColor: 'rgba(15,25,50,0.65)', borderRadius: 2 },
  progressBarFill: { height: '100%', backgroundColor: GitaColors.gold, borderRadius: 2 },
  loaderCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingTextMain: { color: '#FEF3C7', fontSize: 16, fontFamily: Fonts.serif, opacity: 0.8 },
  lockedBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: 'rgba(248,113,113,0.2)',
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  lockedBannerText: { color: '#fca5a5', fontSize: 13, fontWeight: '700' },
  pathContainer: { position: 'relative', alignSelf: 'center' },
  pathSvg: { position: 'absolute', top: 0, left: 0 },
  nodeWrap: { position: 'absolute', zIndex: 10 },
  omWrap: {
    position: 'absolute',
    zIndex: 20,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  omText: {
    color: '#FBBF24',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  gateLabel: {
    position: 'absolute',
    zIndex: 20,
    alignItems: 'flex-start',
    gap: 1,
  },
  gateStar: {
    color: 'rgba(251,191,36,0.55)',
    fontSize: 10,
    marginBottom: 1,
  },
  gateWord: {
    color: '#FBBF24',
    fontSize: 13,
    fontWeight: '800',
    fontFamily: Fonts.serif,
    letterSpacing: 0.5,
    lineHeight: 18,
    textShadowColor: 'rgba(251,191,36,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
});

// ── Generic world-path styles ─────────────────────────────────────────────────
function createStyles(theme: Theme) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.background,
    },
    center: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      gap: 16,
    },
    navBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 18,
      paddingBottom: 12,
      backgroundColor: theme.background,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    navButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    navTitle: {
      flex: 1,
      color: theme.text,
      fontSize: 18,
      fontWeight: '900',
      textAlign: 'center',
      letterSpacing: 0,
      paddingHorizontal: 10,
    },
    navSpacer: {
      width: 42,
      height: 42,
    },
    scroll: {
      padding: 18,
      gap: 16,
    },
    hero: {
      borderWidth: 1,
      borderRadius: 24,
      padding: 20,
      alignItems: 'center',
      backgroundColor: theme.card,
      gap: 10,
    },
    heroIcon: {
      width: 58,
      height: 58,
      borderRadius: 29,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 2,
    },
    testPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
      backgroundColor: 'rgba(251,191,36,0.12)',
      borderWidth: 1,
      borderColor: 'rgba(251,191,36,0.22)',
    },
    testPillText: {
      color: GitaColors.gold,
      fontSize: 12,
      fontWeight: '900',
      letterSpacing: 0,
    },
    heroTitle: {
      color: theme.text,
      fontSize: 30,
      lineHeight: 34,
      fontWeight: '900',
      textAlign: 'center',
      letterSpacing: 0,
    },
    heroSubtitle: {
      color: GitaColors.gold,
      fontSize: 15,
      lineHeight: 21,
      fontWeight: '800',
      textAlign: 'center',
      letterSpacing: 0,
    },
    regionText: {
      color: theme.subtext,
      fontSize: 13,
      lineHeight: 19,
      textAlign: 'center',
      fontWeight: '600',
      letterSpacing: 0,
    },
    section: {
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
      padding: 18,
      gap: 12,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 15,
      fontWeight: '900',
      letterSpacing: 0,
    },
    bodyText: {
      color: theme.subtext,
      fontSize: 14,
      lineHeight: 21,
      fontWeight: '600',
      letterSpacing: 0,
    },
    lessonList: {
      gap: 10,
    },
    lessonRow: {
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: theme.card,
    },
    lessonNumber: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(251,191,36,0.08)',
    },
    lessonNumberText: {
      color: theme.textWarm,
      fontSize: 12,
      fontWeight: '900',
      letterSpacing: 0,
    },
    lessonText: {
      flex: 1,
      color: theme.text,
      fontSize: 14,
      lineHeight: 19,
      fontWeight: '700',
      letterSpacing: 0,
    },
    missingTitle: {
      color: theme.text,
      fontSize: 18,
      fontWeight: '900',
      letterSpacing: 0,
    },
    missingButton: {
      borderRadius: 999,
      paddingHorizontal: 18,
      paddingVertical: 10,
      backgroundColor: GitaColors.gold,
    },
    missingButtonText: {
      color: '#111827',
      fontSize: 14,
      fontWeight: '900',
      letterSpacing: 0,
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// MOUNTAIN PATH
// ─────────────────────────────────────────────────────────────────────────────
// TEST_MODE: leaves every shrine unlocked so the UI can be browsed without
// completing the Lotus Path first. Flip to false to enforce gating on
// current_mountain_path_level.
const MP_TEST_MODE = true;

const MP_TOTAL = 23;
const MP_ROW_H = 110;
const MP_PATH_W = 360;
const MP_NODE_R = 44;
const MP_SCALE = 1;
const MP_PATH_H = MP_TOTAL * MP_ROW_H;
const MP_GATE_AREA = 200;

function mpPos(i: number) {
  // Alternate left/right, slight serpentine variance to feel like a winding climb.
  const offset = (i % 4 === 2 ? 30 : i % 4 === 0 ? -10 : 0);
  return {
    cx: i % 2 === 0 ? 80 + offset : 280 - offset,
    cy: i * MP_ROW_H + 60,
  };
}

function buildMpPath() {
  let d = '';
  for (let i = 0; i < MP_TOTAL; i++) {
    const { cx, cy } = mpPos(i);
    d += i === 0 ? `M ${cx} ${cy}` : ` L ${cx} ${cy}`;
  }
  return d;
}

const MP_PATH_D = buildMpPath();
const MP_LAST = mpPos(MP_TOTAL - 1);
const MP_GATE_CX = 180;
const MP_GATE_CY = MP_PATH_H + 90;
const MP_CONTAINER_H = MP_PATH_H + MP_GATE_AREA;

function MountainPathScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#0B1224' }}>
      <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
      <MountainBackground />
      <View style={mpStyles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={mpStyles.navBtn} activeOpacity={0.72}>
          <ArrowLeft size={22} color="#E2E8F0" />
        </TouchableOpacity>
        <Text style={mpStyles.navTitle}>The Mountain Path</Text>
        <View style={mpStyles.navSpacer} />
      </View>
      <MountainPathContent />
    </View>
  );
}

// Soft mountain silhouette backdrop — three layers of triangles for depth,
// over a deep blue gradient sky.
function MountainBackground() {
  return (
    <View pointerEvents="none" style={mpStyles.bgAbsolute}>
      <LinearGradient
        colors={['#1E3A5F', '#1E2A4A', '#0B1224']}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      <Svg width="100%" height="100%" viewBox="0 0 400 900" preserveAspectRatio="xMidYMid slice" style={StyleSheet.absoluteFill}>
        {/* Distant mountains */}
        <Polygon points="-20,440 60,300 140,400 220,280 320,410 420,340 420,900 -20,900" fill="#283C5C" opacity={0.65} />
        {/* Mid mountains */}
        <Polygon points="-20,560 50,440 130,520 200,380 280,500 360,420 420,520 420,900 -20,900" fill="#1E2F4D" opacity={0.85} />
        {/* Snow caps mid */}
        <Polygon points="40,460 50,440 70,470" fill="#E2E8F0" opacity={0.7} />
        <Polygon points="190,400 200,380 218,408" fill="#E2E8F0" opacity={0.7} />
        <Polygon points="350,440 360,420 378,448" fill="#E2E8F0" opacity={0.7} />
        {/* Near mountains */}
        <Polygon points="-20,700 80,580 180,680 260,540 340,660 420,600 420,900 -20,900" fill="#152339" opacity={0.95} />
        {/* Snow caps near */}
        <Polygon points="68,600 80,580 100,610" fill="#F1F5F9" opacity={0.85} />
        <Polygon points="248,560 260,540 280,572" fill="#F1F5F9" opacity={0.85} />
      </Svg>

      {/* Stars */}
      {STAR_DOTS.map((s, i) => (
        <View
          key={`mp-star-${i}`}
          style={[
            mpStyles.star,
            { top: s.top, left: s.left, width: s.size, height: s.size, borderRadius: s.size / 2, opacity: s.opacity },
          ]}
        />
      ))}
    </View>
  );
}

const STAR_DOTS = [
  { top: '4%', left: '12%', size: 1.4, opacity: 0.6 },
  { top: '7%', left: '34%', size: 1.8, opacity: 0.7 },
  { top: '5%', left: '58%', size: 1.2, opacity: 0.5 },
  { top: '9%', left: '78%', size: 1.6, opacity: 0.65 },
  { top: '12%', left: '20%', size: 1, opacity: 0.45 },
  { top: '15%', left: '88%', size: 1.3, opacity: 0.55 },
  { top: '18%', left: '46%', size: 1.1, opacity: 0.5 },
  { top: '22%', left: '8%', size: 1.4, opacity: 0.6 },
  { top: '25%', left: '70%', size: 1.2, opacity: 0.5 },
] as const;

function MountainPathContent() {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [allLevels, setAllLevels] = useState<MountainLevelData[]>([]);
  const [lockedMessage, setLockedMessage] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const refreshProgress = useCallback(async () => {
    const next = await fetchCurrentMountainLevel();
    setCurrentLevel(next);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const levels = await fetchMountainLevels();
        setAllLevels(levels);
      } catch (err) {
        console.error('Failed to fetch mountain levels:', err);
      }
    })();
    refreshProgress();
    const sub = DeviceEventEmitter.addListener(STREAK_UPDATED_EVENT, refreshProgress);
    return () => sub.remove();
  }, [refreshProgress]);

  useFocusEffect(useCallback(() => { refreshProgress(); }, [refreshProgress]));

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => setReady(true));
    return () => task.cancel();
  }, []);

  const showLockedMessage = (message: string) => {
    setLockedMessage(message);
    setTimeout(() => setLockedMessage(null), 1600);
  };

  // Effective unlock cap — TEST_MODE opens everything.
  const effectiveCurrent = MP_TEST_MODE ? MP_TOTAL + 1 : currentLevel;

  const handleLevelPress = useCallback(
    (level: number) => {
      if (!MP_TEST_MODE && level > currentLevel) {
        showLockedMessage('Complete previous levels first!');
        return;
      }
      const found = allLevels.some((l) => l.level_number === level);
      if (!found) {
        showLockedMessage('Level coming soon!');
        return;
      }
      router.push({ pathname: '/mountain-level/[id]', params: { id: level } });
    },
    [currentLevel, allLevels],
  );

  const shrineNodes = useMemo(() => {
    if (!ready || allLevels.length === 0) return null;
    return Array.from({ length: MP_TOTAL }, (_, index) => {
      const level = index + 1;
      const { cx, cy } = mpPos(index);
      const isCompleted = level < effectiveCurrent && !MP_TEST_MODE;
      const isUnlocked = level <= effectiveCurrent;
      const available = allLevels.some((l) => l.level_number === level);
      return (
        <View
          key={level}
          style={[
            mpStyles.nodeWrap,
            { left: cx - MP_NODE_R, top: cy - MP_NODE_R, transform: [{ scale: MP_SCALE }] },
          ]}
        >
          <MountainShrine
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
  }, [effectiveCurrent, allLevels, handleLevelPress, ready]);

  const gateAvailable = allLevels.some((l) => l.level_number === 24);
  const gateUnlocked = MP_TEST_MODE || currentLevel >= MP_TOTAL + 1;

  if (!ready || allLevels.length === 0) {
    return (
      <View style={mpStyles.loaderCenter}>
        <LotusLoader size={110} color="#E2E8F0" />
        <Text style={mpStyles.loadingTextMain}>Ascending the Mountain Path...</Text>
      </View>
    );
  }

  return (
    <>
      {lockedMessage && (
        <View style={mpStyles.lockedBanner}>
          <Text style={mpStyles.lockedBannerText}>{lockedMessage}</Text>
        </View>
      )}
      <ScrollView
        style={mpStyles.scroll}
        contentContainerStyle={mpStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={mpStyles.header}>
          <View style={mpStyles.titleRow}>
            <Svg width={26} height={26} viewBox="0 0 24 24">
              <Polygon points="3,21 9,9 13,15 17,7 21,21" fill={GitaColors.gold} />
              <Polygon points="9,9 12,12 13,15" fill="#FFFFFF" opacity={0.85} />
              <Polygon points="17,7 19,11 21,21 20,21" fill="#FFFFFF" opacity={0.85} />
            </Svg>
            <Text style={mpStyles.title}>The Mountain Path</Text>
          </View>
          <Text style={mpStyles.subtitle}>{MP_TOTAL} milestones toward self-realization</Text>
          {!MP_TEST_MODE && (
            <View style={mpStyles.progressContainer}>
              <Text style={mpStyles.progress}>Climb {Math.min(currentLevel, MP_TOTAL)} of {MP_TOTAL}</Text>
              <View style={mpStyles.progressBarBg}>
                <View
                  style={[
                    mpStyles.progressBarFill,
                    { width: `${(Math.min(currentLevel - 1, MP_TOTAL) / MP_TOTAL) * 100}%` },
                  ]}
                />
              </View>
            </View>
          )}
          {MP_TEST_MODE && (
            <View style={mpStyles.testBadge}>
              <Sparkles size={12} color={GitaColors.gold} />
              <Text style={mpStyles.testBadgeText}>Test mode — all levels unlocked</Text>
            </View>
          )}
        </View>

        <View style={[mpStyles.pathContainer, { width: MP_PATH_W, height: MP_CONTAINER_H }]}>
          <Svg width={MP_PATH_W} height={MP_CONTAINER_H} style={mpStyles.pathSvg}>
            {/* Stone path — wide grey-brown base */}
            <SvgPath
              d={MP_PATH_D}
              stroke="#475569"
              strokeWidth="20"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Inner highlight (stone bevel) */}
            <SvgPath
              d={MP_PATH_D}
              stroke="#94A3B8"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.55}
            />
            {/* Snow trail on top */}
            <SvgPath
              d={MP_PATH_D}
              stroke="#E2E8F0"
              strokeWidth="1.4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="6 8"
              opacity={0.6}
            />

            {/* Dashed gold connector to Wisdom Gate */}
            <SvgPath
              d={`M ${MP_LAST.cx} ${MP_LAST.cy} L ${MP_GATE_CX} ${MP_GATE_CY - 30}`}
              stroke="rgba(251,191,36,0.5)"
              strokeWidth="3.5"
              fill="none"
              strokeDasharray="7 5"
              strokeLinecap="round"
            />

            {/* Wisdom Gate platform (mountain summit) */}
            <Polygon
              points={`${MP_GATE_CX - 60},${MP_GATE_CY + 30} ${MP_GATE_CX - 25},${MP_GATE_CY - 20} ${MP_GATE_CX + 25},${MP_GATE_CY - 25} ${MP_GATE_CX + 60},${MP_GATE_CY + 30}`}
              fill="#1E293B"
              stroke="#475569"
              strokeWidth={1.5}
            />
            <Polygon
              points={`${MP_GATE_CX - 25},${MP_GATE_CY - 20} ${MP_GATE_CX - 10},${MP_GATE_CY - 28} ${MP_GATE_CX + 25},${MP_GATE_CY - 25}`}
              fill="#F1F5F9"
              opacity={0.9}
            />
          </Svg>

          {/* Wisdom Gate shrine (id 24) overlay */}
          {gateAvailable && (
            <View
              style={[
                mpStyles.nodeWrap,
                {
                  left: MP_GATE_CX - 40,
                  top: MP_GATE_CY - 70,
                },
              ]}
            >
              <MountainShrine
                level={24}
                isCompleted={false}
                isLocked={!gateUnlocked}
                isActive={gateUnlocked}
                isWisdomGate
                allowPressWhenLocked
                onPress={handleLevelPress}
              />
            </View>
          )}

          {/* Wisdom Gate label */}
          <View
            style={[
              mpStyles.gateLabel,
              { top: MP_GATE_CY - 18, left: MP_GATE_CX + 50 },
            ]}
          >
            <Text style={mpStyles.gateStar}>✦</Text>
            <Text style={mpStyles.gateWord}>Wisdom</Text>
            <Text style={mpStyles.gateWord}>Gate</Text>
          </View>

          {/* Shrines along path */}
          {shrineNodes}
        </View>
      </ScrollView>
    </>
  );
}

const mpStyles = StyleSheet.create({
  bgAbsolute: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  star: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 52,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226,232,240,0.10)',
    backgroundColor: 'rgba(11,18,36,0.55)',
    zIndex: 5,
  },
  navBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30,58,95,0.65)',
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.20)',
  },
  navTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    fontFamily: Fonts.serif,
    paddingHorizontal: 10,
  },
  navSpacer: { width: 42 },
  scroll: { flex: 1 },
  scrollContent: { alignItems: 'center', paddingBottom: 140 },
  header: { paddingVertical: 22, alignItems: 'center', gap: 6 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: {
    fontSize: 26,
    color: '#FFFFFF',
    fontFamily: Fonts.serif,
    fontWeight: '800',
  },
  subtitle: {
    color: 'rgba(226,232,240,0.78)',
    fontSize: 13,
    fontWeight: '500',
  },
  progressContainer: { width: '100%', alignItems: 'center', marginTop: 10 },
  progress: { color: 'rgba(226,232,240,0.6)', fontSize: 12, marginBottom: 6 },
  progressBarBg: { width: 180, height: 4, backgroundColor: 'rgba(30,58,95,0.65)', borderRadius: 2 },
  progressBarFill: { height: '100%', backgroundColor: GitaColors.gold, borderRadius: 2 },
  testBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(251,191,36,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.30)',
  },
  testBadgeText: {
    color: GitaColors.gold,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  loaderCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingTextMain: { color: '#E2E8F0', fontSize: 16, fontFamily: Fonts.serif, opacity: 0.85 },
  lockedBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: 'rgba(248,113,113,0.2)',
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  lockedBannerText: { color: '#fca5a5', fontSize: 13, fontWeight: '700' },
  pathContainer: { position: 'relative', alignSelf: 'center' },
  pathSvg: { position: 'absolute', top: 0, left: 0 },
  nodeWrap: { position: 'absolute', zIndex: 10 },
  gateLabel: {
    position: 'absolute',
    zIndex: 20,
    alignItems: 'flex-start',
    gap: 1,
  },
  gateStar: {
    color: 'rgba(251,191,36,0.55)',
    fontSize: 10,
    marginBottom: 1,
  },
  gateWord: {
    color: '#FBBF24',
    fontSize: 13,
    fontWeight: '800',
    fontFamily: Fonts.serif,
    letterSpacing: 0.5,
    lineHeight: 18,
    textShadowColor: 'rgba(251,191,36,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
});
