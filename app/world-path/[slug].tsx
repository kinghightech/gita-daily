import { getWorldPathBySlug } from '@/lib/worldPaths';
import { useTheme } from '@/hooks/useTheme';
import { GitaColors, Fonts } from '@/constants/theme';
import LearnBackground from '@/components/LearnBackground';
import LotusLevel from '@/components/learning/LotusLevel';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, BookOpen, ChevronRight, Flower2, MapPin, Sparkles } from 'lucide-react-native';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path as SvgPath, Rect, Circle, Ellipse } from 'react-native-svg';
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
  const lotusNodes = useMemo(
    () =>
      Array.from({ length: WL_TOTAL }, (_, i) => {
        const { cx, cy } = wlPos(i);
        return (
          <View
            key={i}
            style={[
              wlStyles.nodeWrap,
              { left: cx - WL_NODE_R, top: cy - WL_NODE_R, transform: [{ scale: WL_SCALE }] },
            ]}
          >
            <LotusLevel
              level={i + 1}
              isCompleted={false}
              isLocked={i > 0}
              isActive={i === 0}
              allowPressWhenLocked={false}
              onPress={() => {}}
            />
          </View>
        );
      }),
    [],
  );

  return (
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
