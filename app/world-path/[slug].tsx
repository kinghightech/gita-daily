import LearnBackground from '@/components/LearnBackground';
import LotusLevel from '@/components/learning/LotusLevel';
import MountainShrine from '@/components/learning/MountainShrine';
import SunflowerLevel from '@/components/learning/SunflowerLevel';
import TempleTileLevel from '@/components/learning/TempleTileLevel';
import WoodSliceLevel from '@/components/learning/WoodSliceLevel';
import LotusLoader from '@/components/ui/LotusLoader';
import { Fonts, GitaColors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import {
  fetchCurrentMountainLevel,
  fetchMountainLevels,
  type MountainLevelData,
} from '@/lib/mountainPath';
import { STREAK_UPDATED_EVENT } from '@/lib/profile';
import {
  fetchCurrentWorldLotusLevel,
  fetchWorldLotusLevels,
  type WorldLotusLevelData,
} from '@/lib/worldLotus';
import { getWorldPathBySlug } from '@/lib/worldPaths';
import type { Theme } from '@/theme/colors';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, BookOpen, ChevronRight, Flower2, Leaf, MapPin, Sparkles } from 'lucide-react-native';
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
import Svg, { Circle, Ellipse, Polygon, Rect, Path as SvgPath } from 'react-native-svg';

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

const GP_TOTAL = 24;
const GP_ROW_H = 108;
const GP_PATH_W = 360;
const GP_NODE_R = WL_NODE_R;
const GP_SCALE = WL_SCALE;
const GP_TOP_PAD = 92;
const GP_PATH_H = GP_TOP_PAD + (GP_TOTAL - 1) * GP_ROW_H + 104;
const GP_CONTAINER_H = GP_PATH_H + 40;

function gpPos(i: number) {
  const side = i % 2 === 0 ? -1 : 1;
  const wave = Math.sin(i * 0.82) * 12;
  const spread = 76 + (i % 4 === 0 ? 14 : 0);
  return {
    cx: Math.round(180 + side * spread + wave),
    cy: GP_TOP_PAD + i * GP_ROW_H,
  };
}

function buildGpPathD() {
  let d = '';
  for (let i = 0; i < GP_TOTAL; i++) {
    const { cx, cy } = gpPos(i);
    d += i === 0 ? `M ${cx} ${cy}` : ` L ${cx} ${cy}`;
  }
  return d;
}

const GP_PATH_D = buildGpPathD();
const GP_ACTIVE_LEVEL = 1;

const GP_GRASS_TUFTS = [
  { left: '-2%', bottom: -10, scale: 1.08, flip: false },
  { left: '7%', bottom: 0, scale: 0.9, flip: true },
  { left: '17%', bottom: -14, scale: 1.2, flip: false },
  { left: '29%', bottom: -2, scale: 0.95, flip: true },
  { left: '41%', bottom: -12, scale: 1.16, flip: false },
  { left: '54%', bottom: 2, scale: 0.96, flip: true },
  { left: '66%', bottom: -10, scale: 1.2, flip: false },
  { left: '79%', bottom: -1, scale: 0.92, flip: true },
  { left: '90%', bottom: -12, scale: 1.12, flip: false },
] as const;

const GP_BUTTERFLIES = [
  { top: 116, left: '12%', color: '#FDE68A', accent: '#F59E0B', delay: 0, duration: 7600, range: 42 },
  { top: 218, left: '70%', color: '#F9A8D4', accent: '#DB2777', delay: 1200, duration: 8400, range: 54 },
  { top: 360, left: '30%', color: '#BFDBFE', accent: '#2563EB', delay: 2200, duration: 9200, range: 48 },
] as const;

const GP_FLOWER_PATCHES = [
  { top: 158, left: 22, color: '#F9A8D4', accent: '#FDE68A', flip: false },
  { top: 312, left: 286, color: '#C4B5FD', accent: '#FEF3C7', flip: true },
  { top: 546, left: 34, color: '#FCA5A5', accent: '#FDE68A', flip: false },
  { top: 760, left: 292, color: '#93C5FD', accent: '#FEF3C7', flip: true },
  { top: 1014, left: 16, color: '#FDBA74', accent: '#FEF3C7', flip: false },
  { top: 1232, left: 294, color: '#F0ABFC', accent: '#FDE68A', flip: true },
  { top: 1488, left: 30, color: '#A7F3D0', accent: '#FEF3C7', flip: false },
  { top: 1724, left: 288, color: '#F9A8D4', accent: '#FDE68A', flip: true },
  { top: 2004, left: 22, color: '#C4B5FD', accent: '#FEF3C7', flip: false },
  { top: 2260, left: 296, color: '#FDBA74', accent: '#FEF3C7', flip: true },
] as const;

const FP_TOTAL = 24;
const FP_CURRENT_LEVEL = 1;
const FP_ROW_H = 124;
const FP_PATH_W = 360;
const FP_NODE_R = 48;
const FP_SCALE = 1.08;
const FP_TOP_PAD = 104;
const FP_PATH_H = FP_TOP_PAD + (FP_TOTAL - 1) * FP_ROW_H + 122;
const FP_CONTAINER_H = FP_PATH_H + 50;

function fpPos(i: number) {
  const side = i % 2 === 0 ? -1 : 1;
  const wave = Math.round(Math.sin(i * 0.74) * 7);
  return {
    cx: 180 + side * 80 + wave,
    cy: FP_TOP_PAD + i * FP_ROW_H,
  };
}

function buildFpPathD(count = FP_TOTAL) {
  const capped = Math.max(0, Math.min(count, FP_TOTAL));
  if (capped === 0) return '';
  let d = '';
  for (let i = 0; i < capped; i++) {
    const { cx, cy } = fpPos(i);
    d += i === 0 ? `M ${cx} ${cy}` : ` L ${cx} ${cy}`;
  }
  return d;
}

const FP_PATH_D = buildFpPathD();
const FP_COMPLETED_PATH_D = buildFpPathD(FP_CURRENT_LEVEL);

const FP_BACKGROUND_TREES = [
  { top: 48, left: -28, scale: 1.1, opacity: 0.5, tone: 'deep' },
  { top: 72, right: -26, scale: 0.96, opacity: 0.42, tone: 'soft' },
  { top: 172, left: -42, scale: 0.9, opacity: 0.38, tone: 'soft' },
  { top: 214, right: -34, scale: 1.08, opacity: 0.46, tone: 'deep' },
  { top: 352, left: -30, scale: 1, opacity: 0.36, tone: 'deep' },
  { top: 410, right: -42, scale: 0.88, opacity: 0.34, tone: 'soft' },
  { top: 570, left: -46, scale: 1.04, opacity: 0.34, tone: 'soft' },
  { top: 628, right: -24, scale: 1.14, opacity: 0.38, tone: 'deep' },
  { top: 742, left: -28, scale: 0.92, opacity: 0.3, tone: 'deep' },
  { top: 784, right: -44, scale: 0.96, opacity: 0.28, tone: 'soft' },
] as const;

const FP_FLOATING_LEAVES = [
  { top: 118, left: 26, rotate: '-24deg', scale: 0.88, color: '#D6A061' },
  { top: 184, right: 28, rotate: '32deg', scale: 0.78, color: '#86EFAC' },
  { top: 338, left: 18, rotate: '18deg', scale: 0.72, color: '#A3E635' },
  { top: 420, right: 22, rotate: '-36deg', scale: 0.86, color: '#FBBF24' },
  { top: 690, left: 28, rotate: '-8deg', scale: 0.76, color: '#BBF7D0' },
  { top: 742, right: 18, rotate: '28deg', scale: 0.82, color: '#D6A061' },
] as const;

const TP_TOTAL = 20;
const TP_CURRENT_LEVEL = 1;
const TP_ROW_H = WL_ROW_H;
const TP_PATH_W = WL_PATH_W;
const TP_NODE_R = WL_NODE_R;
const TP_SCALE = WL_SCALE;
const TP_PATH_H = TP_TOTAL * TP_ROW_H;
const TP_CONTAINER_H = TP_PATH_H;

function tpPos(i: number) {
  return { cx: i % 2 === 0 ? 70 : 270, cy: i * TP_ROW_H + 50 };
}

function buildTpPathD(count = TP_TOTAL) {
  const capped = Math.max(0, Math.min(count, TP_TOTAL));
  if (capped === 0) return '';
  let d = '';
  for (let i = 0; i < capped; i++) {
    const { cx, cy } = tpPos(i);
    d += i === 0 ? `M ${cx} ${cy}` : ` L ${cx} ${cy}`;
  }
  return d;
}

const TP_PATH_D = buildTpPathD();
const TP_COMPLETED_PATH_D = buildTpPathD(TP_CURRENT_LEVEL);

const TP_BG_DIYAS = [
  { x: 42, y: 258, scale: 0.78 },
  { x: 358, y: 312, scale: 0.7 },
  { x: 36, y: 612, scale: 0.62 },
  { x: 364, y: 740, scale: 0.66 },
] as const;

const TP_BG_RANGOLIS = [
  { x: 44, y: 422, scale: 0.72, opacity: 0.2 },
  { x: 356, y: 522, scale: 0.62, opacity: 0.16 },
] as const;

const TP_BG_PARTICLES = [
  { left: '15%', top: '24%', size: 5, delay: 0 },
  { left: '82%', top: '31%', size: 4, delay: 0.2 },
  { left: '9%', top: '58%', size: 4, delay: 0.48 },
  { left: '88%', top: '67%', size: 5, delay: 0.68 },
] as const;

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

  if (slug === 'garden') {
    return <GardenPathScreen />;
  }

  if (slug === 'forest') {
    return <ForestPathScreen />;
  }

  if (slug === 'temple') {
    return <TemplePathScreen />;
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

  const refreshProgress = useCallback(async () => {
    const next = await fetchCurrentWorldLotusLevel();
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
  const dashOffsetValue = totalSegmentLength - progressCount * WL_SEGMENT_LENGTH;

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

          {/* Green progress track */}
          <SvgPath
            d={WL_PATH_D}
            stroke="#22c55e"
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${totalSegmentLength} ${totalSegmentLength}`}
            strokeDashoffset={dashOffsetValue}
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

        {/* Wisdom Gate state pill — under the gate */}
        {currentLevel > 21 ? (
          <View
            style={[
              wlStyles.gatePillPassed,
              { top: WG_PILLAR_BOT + 18, left: WG_CX - 50 },
            ]}
            pointerEvents="none"
          >
            <Text style={wlStyles.gatePillPassedText}>✓ PASSED</Text>
          </View>
        ) : currentLevel === 21 ? (
          <View
            style={[
              wlStyles.gatePillActive,
              { top: WG_PILLAR_BOT + 18, left: WG_CX - 60 },
            ]}
            pointerEvents="none"
          >
            <Text style={wlStyles.gatePillActiveText}>TAP TO ENTER</Text>
          </View>
        ) : (
          <View
            style={[
              wlStyles.gatePillLocked,
              { top: WG_PILLAR_BOT + 18, left: WG_CX - 36 },
            ]}
            pointerEvents="none"
          >
            <Text style={wlStyles.gatePillLockedText}>LOCKED</Text>
          </View>
        )}

        {/* Wisdom Gate tap target — covers pillars + arch */}
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => handleLevelPress(21)}
          style={[
            wlStyles.gateTouch,
            {
              top: WG_ARCH_PEAK - 12,
              left: WG_LEFT_X - WG_CAP_HW - 18,
              width: WG_RIGHT_X + WG_CAP_HW + 18 - (WG_LEFT_X - WG_CAP_HW - 18),
              height: WG_PILLAR_BOT + 12 - (WG_ARCH_PEAK - 12),
            },
          ]}
        />
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
  gateTouch: {
    position: 'absolute',
    zIndex: 15,
  },
  gatePillActive: {
    position: 'absolute',
    zIndex: 18,
    width: 120,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(251,191,36,0.20)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.55)',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  gatePillActiveText: {
    color: '#FBBF24',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  gatePillPassed: {
    position: 'absolute',
    zIndex: 18,
    width: 100,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(34,197,94,0.18)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.55)',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  gatePillPassedText: {
    color: '#22C55E',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  gatePillLocked: {
    position: 'absolute',
    zIndex: 18,
    width: 72,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15,25,50,0.65)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  gatePillLockedText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
});

// GARDEN PATH
function GardenPathScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={gpStyles.root}>
      <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
      <GardenBackground />
      <View style={[gpStyles.navBar, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={gpStyles.navBtn} activeOpacity={0.72}>
          <ArrowLeft size={22} color="#ECFDF5" />
        </TouchableOpacity>
        <Text style={gpStyles.navTitle}> </Text>
        <View style={gpStyles.navSpacer} />
      </View>
      <GardenPathContent />
    </View>
  );
}

function GardenPathContent() {
  const [message, setMessage] = useState<string | null>(null);
  const messageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (messageTimerRef.current) {
        clearTimeout(messageTimerRef.current);
      }
    };
  }, []);

  const showComingSoon = useCallback(() => {
    if (messageTimerRef.current) {
      clearTimeout(messageTimerRef.current);
    }
    setMessage('Garden lessons coming soon.');
    messageTimerRef.current = setTimeout(() => setMessage(null), 1500);
  }, []);

  const sunflowerNodes = useMemo(() => (
    Array.from({ length: GP_TOTAL }, (_, index) => {
      const level = index + 1;
      const { cx, cy } = gpPos(index);
      return (
        <View
          key={level}
          style={[
            gpStyles.nodeWrap,
            { left: cx - GP_NODE_R, top: cy - GP_NODE_R, transform: [{ scale: GP_SCALE }] },
          ]}
        >
          <SunflowerLevel
            level={level}
            isCompleted={false}
            isLocked={false}
            isActive={level === GP_ACTIVE_LEVEL}
            onPress={showComingSoon}
          />
        </View>
      );
    })
  ), [showComingSoon]);

  return (
    <>
      {message && (
        <View style={gpStyles.lockedBanner}>
          <Text style={gpStyles.lockedBannerText}>{message}</Text>
        </View>
      )}
      <ScrollView
        style={gpStyles.scroll}
        contentContainerStyle={gpStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={gpStyles.header}>
          <View style={gpStyles.titleRow}>
            <Flower2 size={24} color="#FDE68A" />
            <Text style={gpStyles.title}>The Garden Path</Text>
          </View>
          <Text style={gpStyles.subtitle}>Karma, dharma, samsara, moksha</Text>
          <View style={gpStyles.progressContainer}>
            <Text style={gpStyles.progress}>Bloom {GP_ACTIVE_LEVEL} of {GP_TOTAL}</Text>
            <View style={gpStyles.progressBarBg}>
              <View style={[gpStyles.progressBarFill, { width: `${(GP_ACTIVE_LEVEL / GP_TOTAL) * 100}%` }]} />
            </View>
          </View>
        </View>

        <View style={[gpStyles.pathContainer, { width: GP_PATH_W, height: GP_CONTAINER_H }]}>
          <Svg width={GP_PATH_W} height={GP_CONTAINER_H} style={gpStyles.pathSvg}>
            <SvgPath
              d="M 26 140 C 118 108 230 114 334 82"
              stroke="rgba(236,253,245,0.14)"
              strokeWidth={2}
              strokeLinecap="round"
              fill="none"
            />
            <SvgPath
              d={`M 12 ${GP_CONTAINER_H - 260} C 96 ${GP_CONTAINER_H - 306} 224 ${GP_CONTAINER_H - 206} 348 ${GP_CONTAINER_H - 254}`}
              stroke="rgba(253,230,138,0.16)"
              strokeWidth={2}
              strokeLinecap="round"
              fill="none"
            />
            <SvgPath
              d={GP_PATH_D}
              stroke="#22C55E"
              strokeWidth={7}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>

          {GP_FLOWER_PATCHES.map((patch, index) => (
            <GardenFlowerPatch
              key={`gp-flower-patch-${index}`}
              top={patch.top}
              left={patch.left}
              color={patch.color}
              accent={patch.accent}
              flip={patch.flip}
            />
          ))}

          {sunflowerNodes}
        </View>
      </ScrollView>
    </>
  );
}

function GardenBackground() {
  const sway = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sway, {
          toValue: 1,
          duration: 2300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(sway, {
          toValue: 0,
          duration: 2300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [sway]);

  const rotateA = sway.interpolate({
    inputRange: [0, 1],
    outputRange: ['-4deg', '4deg'],
  });
  const rotateB = sway.interpolate({
    inputRange: [0, 1],
    outputRange: ['3deg', '-3deg'],
  });

  return (
    <View pointerEvents="none" style={gpStyles.bgAbsolute}>
      <LinearGradient
        colors={['#14532D', '#166534', '#15803D', '#064E3B']}
        locations={[0, 0.34, 0.72, 1]}
        style={StyleSheet.absoluteFill}
      />
      <Svg width="100%" height="100%" viewBox="0 0 400 900" preserveAspectRatio="xMidYMid slice" style={StyleSheet.absoluteFill}>
        <Circle cx={338} cy={92} r={34} fill="#FDE68A" opacity={0.26} />
        <Circle cx={338} cy={92} r={20} fill="#FEF3C7" opacity={0.18} />
        <SvgPath d="M -30 224 C 64 186 128 232 214 198 C 294 166 344 188 430 150 L 430 900 L -30 900 Z" fill="#16A34A" opacity={0.22} />
        <SvgPath d="M -30 332 C 82 274 160 350 246 302 C 324 258 366 296 430 270 L 430 900 L -30 900 Z" fill="#22C55E" opacity={0.16} />
        <SvgPath d="M -40 498 C 64 440 160 530 260 470 C 326 430 374 456 440 420 L 440 900 L -40 900 Z" fill="#052E16" opacity={0.18} />
        <SvgPath d="M -30 640 C 78 584 140 662 242 612 C 324 572 368 604 430 574" stroke="#BBF7D0" strokeWidth={2} opacity={0.1} fill="none" />
      </Svg>

      {GP_GRASS_TUFTS.map((tuft, index) => (
        <GrassTuft
          key={`gp-grass-${index}`}
          left={tuft.left}
          bottom={tuft.bottom}
          scale={tuft.scale}
          flip={tuft.flip}
          rotate={index % 2 === 0 ? rotateA : rotateB}
        />
      ))}

      {GP_BUTTERFLIES.map((butterfly, index) => (
        <GardenButterfly
          key={`gp-butterfly-${index}`}
          top={butterfly.top}
          left={butterfly.left}
          color={butterfly.color}
          accent={butterfly.accent}
          delay={butterfly.delay}
          duration={butterfly.duration}
          range={butterfly.range}
        />
      ))}
    </View>
  );
}

function GrassTuft({
  left,
  bottom,
  scale,
  flip,
  rotate,
}: {
  left: `${number}%`;
  bottom: number;
  scale: number;
  flip: boolean;
  rotate: ReturnType<Animated.Value['interpolate']>;
}) {
  return (
    <Animated.View
      style={[
        gpStyles.grassTuft,
        {
          left,
          bottom,
          transform: [
            { rotate },
            { scale },
            { scaleX: flip ? -1 : 1 },
          ],
        },
      ]}
    >
      <Svg width={54} height={82} viewBox="0 0 54 82">
        <SvgPath d="M 28 80 C 25 56 19 34 8 10" stroke="#86EFAC" strokeWidth={3.2} strokeLinecap="round" fill="none" />
        <SvgPath d="M 28 80 C 29 54 31 30 40 6" stroke="#4ADE80" strokeWidth={3.4} strokeLinecap="round" fill="none" />
        <SvgPath d="M 27 80 C 20 60 10 48 2 34" stroke="#22C55E" strokeWidth={3} strokeLinecap="round" fill="none" />
        <SvgPath d="M 29 80 C 38 62 45 48 52 26" stroke="#BBF7D0" strokeWidth={2.4} strokeLinecap="round" fill="none" />
        <SvgPath d="M 28 80 C 28 58 26 36 26 14" stroke="#A7F3D0" strokeWidth={2.6} strokeLinecap="round" fill="none" />
      </Svg>
    </Animated.View>
  );
}

function GardenButterfly({
  top,
  left,
  color,
  accent,
  delay,
  duration,
  range,
}: {
  top: number;
  left: `${number}%`;
  color: string;
  accent: string;
  delay: number;
  duration: number;
  range: number;
}) {
  const flight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    flight.setValue(0);
    const loop = Animated.loop(
      Animated.timing(flight, {
        toValue: 1,
        duration,
        delay,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [delay, duration, flight]);

  const translateX = flight.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [-range, range, -range],
  });
  const translateY = flight.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0, -18, 4, -12, 0],
  });
  const rotate = flight.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['-7deg', '9deg', '-7deg'],
  });
  const flutterScale = flight.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.96, 1.08, 0.96],
  });

  return (
    <Animated.View
      style={[
        gpStyles.butterfly,
        {
          top,
          left,
          transform: [
            { translateX },
            { translateY },
            { rotate },
            { scale: flutterScale },
          ],
        },
      ]}
    >
      <Svg width={44} height={36} viewBox="0 0 44 36">
        <Ellipse cx={16} cy={13} rx={8} ry={11} fill={color} opacity={0.94} transform="rotate(-28 16 13)" />
        <Ellipse cx={28} cy={13} rx={8} ry={11} fill={color} opacity={0.94} transform="rotate(28 28 13)" />
        <Ellipse cx={17} cy={24} rx={6} ry={8} fill={accent} opacity={0.84} transform="rotate(26 17 24)" />
        <Ellipse cx={27} cy={24} rx={6} ry={8} fill={accent} opacity={0.84} transform="rotate(-26 27 24)" />
        <SvgPath d="M 22 9 C 20 15 20 22 22 29 C 24 22 24 15 22 9 Z" fill="#3F2A14" opacity={0.86} />
        <SvgPath d="M 21 10 C 18 6 15 5 12 4" stroke="#3F2A14" strokeWidth={1.2} strokeLinecap="round" fill="none" />
        <SvgPath d="M 23 10 C 26 6 29 5 32 4" stroke="#3F2A14" strokeWidth={1.2} strokeLinecap="round" fill="none" />
      </Svg>
    </Animated.View>
  );
}

function GardenFlowerPatch({
  top,
  left,
  color,
  accent,
  flip,
}: {
  top: number;
  left: number;
  color: string;
  accent: string;
  flip: boolean;
}) {
  return (
    <View
      pointerEvents="none"
      style={[
        gpStyles.flowerPatch,
        { top, left, transform: [{ scaleX: flip ? -1 : 1 }] },
      ]}
    >
      <Svg width={58} height={50} viewBox="0 0 58 50">
        <SvgPath d="M 16 47 C 16 36 17 27 21 19" stroke="#166534" strokeWidth={2.2} strokeLinecap="round" fill="none" />
        <SvgPath d="M 36 48 C 35 37 35 29 31 20" stroke="#15803D" strokeWidth={2.2} strokeLinecap="round" fill="none" />
        <SvgPath d="M 19 36 C 9 32 7 39 12 44 C 17 43 20 40 19 36 Z" fill="#22C55E" opacity={0.9} />
        <SvgPath d="M 34 37 C 44 32 48 39 42 45 C 37 44 34 41 34 37 Z" fill="#4ADE80" opacity={0.84} />
        <Ellipse cx={21} cy={17} rx={5.2} ry={8} fill={color} transform="rotate(-24 21 17)" />
        <Ellipse cx={21} cy={17} rx={5.2} ry={8} fill={color} transform="rotate(34 21 17)" />
        <Ellipse cx={21} cy={17} rx={5.2} ry={8} fill={color} transform="rotate(94 21 17)" />
        <Circle cx={21} cy={17} r={4.2} fill={accent} />
        <Ellipse cx={31} cy={18} rx={4.8} ry={7.2} fill={color} opacity={0.92} transform="rotate(-18 31 18)" />
        <Ellipse cx={31} cy={18} rx={4.8} ry={7.2} fill={color} opacity={0.92} transform="rotate(44 31 18)" />
        <Ellipse cx={31} cy={18} rx={4.8} ry={7.2} fill={color} opacity={0.92} transform="rotate(108 31 18)" />
        <Circle cx={31} cy={18} r={3.6} fill={accent} />
      </Svg>
    </View>
  );
}

const gpStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#064E3B',
  },
  bgAbsolute: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  backgroundImage: {
    opacity: 1,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 0,
    backgroundColor: 'transparent',
    zIndex: 5,
  },
  navBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(6,78,59,0.58)',
    borderWidth: 1,
    borderColor: 'rgba(187,247,208,0.32)',
  },
  navTitle: {
    flex: 1,
    color: '#ECFDF5',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    fontFamily: Fonts.serif,
    paddingHorizontal: 10,
  },
  navSpacer: { width: 42 },
  scroll: {
    flex: 1,
    zIndex: 2,
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 136,
  },
  header: {
    paddingTop: 4,
    paddingBottom: 16,
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 27,
    color: '#FEF3C7',
    fontFamily: Fonts.serif,
    fontWeight: '800',
    textShadowColor: 'rgba(20,83,45,0.92)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  subtitle: {
    color: 'rgba(220,252,231,0.84)',
    fontSize: 14,
    fontWeight: '700',
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  progress: {
    color: 'rgba(236,253,245,0.72)',
    fontSize: 12,
    marginBottom: 6,
    fontWeight: '700',
  },
  progressBarBg: {
    width: 180,
    height: 4,
    backgroundColor: 'rgba(5,46,22,0.5)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FDE68A',
    borderRadius: 2,
  },
  lockedBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: 'rgba(20,83,45,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(253,230,138,0.42)',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    zIndex: 8,
  },
  lockedBannerText: {
    color: '#FEF3C7',
    fontSize: 13,
    fontWeight: '800',
  },
  pathContainer: {
    position: 'relative',
    alignSelf: 'center',
    marginTop: 2,
  },
  pathSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  nodeWrap: {
    position: 'absolute',
    zIndex: 12,
  },
  flowerPatch: {
    position: 'absolute',
    width: 58,
    height: 50,
    zIndex: 5,
  },
  butterfly: {
    position: 'absolute',
    width: 44,
    height: 36,
    zIndex: 3,
  },
  grassTuft: {
    position: 'absolute',
    width: 54,
    height: 82,
    zIndex: 1,
  },
});

// FOREST PATH
function ForestPathScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={fpStyles.root}>
      <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
      <ForestBackground />
      <View style={[fpStyles.navBar, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={fpStyles.navBtn} activeOpacity={0.72}>
          <ArrowLeft size={22} color="#ECFDF5" />
        </TouchableOpacity>
        <Text style={fpStyles.navTitle}> </Text>
        <View style={fpStyles.navSpacer} />
      </View>
      <ForestPathContent />
    </View>
  );
}

function ForestPathContent() {
  const [message, setMessage] = useState<string | null>(null);
  const messageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (messageTimerRef.current) {
        clearTimeout(messageTimerRef.current);
      }
    };
  }, []);

  const showMessage = useCallback((nextMessage: string) => {
    if (messageTimerRef.current) {
      clearTimeout(messageTimerRef.current);
    }
    setMessage(nextMessage);
    messageTimerRef.current = setTimeout(() => setMessage(null), 1500);
  }, []);

  const handleLevelPress = useCallback(
    (level: number) => {
      if (level > FP_CURRENT_LEVEL) {
        showMessage('Complete previous forest rings first.');
        return;
      }
      showMessage('Forest lessons coming soon.');
    },
    [showMessage],
  );

  const woodSliceNodes = useMemo(() => (
    Array.from({ length: FP_TOTAL }, (_, index) => {
      const level = index + 1;
      const { cx, cy } = fpPos(index);
      const isCompleted = level < FP_CURRENT_LEVEL;
      const isActive = level === FP_CURRENT_LEVEL;
      const isLocked = level > FP_CURRENT_LEVEL;
      return (
        <View
          key={level}
          style={[
            fpStyles.nodeWrap,
            { left: cx - FP_NODE_R, top: cy - FP_NODE_R, transform: [{ scale: FP_SCALE }] },
          ]}
        >
          <WoodSliceLevel
            level={level}
            isCompleted={isCompleted}
            isLocked={isLocked}
            isActive={isActive}
            allowPressWhenLocked
            onPress={handleLevelPress}
          />
        </View>
      );
    })
  ), [handleLevelPress]);

  return (
    <>
      {message && (
        <View style={fpStyles.lockedBanner}>
          <Text style={fpStyles.lockedBannerText}>{message}</Text>
        </View>
      )}
      <ScrollView
        style={fpStyles.scroll}
        contentContainerStyle={fpStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={fpStyles.header}>
          <View style={fpStyles.titleRow}>
            <Leaf size={24} color="#FDE68A" />
            <Text style={fpStyles.title}>The Forest Path</Text>
          </View>
          <Text style={fpStyles.subtitle}>Resilience, rootedness, calm strength</Text>
          <View style={fpStyles.progressContainer}>
            <Text style={fpStyles.progress}>Ring {FP_CURRENT_LEVEL} of {FP_TOTAL}</Text>
            <View style={fpStyles.progressBarBg}>
              <View style={[fpStyles.progressBarFill, { width: `${(FP_CURRENT_LEVEL / FP_TOTAL) * 100}%` }]} />
            </View>
          </View>
        </View>

        <View style={[fpStyles.pathContainer, { width: FP_PATH_W, height: FP_CONTAINER_H }]}>
          <Svg width={FP_PATH_W} height={FP_CONTAINER_H} style={fpStyles.pathSvg}>
            <SvgPath
              d="M 26 140 C 68 116 92 122 126 92"
              stroke="rgba(253,230,138,0.12)"
              strokeWidth={2}
              strokeLinecap="round"
              fill="none"
            />
            <SvgPath
              d={`M 334 180 C 300 220 318 260 286 300 M 20 ${FP_CONTAINER_H - 290} C 70 ${FP_CONTAINER_H - 338} 112 ${FP_CONTAINER_H - 272} 158 ${FP_CONTAINER_H - 318}`}
              stroke="rgba(187,247,208,0.1)"
              strokeWidth={2}
              strokeLinecap="round"
              fill="none"
            />

            {Array.from({ length: 10 }, (_, index) => {
              const y = 174 + index * 242;
              const left = index % 2 === 0 ? 12 : 276;
              const width = index % 3 === 0 ? 62 : 46;
              return (
                <SvgPath
                  key={`fp-floor-stroke-${index}`}
                  d={`M ${left} ${y} C ${left + 16} ${y - 8} ${left + width - 12} ${y + 8} ${left + width} ${y - 2}`}
                  stroke="#BBF7D0"
                  strokeWidth={1.5}
                  opacity={0.1}
                  fill="none"
                  strokeLinecap="round"
                />
              );
            })}

            <SvgPath
              d={FP_PATH_D}
              stroke="rgba(8,5,2,0.34)"
              strokeWidth={24}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <SvgPath
              d={FP_PATH_D}
              stroke="#4A2A16"
              strokeWidth={18}
              opacity={0.94}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <SvgPath
              d={FP_PATH_D}
              stroke="#8B5A2B"
              strokeWidth={11}
              opacity={0.92}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <SvgPath
              d={FP_PATH_D}
              stroke="rgba(253,230,138,0.2)"
              strokeWidth={3}
              strokeDasharray="4 22"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {FP_COMPLETED_PATH_D.length > 0 && (
              <SvgPath
                d={FP_COMPLETED_PATH_D}
                stroke="#22C55E"
                strokeWidth={10}
                opacity={0.95}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </Svg>

          {woodSliceNodes}
        </View>
      </ScrollView>
    </>
  );
}

function ForestBackground() {
  return (
    <View pointerEvents="none" style={fpStyles.bgAbsolute}>
      <LinearGradient
        colors={['#020F0A', '#052E1C', '#0B3A29', '#031A12']}
        locations={[0, 0.34, 0.72, 1]}
        style={StyleSheet.absoluteFill}
      />
      <Svg width="100%" height="100%" viewBox="0 0 400 900" preserveAspectRatio="xMidYMid slice" style={StyleSheet.absoluteFill}>
        <Circle cx={332} cy={94} r={42} fill="#FDE68A" opacity={0.08} />
        <Circle cx={332} cy={94} r={24} fill="#FEF3C7" opacity={0.06} />
        <SvgPath d="M -40 236 C 42 188 108 216 178 176 C 254 132 330 166 440 104 L 440 900 L -40 900 Z" fill="#08351F" opacity={0.34} />
        <SvgPath d="M -40 344 C 72 280 128 352 224 288 C 304 234 358 278 440 228 L 440 900 L -40 900 Z" fill="#062819" opacity={0.44} />
        <SvgPath d="M -40 536 C 62 470 160 552 258 488 C 330 440 382 474 440 426 L 440 900 L -40 900 Z" fill="#03140D" opacity={0.5} />
        <SvgPath d="M -30 676 C 82 626 142 690 246 638 C 320 600 374 620 430 588" stroke="#BBF7D0" strokeWidth={1.6} opacity={0.08} fill="none" />
        <SvgPath d="M 16 792 C 48 770 82 786 116 762 M 286 806 C 318 778 350 798 384 774" stroke="#86EFAC" strokeWidth={1.4} opacity={0.1} fill="none" strokeLinecap="round" />
      </Svg>

      {FP_BACKGROUND_TREES.map((tree, index) => (
        <ForestTree
          key={`fp-tree-${index}`}
          top={tree.top}
          left={'left' in tree ? tree.left : undefined}
          right={'right' in tree ? tree.right : undefined}
          scale={tree.scale}
          opacity={tree.opacity}
          tone={tree.tone}
        />
      ))}

      {FP_FLOATING_LEAVES.map((leaf, index) => (
        <ForestFloatingLeaf
          key={`fp-leaf-${index}`}
          top={leaf.top}
          left={'left' in leaf ? leaf.left : undefined}
          right={'right' in leaf ? leaf.right : undefined}
          rotate={leaf.rotate}
          scale={leaf.scale}
          color={leaf.color}
        />
      ))}
    </View>
  );
}

function ForestTree({
  top,
  left,
  right,
  scale,
  opacity,
  tone,
}: {
  top: number;
  left?: number;
  right?: number;
  scale: number;
  opacity: number;
  tone: 'deep' | 'soft';
}) {
  const dark = tone === 'deep' ? '#063D25' : '#0B4F32';
  const mid = tone === 'deep' ? '#0B5A36' : '#137A48';
  const light = tone === 'deep' ? '#15803D' : '#22A35A';

  return (
    <View style={[fpStyles.edgeTree, { top, left, right, opacity, transform: [{ scale }] }]}>
      <Svg width={92} height={130} viewBox="0 0 92 130">
        <Ellipse cx={46} cy={120} rx={34} ry={8} fill="#020617" opacity={0.2} />
        <Rect x={38} y={68} width={16} height={48} rx={5} fill="#5A3218" />
        <SvgPath d="M 47 72 C 42 88 45 102 40 116" stroke="#8B5A2B" strokeWidth={2.2} opacity={0.58} strokeLinecap="round" fill="none" />
        <SvgPath d="M 48 84 C 57 80 62 74 68 66" stroke="#4A2A16" strokeWidth={2.4} opacity={0.68} strokeLinecap="round" fill="none" />
        <Circle cx={46} cy={42} r={29} fill={mid} />
        <Circle cx={25} cy={58} r={23} fill={dark} />
        <Circle cx={68} cy={58} r={24} fill={mid} />
        <Circle cx={46} cy={65} r={28} fill={light} opacity={0.9} />
        <Circle cx={32} cy={36} r={16} fill={light} opacity={0.72} />
        <Circle cx={60} cy={34} r={18} fill={dark} opacity={0.58} />
        <Circle cx={48} cy={20} r={17} fill={light} opacity={0.72} />
        <Ellipse cx={35} cy={58} rx={10} ry={6} fill="#BBF7D0" opacity={0.08} />
      </Svg>
    </View>
  );
}

function ForestFloatingLeaf({
  top,
  left,
  right,
  rotate,
  scale,
  color,
}: {
  top: number;
  left?: number;
  right?: number;
  rotate: string;
  scale: number;
  color: string;
}) {
  return (
    <View style={[fpStyles.floatingLeaf, { top, left, right, transform: [{ rotate }, { scale }] }]}>
      <Svg width={22} height={30} viewBox="0 0 22 30">
        <SvgPath
          d="M 11 2 C 19 8 21 17 12 28 C 2 20 3 9 11 2 Z"
          fill={color}
          opacity={0.7}
        />
        <SvgPath d="M 11 5 C 10 12 11 20 12 27" stroke="#12351F" strokeWidth={1.1} opacity={0.42} strokeLinecap="round" fill="none" />
      </Svg>
    </View>
  );
}

const fpStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#031A12',
  },
  bgAbsolute: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 0,
    backgroundColor: 'transparent',
    zIndex: 5,
  },
  navBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(3,26,18,0.66)',
    borderWidth: 1,
    borderColor: 'rgba(187,247,208,0.2)',
  },
  navTitle: {
    flex: 1,
    color: '#ECFDF5',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    fontFamily: Fonts.serif,
    paddingHorizontal: 10,
  },
  navSpacer: { width: 42 },
  scroll: {
    flex: 1,
    zIndex: 2,
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 136,
  },
  header: {
    paddingTop: 4,
    paddingBottom: 16,
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 27,
    color: '#FEF3C7',
    fontFamily: Fonts.serif,
    fontWeight: '800',
    textShadowColor: 'rgba(3,26,18,0.94)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  subtitle: {
    color: 'rgba(220,252,231,0.8)',
    fontSize: 14,
    fontWeight: '700',
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  progress: {
    color: 'rgba(236,253,245,0.7)',
    fontSize: 12,
    marginBottom: 6,
    fontWeight: '700',
  },
  progressBarBg: {
    width: 180,
    height: 4,
    backgroundColor: 'rgba(2,15,10,0.62)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FBBF24',
    borderRadius: 2,
  },
  lockedBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: 'rgba(5,46,28,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(253,230,138,0.34)',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    zIndex: 8,
  },
  lockedBannerText: {
    color: '#FEF3C7',
    fontSize: 13,
    fontWeight: '800',
  },
  pathContainer: {
    position: 'relative',
    alignSelf: 'center',
    marginTop: 2,
  },
  pathSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  nodeWrap: {
    position: 'absolute',
    zIndex: 12,
  },
  edgeTree: {
    position: 'absolute',
    width: 92,
    height: 130,
    zIndex: 1,
  },
  floatingLeaf: {
    position: 'absolute',
    width: 22,
    height: 30,
    zIndex: 2,
  },
});

// TEMPLE PATH
function TemplePathScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={tpStyles.root}>
      <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
      <TempleBackground />
      <View style={[tpStyles.navBar, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={tpStyles.navBtn} activeOpacity={0.72}>
          <ArrowLeft size={22} color="#FEF3C7" />
        </TouchableOpacity>
        <Text style={tpStyles.navTitle}>Temple Path</Text>
        <View style={tpStyles.navSpacer} />
      </View>
      <TemplePathContent />
    </View>
  );
}

function TemplePathContent() {
  const [message, setMessage] = useState<string | null>(null);
  const messageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (messageTimerRef.current) {
        clearTimeout(messageTimerRef.current);
      }
    };
  }, []);

  const showMessage = useCallback((nextMessage: string) => {
    if (messageTimerRef.current) {
      clearTimeout(messageTimerRef.current);
    }
    setMessage(nextMessage);
    messageTimerRef.current = setTimeout(() => setMessage(null), 1500);
  }, []);

  const handleLevelPress = useCallback(
    (level: number) => {
      if (level > TP_CURRENT_LEVEL) {
        showMessage('Complete previous temple milestones first.');
        return;
      }
      showMessage('Temple lessons coming soon.');
    },
    [showMessage],
  );

  const templeNodes = useMemo(() => (
    Array.from({ length: TP_TOTAL }, (_, index) => {
      const level = index + 1;
      const { cx, cy } = tpPos(index);
      const isCompleted = level < TP_CURRENT_LEVEL;
      const isActive = level === TP_CURRENT_LEVEL;
      const isLocked = level > TP_CURRENT_LEVEL;
      return (
        <View
          key={level}
          style={[
            tpStyles.nodeWrap,
            { left: cx - TP_NODE_R, top: cy - TP_NODE_R, transform: [{ scale: TP_SCALE }] },
          ]}
        >
          <TempleTileLevel
            level={level}
            isCompleted={isCompleted}
            isLocked={isLocked}
            isActive={isActive}
            allowPressWhenLocked
            onPress={handleLevelPress}
          />
        </View>
      );
    })
  ), [handleLevelPress]);

  return (
    <>
      {message && (
        <View style={tpStyles.lockedBanner}>
          <Text style={tpStyles.lockedBannerText}>{message}</Text>
        </View>
      )}
      <ScrollView
        style={tpStyles.scroll}
        contentContainerStyle={tpStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={tpStyles.header}>
          <View style={tpStyles.titleRow}>
            <Svg width={28} height={28} viewBox="0 0 28 28">
              <SvgPath d="M 5 24 L 5 12 C 5 5 23 5 23 12 L 23 24" stroke="#FBBF24" strokeWidth={2.1} fill="none" strokeLinecap="round" />
              <SvgPath d="M 9 24 L 9 14 C 9 10 19 10 19 14 L 19 24" stroke="#FDE68A" strokeWidth={1.5} fill="none" strokeLinecap="round" opacity={0.82} />
              <SvgPath d="M 11 20 C 13 23 16 23 18 20 C 17 25 12 25 11 20 Z" fill="#B45309" />
              <SvgPath d="M 14 9 C 18 14 15 18 13 19 C 11 16 11 12 14 9 Z" fill="#FFF2C2" />
              <Circle cx={14} cy={5} r={2} fill="#FBBF24" opacity={0.8} />
            </Svg>
            <Text style={tpStyles.title}>The Temple Path</Text>
          </View>
          <Text style={tpStyles.subtitle}>20 milestones on the path to wisdom</Text>
          <View style={tpStyles.progressContainer}>
            <Text style={tpStyles.progress}>Milestone {TP_CURRENT_LEVEL} of {TP_TOTAL}</Text>
            <View style={tpStyles.progressBarBg}>
              <View style={[tpStyles.progressBarFill, { width: `${(TP_CURRENT_LEVEL / TP_TOTAL) * 100}%` }]} />
            </View>
          </View>
        </View>

        <View style={[tpStyles.pathContainer, { width: TP_PATH_W, height: TP_CONTAINER_H }]}>
          <Svg width={TP_PATH_W} height={TP_CONTAINER_H} style={tpStyles.pathSvg}>
            <SvgPath
              d={TP_PATH_D}
              stroke="rgba(43,25,15,0.42)"
              strokeWidth={16}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <SvgPath
              d={TP_PATH_D}
              stroke="#B99B6B"
              strokeWidth={12}
              opacity={0.95}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <SvgPath
              d={TP_PATH_D}
              stroke="#FFF2C2"
              strokeWidth={5}
              opacity={0.9}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {TP_COMPLETED_PATH_D.length > 0 && (
              <SvgPath
                d={TP_COMPLETED_PATH_D}
                stroke="#22C55E"
                strokeWidth={8}
                opacity={0.95}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </Svg>

          {templeNodes}
        </View>
      </ScrollView>
    </>
  );
}

function TempleBackground() {
  const pulse = useRef(new Animated.Value(0)).current;
  const sweep = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 2400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 2400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    const sweepLoop = Animated.loop(
      Animated.timing(sweep, {
        toValue: 1,
        duration: 9000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    pulseLoop.start();
    sweepLoop.start();
    return () => {
      pulseLoop.stop();
      sweepLoop.stop();
    };
  }, [pulse, sweep]);

  const lampOpacity = pulse.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.45, 0.86, 0.45],
  });
  const lampScale = pulse.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.94, 1.08, 0.94],
  });
  const sanctumOpacity = pulse.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.28, 0.46, 0.28],
  });

  return (
    <View pointerEvents="none" style={tpStyles.bgAbsolute}>
      <LinearGradient
        colors={['#2A130B', '#5A2B17', '#9A5A2B', '#D19A57']}
        locations={[0, 0.42, 0.74, 1]}
        start={{ x: 0.5, y: 1 }}
        end={{ x: 0.5, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View
        style={[
          tpStyles.sanctumGlow,
          {
            opacity: sanctumOpacity,
            transform: [{ scale: lampScale }],
          },
        ]}
      />
      <Svg width="100%" height="100%" viewBox="0 0 400 900" preserveAspectRatio="xMidYMid slice" style={StyleSheet.absoluteFill}>
        <SvgPath d="M 34 900 L 132 210 L 268 210 L 366 900 Z" fill="#B8793D" opacity={0.28} />
        <SvgPath d="M 84 900 L 156 254 L 244 254 L 316 900 Z" fill="#E2B36D" opacity={0.16} />
        <SvgPath d="M 0 900 L 92 236 L 0 236 Z" fill="#1F100A" opacity={0.26} />
        <SvgPath d="M 400 900 L 308 236 L 400 236 Z" fill="#1F100A" opacity={0.24} />

        {Array.from({ length: 9 }, (_, index) => {
          const y = 286 + index * 74;
          return (
            <SvgPath
              key={`tp-floor-line-${index}`}
              d={`M ${78 - index * 8} ${y} L ${322 + index * 8} ${y}`}
              stroke="#F8D99B"
              strokeWidth={1.2}
              opacity={0.13}
            />
          );
        })}
        <SvgPath d="M 138 236 L 84 900" stroke="#F8D99B" strokeWidth={1.3} opacity={0.13} />
        <SvgPath d="M 262 236 L 316 900" stroke="#F8D99B" strokeWidth={1.3} opacity={0.13} />
        <SvgPath d="M 172 252 L 152 900" stroke="#F8D99B" strokeWidth={0.9} opacity={0.08} />
        <SvgPath d="M 228 252 L 248 900" stroke="#F8D99B" strokeWidth={0.9} opacity={0.08} />

        <Rect x={22} y={128} width={36} height={772} rx={11} fill="#4B2414" opacity={0.8} />
        <Rect x={342} y={128} width={36} height={772} rx={11} fill="#4B2414" opacity={0.78} />
        <Rect x={16} y={152} width={48} height={12} rx={4} fill="#C68A47" opacity={0.58} />
        <Rect x={336} y={152} width={48} height={12} rx={4} fill="#C68A47" opacity={0.56} />
        <Rect x={16} y={292} width={48} height={10} rx={4} fill="#C68A47" opacity={0.34} />
        <Rect x={336} y={292} width={48} height={10} rx={4} fill="#C68A47" opacity={0.32} />
        <Rect x={16} y={706} width={48} height={10} rx={4} fill="#C68A47" opacity={0.3} />
        <Rect x={336} y={706} width={48} height={10} rx={4} fill="#C68A47" opacity={0.28} />

        <SvgPath d="M 118 244 L 118 136 C 118 72 282 72 282 136 L 282 244" fill="#2B150D" opacity={0.72} />
        <SvgPath d="M 132 244 L 132 148 C 132 100 268 100 268 148 L 268 244" fill="#120B08" opacity={0.58} />
        <SvgPath d="M 118 138 C 118 72 282 72 282 138" stroke="#D9A657" strokeWidth={6} fill="none" strokeLinecap="round" opacity={0.62} />
        <SvgPath d="M 142 158 C 142 114 258 114 258 158" stroke="#F8D99B" strokeWidth={2} fill="none" strokeLinecap="round" opacity={0.48} />
        <Rect x={108} y={238} width={184} height={12} rx={4} fill="#E2B36D" opacity={0.45} />
        <Ellipse cx={200} cy={214} rx={38} ry={12} fill="#FBBF24" opacity={0.12} />
        <SvgPath d="M 188 214 C 188 188 212 188 212 214 L 218 232 L 182 232 Z" fill="#3B1D12" opacity={0.82} />
        <Circle cx={200} cy={184} r={9} fill="#F8D99B" opacity={0.28} />

        <SvgPath d="M 128 96 L 272 96" stroke="#F8D99B" strokeWidth={2} opacity={0.38} strokeLinecap="round" />
        <SvgPath d="M 154 96 L 154 126" stroke="#F8D99B" strokeWidth={1.3} opacity={0.32} />
        <SvgPath d="M 200 96 L 200 130" stroke="#F8D99B" strokeWidth={1.3} opacity={0.34} />
        <SvgPath d="M 246 96 L 246 126" stroke="#F8D99B" strokeWidth={1.3} opacity={0.32} />
        <Circle cx={154} cy={132} r={8} fill="#D9A657" opacity={0.5} />
        <Circle cx={200} cy={137} r={9} fill="#D9A657" opacity={0.55} />
        <Circle cx={246} cy={132} r={8} fill="#D9A657" opacity={0.5} />

        <SvgPath d="M 62 130 C 78 122 92 124 104 136" stroke="#2B150D" strokeWidth={5} opacity={0.56} strokeLinecap="round" />
        <Ellipse cx={72} cy={146} rx={11} ry={23} fill="#6B351A" opacity={0.88} transform="rotate(24 72 146)" />
        <Ellipse cx={97} cy={148} rx={11} ry={23} fill="#6B351A" opacity={0.86} transform="rotate(-20 97 148)" />
        <SvgPath d="M 306 140 C 320 130 338 132 350 144" stroke="#2B150D" strokeWidth={5} opacity={0.5} strokeLinecap="round" />
        <Ellipse cx={316} cy={158} rx={10} ry={21} fill="#7A3F20" opacity={0.84} transform="rotate(22 316 158)" />
        <Ellipse cx={340} cy={158} rx={10} ry={21} fill="#7A3F20" opacity={0.82} transform="rotate(-18 340 158)" />

        {TP_BG_RANGOLIS.map((rangoli, index) => (
          <TempleBgRangoli key={`tp-bg-rangoli-${index}`} {...rangoli} />
        ))}
        {TP_BG_DIYAS.map((diya, index) => (
          <TempleBgDiya key={`tp-bg-diya-${index}`} {...diya} />
        ))}
      </Svg>

      <Animated.View
        style={[
          tpStyles.templeSweep,
          {
            transform: [
              {
                translateX: sweep.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-260, 520],
                }),
              },
              { rotate: '14deg' },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={['transparent', 'rgba(253,230,138,0.13)', 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {TP_BG_DIYAS.map((diya, index) => (
        <Animated.View
          key={`tp-lamp-glow-${index}`}
          style={[
            tpStyles.lampGlow,
            {
              left: diya.x - 27,
              top: diya.y - 37,
              opacity: lampOpacity,
              transform: [{ scale: lampScale }, { scale: diya.scale }],
            },
          ]}
        />
      ))}

      {TP_BG_PARTICLES.map((particle, index) => (
        <Animated.View
          key={`tp-bg-particle-${index}`}
          style={[
            tpStyles.bgParticle,
            {
              left: particle.left,
              top: particle.top,
              width: particle.size,
              height: particle.size,
              borderRadius: particle.size / 2,
              opacity: pulse.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.14 + particle.delay * 0.18, 0.42, 0.14 + particle.delay * 0.18],
              }),
              transform: [
                {
                  translateY: pulse.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, -10 - particle.delay * 10, 0],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

function TempleBgDiya({ x, y, scale }: { x: number; y: number; scale: number }) {
  return (
    <>
      <Ellipse cx={x} cy={y + 17 * scale} rx={21 * scale} ry={6 * scale} fill="#1B0D08" opacity={0.2} />
      <SvgPath
        d={`M ${x - 20 * scale} ${y + 6 * scale} C ${x - 10 * scale} ${y + 20 * scale} ${x + 10 * scale} ${y + 20 * scale} ${x + 20 * scale} ${y + 6 * scale} C ${x + 12 * scale} ${y + 30 * scale} ${x - 12 * scale} ${y + 30 * scale} ${x - 20 * scale} ${y + 6 * scale} Z`}
        fill="#7C2D12"
        opacity={0.8}
      />
      <SvgPath
        d={`M ${x - 11 * scale} ${y + 5 * scale} C ${x - 4 * scale} ${y + 10 * scale} ${x + 5 * scale} ${y + 10 * scale} ${x + 12 * scale} ${y + 5 * scale} C ${x + 7 * scale} ${y + 14 * scale} ${x - 7 * scale} ${y + 14 * scale} ${x - 11 * scale} ${y + 5 * scale} Z`}
        fill="#F59E0B"
        opacity={0.78}
      />
      <SvgPath
        d={`M ${x} ${y - 18 * scale} C ${x + 12 * scale} ${y - 4 * scale} ${x + 5 * scale} ${y + 5 * scale} ${x - 1 * scale} ${y + 8 * scale} C ${x - 9 * scale} ${y + 1 * scale} ${x - 7 * scale} ${y - 9 * scale} ${x} ${y - 18 * scale} Z`}
        fill="#FFF2C2"
        opacity={0.9}
      />
      <SvgPath
        d={`M ${x} ${y - 8 * scale} C ${x + 5 * scale} ${y - 1 * scale} ${x + 2 * scale} ${y + 5 * scale} ${x - 1 * scale} ${y + 6 * scale} C ${x - 4 * scale} ${y + 2 * scale} ${x - 4 * scale} ${y - 4 * scale} ${x} ${y - 8 * scale} Z`}
        fill="#FB923C"
        opacity={0.9}
      />
    </>
  );
}

function TempleBgRangoli({ x, y, scale, opacity }: { x: number; y: number; scale: number; opacity: number }) {
  const petals = Array.from({ length: 8 }, (_, index) => index * 45);
  return (
    <>
      <Circle cx={x} cy={y} r={34 * scale} fill="none" stroke="#FFF2C2" strokeWidth={1.2} opacity={opacity} />
      <Circle cx={x} cy={y} r={16 * scale} fill="none" stroke="#FBBF24" strokeWidth={1.1} opacity={opacity * 1.15} />
      {petals.map((angle) => (
        <Ellipse
          key={`tp-bg-petal-${x}-${y}-${angle}`}
          cx={x}
          cy={y - 20 * scale}
          rx={5 * scale}
          ry={13 * scale}
          fill="#FDE68A"
          opacity={opacity * 0.75}
          transform={`rotate(${angle} ${x} ${y})`}
        />
      ))}
    </>
  );
}

const tpStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#2B160C',
  },
  bgAbsolute: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  sanctumGlow: {
    position: 'absolute',
    top: 80,
    alignSelf: 'center',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(251,191,36,0.34)',
  },
  templeSweep: {
    position: 'absolute',
    top: -80,
    left: 0,
    width: 150,
    height: '130%',
  },
  lampGlow: {
    position: 'absolute',
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(251,191,36,0.32)',
  },
  bgParticle: {
    position: 'absolute',
    backgroundColor: '#FDE68A',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 10,
    backgroundColor: 'rgba(31,16,8,0.68)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(248,231,184,0.16)',
    zIndex: 5,
  },
  navBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(43,25,15,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(253,230,138,0.24)',
  },
  navTitle: {
    flex: 1,
    color: '#FEF3C7',
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
    fontFamily: Fonts.serif,
    paddingHorizontal: 10,
  },
  navSpacer: {
    width: 42,
  },
  scroll: {
    flex: 1,
    zIndex: 2,
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 132,
  },
  header: {
    paddingTop: 18,
    paddingBottom: 16,
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 27,
    color: '#FEF3C7',
    fontFamily: Fonts.serif,
    fontWeight: '800',
    textShadowColor: 'rgba(31,16,8,0.94)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  subtitle: {
    color: 'rgba(255,241,196,0.78)',
    fontSize: 14,
    fontWeight: '700',
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  progress: {
    color: 'rgba(254,243,199,0.7)',
    fontSize: 12,
    marginBottom: 6,
    fontWeight: '700',
  },
  progressBarBg: {
    width: 180,
    height: 4,
    backgroundColor: 'rgba(31,16,8,0.7)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FBBF24',
    borderRadius: 2,
  },
  lockedBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: 'rgba(43,25,15,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(253,230,138,0.36)',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    zIndex: 8,
  },
  lockedBannerText: {
    color: '#FEF3C7',
    fontSize: 13,
    fontWeight: '800',
  },
  pathContainer: {
    position: 'relative',
    alignSelf: 'center',
    marginTop: 2,
  },
  pathSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  nodeWrap: {
    position: 'absolute',
    zIndex: 12,
  },
});

// Generic world-path styles
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
// completing the Lotus Path first. Keep false in production so Mountain Path
// follows the same sequential unlock behavior as Lotus Path.
const MP_TEST_MODE = false;
const MP_SHOW_TEST_BADGE = false;

const MP_TOTAL = 23;
const MP_ROW_H = 104;
const MP_PATH_W = 360;
const MP_NODE_R = 40;
const MP_SCALE = WL_SCALE;
const MP_NODE_SCREEN_R = MP_NODE_R * MP_SCALE;
const MP_TOP_PAD = 92;
const MP_PATH_H = MP_TOP_PAD + (MP_TOTAL - 1) * MP_ROW_H + 98;
const MP_GATE_AREA = 238;
const MP_APEX_X = 180;
const MP_APEX_Y = 34;
const MP_BASE_Y = MP_PATH_H + MP_GATE_AREA - 24;
const MP_LEFT_EDGE_BASE_X = 10;
const MP_RIGHT_EDGE_BASE_X = 350;

function mpSide(i: number): 'left' | 'right' {
  return i % 2 === 0 ? 'left' : 'right';
}

function mpEdgeX(side: 'left' | 'right', y: number) {
  const t = Math.max(0, Math.min(1, (y - MP_APEX_Y) / (MP_BASE_Y - MP_APEX_Y)));
  const spread = 58 + 142 * Math.pow(t, 0.48) + 52 * t;
  return side === 'left'
    ? MP_APEX_X - spread
    : MP_APEX_X + spread;
}

function mpPos(i: number) {
  const side = mpSide(i);
  const cy = MP_TOP_PAD + i * MP_ROW_H;
  const t = Math.max(0, Math.min(1, (cy - MP_APEX_Y) / (MP_BASE_Y - MP_APEX_Y)));
  const edgeX = mpEdgeX(side, cy);
  const nodeSpread = 72 + 132 * Math.pow(t, 0.66);
  const minX = MP_NODE_SCREEN_R + 4;
  const maxX = MP_PATH_W - MP_NODE_SCREEN_R - 4;
  return {
    cx: side === 'left'
      ? Math.max(minX, MP_APEX_X - nodeSpread)
      : Math.min(maxX, MP_APEX_X + nodeSpread),
    cy,
    edgeX,
    side,
  };
}

function buildMpRouteD(count = MP_TOTAL) {
  const capped = Math.max(0, Math.min(count, MP_TOTAL));
  if (capped === 0) return '';
  let d = '';
  for (let i = 0; i < capped; i++) {
    const { cx, cy } = mpPos(i);
    d += i === 0 ? `M ${cx} ${cy}` : ` L ${cx} ${cy}`;
  }
  return d;
}

const MP_ROUTE_D = buildMpRouteD();

// Pre-compute segment lengths so we can animate the progress line exactly
// the same way the Lotus Path does (strokeDasharray + animated dashOffset).
function getMpSegmentLengths(): number[] {
  const out: number[] = [];
  for (let i = 1; i < MP_TOTAL; i++) {
    const a = mpPos(i - 1);
    const b = mpPos(i);
    out.push(Math.hypot(b.cx - a.cx, b.cy - a.cy));
  }
  return out;
}
const MP_SEGMENT_LENGTHS = getMpSegmentLengths();
const MP_TOTAL_PATH_LENGTH = MP_SEGMENT_LENGTHS.reduce((a, b) => a + b, 0);

// Length of the route from node 0 up-to-and-including node (toLevel-1).
function getMpProgressLength(toLevel: number): number {
  const segCount = Math.min(Math.max(toLevel - 1, 0), MP_SEGMENT_LENGTHS.length);
  let len = 0;
  for (let i = 0; i < segCount; i++) len += MP_SEGMENT_LENGTHS[i];
  return len;
}

const MP_GATE_CX = 180;
const MP_GATE_CY = MP_PATH_H + 112;
const MP_CONTAINER_H = MP_PATH_H + MP_GATE_AREA;

function MountainPathScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: '#0B1224' }}>
      <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
      <MountainBackground />
      <View style={[mpStyles.navBar, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={mpStyles.navBtn} activeOpacity={0.72}>
          <ArrowLeft size={22} color="#E2E8F0" />
        </TouchableOpacity>
        <Text style={mpStyles.navTitle}> </Text>
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
        colors={['#155E75', '#164E63', '#123A5F', '#071427']}
        locations={[0, 0.28, 0.68, 1]}
        style={StyleSheet.absoluteFill}
      />
      <Svg width="100%" height="100%" viewBox="0 0 400 900" preserveAspectRatio="xMidYMid slice" style={StyleSheet.absoluteFill}>
        <Circle cx={322} cy={96} r={24} fill="#E0F2FE" opacity={0.62} />
        <Circle cx={312} cy={88} r={24} fill="#155E75" opacity={0.72} />
        <SvgPath d="M -40 318 C 56 286 122 302 210 274 C 288 250 344 266 440 230" stroke="#BAE6FD" strokeWidth={2} opacity={0.12} fill="none" />
        <SvgPath d="M -40 380 C 50 356 120 372 196 342 C 286 306 354 332 440 298" stroke="#BAE6FD" strokeWidth={1.5} opacity={0.1} fill="none" />
        <Polygon points="-40,560 42,398 108,492 190,330 270,496 350,390 440,548 440,900 -40,900" fill="#1E4B74" opacity={0.42} />
        <Polygon points="-40,696 80,500 156,610 242,454 326,614 440,476 440,900 -40,900" fill="#12365F" opacity={0.62} />
        <Polygon points="-40,820 88,602 184,742 268,566 350,724 440,640 440,900 -40,900" fill="#071D3B" opacity={0.78} />
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
      const { cx, cy, side } = mpPos(index);
      const isCompleted = level < effectiveCurrent && !MP_TEST_MODE;
      const isUnlocked = level <= effectiveCurrent;
      const available = allLevels.some((l) => l.level_number === level);
      const visuallyLocked = MP_TEST_MODE ? level !== 1 : !isUnlocked || !available;
      const visuallyActive = MP_TEST_MODE ? level === 1 : isUnlocked && available && !isCompleted;
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
            side={side}
            isCompleted={isCompleted}
            isLocked={visuallyLocked}
            isActive={visuallyActive}
            onPress={handleLevelPress}
          />
        </View>
      );
    });
  }, [effectiveCurrent, allLevels, handleLevelPress, ready]);

  const gateAvailable = allLevels.some((l) => l.level_number === 24);
  const gateUnlocked = MP_TEST_MODE || currentLevel >= MP_TOTAL + 1;

  const dashOffsetValue = MP_TOTAL_PATH_LENGTH - getMpProgressLength(Math.min(currentLevel, MP_TOTAL + 1));

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
          <Text style={mpStyles.subtitle}>{MP_TOTAL} climbs toward inner strength</Text>
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
          {MP_SHOW_TEST_BADGE && MP_TEST_MODE && (
            <View style={mpStyles.testBadge}>
              <Sparkles size={12} color={GitaColors.gold} />
              <Text style={mpStyles.testBadgeText}>Test mode — all levels unlocked</Text>
            </View>
          )}
        </View>

        <View style={[mpStyles.pathContainer, { width: MP_PATH_W, height: MP_CONTAINER_H }]}>
          <Svg width={MP_PATH_W} height={MP_CONTAINER_H} style={mpStyles.pathSvg}>
            <Ellipse cx={180} cy={MP_BASE_Y + 8} rx={146} ry={24} fill="#020617" opacity={0.24} />
            <SvgPath
              d={`M ${MP_APEX_X} ${MP_APEX_Y}
                  C 158 76 146 126 134 190
                  L 112 326
                  C 94 452 84 596 70 760
                  L 50 1010
                  C 36 1228 24 1470 12 1740
                  L ${MP_LEFT_EDGE_BASE_X} ${MP_BASE_Y}
                  L ${MP_RIGHT_EDGE_BASE_X} ${MP_BASE_Y}
                  L 348 1740
                  C 336 1470 324 1228 310 1010
                  L 290 760
                  C 276 596 266 452 248 326
                  L 226 190
                  C 214 126 202 76 ${MP_APEX_X} ${MP_APEX_Y}
                  Z`}
              fill="#164A70"
              opacity={0.96}
            />
            <SvgPath
              d={`M ${MP_APEX_X} ${MP_APEX_Y}
                  C 202 76 214 126 226 190
                  L 248 326
                  C 266 452 276 596 290 760
                  L 310 1010
                  C 324 1228 336 1470 348 1740
                  L ${MP_RIGHT_EDGE_BASE_X} ${MP_BASE_Y}
                  L 186 ${MP_BASE_Y}
                  C 192 1600 190 1160 186 740
                  C 184 402 184 160 ${MP_APEX_X} ${MP_APEX_Y}
                  Z`}
              fill="#08233E"
              opacity={0.5}
            />
            <SvgPath
              d={`M ${MP_APEX_X} ${MP_APEX_Y} C 158 76 146 126 134 190 L 112 326 C 94 452 84 596 70 760 L 50 1010 C 36 1228 24 1470 12 1740 L ${MP_LEFT_EDGE_BASE_X} ${MP_BASE_Y}`}
              stroke="#DDE7E9"
              strokeWidth={9}
              opacity={0.92}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <SvgPath
              d={`M ${MP_APEX_X} ${MP_APEX_Y} C 202 76 214 126 226 190 L 248 326 C 266 452 276 596 290 760 L 310 1010 C 324 1228 336 1470 348 1740 L ${MP_RIGHT_EDGE_BASE_X} ${MP_BASE_Y}`}
              stroke="#DDE7E9"
              strokeWidth={9}
              opacity={0.92}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <SvgPath d={`M ${MP_APEX_X + 2} ${MP_APEX_Y + 42} C 190 450 188 1110 198 ${MP_BASE_Y}`} stroke="#08233E" strokeWidth={8} opacity={0.24} fill="none" strokeLinecap="round" />
            <Polygon points={`${MP_APEX_X - 42},206 ${MP_APEX_X - 12},84 ${MP_APEX_X},${MP_APEX_Y} ${MP_APEX_X + 28},118 ${MP_APEX_X + 48},206 ${MP_APEX_X + 14},168 ${MP_APEX_X},82 ${MP_APEX_X - 20},168`} fill="#F8FAFC" opacity={0.94} />
            <Polygon points={`${MP_APEX_X},${MP_APEX_Y} ${MP_APEX_X + 28},118 ${MP_APEX_X + 48},206 ${MP_APEX_X + 14},168 ${MP_APEX_X},82`} fill="#CBD5E1" opacity={0.72} />
            <Polygon points={`104,380 146,236 174,392 144,348`} fill="#DDE7E9" opacity={0.24} />
            <Polygon points={`256,388 220,238 198,396 226,348`} fill="#E2E8F0" opacity={0.18} />
            <Polygon points={`62,930 126,710 158,982 118,894`} fill="#DDE7E9" opacity={0.12} />
            <Polygon points={`300,940 238,714 214,982 250,896`} fill="#E2E8F0" opacity={0.1} />

            {Array.from({ length: 9 }, (_, index) => {
              const y = MP_TOP_PAD + 190 + index * 238;
              const left = Math.max(16, mpEdgeX('left', y) + 42);
              const right = Math.min(344, mpEdgeX('right', y) - 42);
              const lift = index % 2 === 0 ? -18 : 16;
              return (
                <SvgPath
                  key={`mp-stratum-${index}`}
                  d={`M ${left} ${y} C ${left + 48} ${y + lift} ${right - 58} ${y - lift} ${right} ${y + 8}`}
                  stroke="#BAE6FD"
                  strokeWidth={1.6}
                  opacity={0.16}
                  fill="none"
                  strokeLinecap="round"
                />
              );
            })}

            <SvgPath
              d={MP_ROUTE_D}
              stroke="#64748B"
              strokeWidth={10}
              opacity={0.78}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <SvgPath
              d={MP_ROUTE_D}
              stroke="#CBD5E1"
              strokeWidth={5}
              opacity={0.9}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <SvgPath
              d={MP_ROUTE_D}
              stroke="#22C55E"
              strokeWidth={6}
              opacity={0.95}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={`${MP_TOTAL_PATH_LENGTH} ${MP_TOTAL_PATH_LENGTH}`}
              strokeDashoffset={dashOffsetValue}
            />
          </Svg>

          {/* Wisdom Gate label + shrine (id 24) overlay */}
          {gateAvailable && (
            <>
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  top: MP_GATE_CY - MP_NODE_R - 42,
                  left: 0,
                  right: 0,
                  zIndex: 20,
                  alignItems: 'center',
                }}
              >
                <Text style={mpStyles.gateStar}>✦</Text>
                <Text style={mpStyles.gateWord}>Wisdom Gate</Text>
              </View>
              <View
                style={[
                  mpStyles.nodeWrap,
                  {
                    left: MP_GATE_CX - MP_NODE_R,
                    top: MP_GATE_CY - MP_NODE_R,
                  },
                ]}
              >
                <MountainShrine
                  level={24}
                  side="left"
                  isCompleted={false}
                  isLocked={MP_TEST_MODE ? true : !gateUnlocked}
                  isActive={MP_TEST_MODE ? false : gateUnlocked}
                  isWisdomGate
                  onPress={handleLevelPress}
                />
              </View>
            </>
          )}

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
    paddingBottom: 0,
    borderBottomWidth: 0,
    backgroundColor: 'transparent',
    zIndex: 5,
  },
  navBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(8,25,58,0.52)',
    borderWidth: 1,
    borderColor: 'rgba(186,230,253,0.22)',
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
  scrollContent: { alignItems: 'center', paddingBottom: 132 },
  header: { paddingTop: 4, paddingBottom: 14, alignItems: 'center', gap: 6, paddingHorizontal: 18 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: {
    fontSize: 26,
    color: '#FEF3C7',
    fontFamily: Fonts.serif,
    fontWeight: '800',
    textShadowColor: 'rgba(15,23,42,0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  subtitle: {
    color: 'rgba(186,230,253,0.78)',
    fontSize: 14,
    fontWeight: '700',
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
  pathContainer: { position: 'relative', alignSelf: 'center', marginTop: 4 },
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
