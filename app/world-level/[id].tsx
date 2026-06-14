import SkipLevelButton from '@/components/learning/SkipLevelButton';
import WorldLotusBlockView from '@/components/learning/WorldLotusBlock';
import { HapticButton } from '@/components/ui/HapticButton';
import LotusLoader from '@/components/ui/LotusLoader';
import { Fonts, GitaColors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { refreshAndAwardUserBadges } from '@/lib/badges';
import { awardOmCoins } from '@/lib/omCoins';
import {
  countQuestionBlocks,
  fetchWorldLotusLevel,
  getBlockSubstepCount,
  isQuestionBlock,
  markLotusWisdomGatePassed,
  passThreshold,
  updateCurrentWorldLotusLevel,
  type WorldLotusLevelData,
} from '@/lib/worldLotus';
import type { Theme } from '@/theme/colors';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, CheckCircle2, Flower2, XCircle } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Phase = 'loading' | 'playing' | 'result';

export default function WorldLevelScreen() {
  const { id, returnToPath } = useLocalSearchParams<{ id: string; returnToPath?: string }>();
  const levelNumber = parseInt(id ?? '1', 10);
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  const [phase, setPhase] = useState<Phase>('loading');
  const [levelData, setLevelData] = useState<WorldLotusLevelData | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [currentCorrect, setCurrentCorrect] = useState<boolean | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [substep, setSubstep] = useState(0);

  const closeLesson = useCallback(() => {
    if (returnToPath === 'lotus') {
      router.replace({ pathname: '/world-path/[slug]', params: { slug: 'lotus' } });
      return;
    }
    router.back();
  }, [returnToPath]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await fetchWorldLotusLevel(levelNumber);
      if (cancelled) return;
      if (!data || data.blocks.length === 0) {
        closeLesson();
        return;
      }
      setLevelData(data);
      setPhase('playing');
    })();
    return () => {
      cancelled = true;
    };
  }, [closeLesson, levelNumber]);

  // Reset per-block state when the block changes.
  useEffect(() => {
    setSubstep(0);
    setRevealed(false);
    setCurrentCorrect(null);
  }, [currentIdx]);

  const blocks = useMemo(() => levelData?.blocks ?? [], [levelData]);
  const block = blocks[currentIdx];
  const totalBlocks = blocks.length;
  const isWisdomGate = !!levelData?.is_wisdom_gate;
  const questionTotal = useMemo(() => countQuestionBlocks(blocks), [blocks]);
  const threshold = useMemo(
    () => passThreshold(questionTotal, isWisdomGate),
    [questionTotal, isWisdomGate],
  );
  const substepCount = useMemo(() => getBlockSubstepCount(block), [block]);

  const isQuestion = block ? isQuestionBlock(block) : false;
  const hasMoreSubsteps = !isQuestion && substep < substepCount;

  const handleAnswerChange = useCallback((c: boolean | null) => {
    setCurrentCorrect(c);
  }, []);

  const advanceBlock = useCallback(() => {
    if (currentIdx + 1 < totalBlocks) {
      setCurrentIdx((i) => i + 1);
    } else {
      setPhase('result');
    }
  }, [currentIdx, totalBlocks]);

  const onBottomPress = useCallback(() => {
    if (!block) return;
    // Question + not revealed → CHECK
    if (isQuestion && !revealed) {
      if (currentCorrect === null) return;
      if (currentCorrect) setCorrectCount((c) => c + 1);
      setRevealed(true);
      return;
    }
    // Reading block with more substeps → advance substep
    if (hasMoreSubsteps) {
      setSubstep((s) => s + 1);
      return;
    }
    // Otherwise → next block (or result)
    advanceBlock();
  }, [block, isQuestion, revealed, currentCorrect, hasMoreSubsteps, advanceBlock]);

  const onRevealContinuePress = useCallback(() => {
    advanceBlock();
  }, [advanceBlock]);

  const finish = useCallback(async () => {
    const passed = questionTotal === 0 || correctCount >= threshold;
    if (passed) {
      await updateCurrentWorldLotusLevel(levelNumber);
      const coinSource = isWisdomGate ? 'wisdom_gate' : 'world_level';
      void awardOmCoins(coinSource, `world-${levelNumber}`).catch((err) => {
        console.warn('World lotus level coin award failed', err);
      });
      if (isWisdomGate) {
        void markLotusWisdomGatePassed().catch((err) => {
          console.warn('Marking wisdom gate as passed failed', err);
        });
      }
      void refreshAndAwardUserBadges().catch((err) => {
        console.warn('Badge refresh after Lotus Path level failed', err);
      });
    }
    closeLesson();
  }, [closeLesson, correctCount, isWisdomGate, levelNumber, questionTotal, threshold]);

  const retry = useCallback(() => {
    setCurrentIdx(0);
    setSubstep(0);
    setRevealed(false);
    setCurrentCorrect(null);
    setCorrectCount(0);
    setPhase('playing');
  }, []);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (phase === 'loading' || !levelData) {
    return (
      <View style={[styles.root, styles.center]}>
        <Stack.Screen options={{ headerShown: false }} />
        <LotusLoader size={72} color={GitaColors.gold} />
        <Text style={styles.loadingText}>Preparing lesson…</Text>
      </View>
    );
  }

  // ── Result ─────────────────────────────────────────────────────────────────
  if (phase === 'result') {
    const passed = questionTotal === 0 || correctCount >= threshold;
    return (
      <View style={[styles.root, styles.center]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Animated.View entering={FadeInUp.duration(400)} style={styles.resultContainer}>
          <View style={[styles.resultIcon, passed ? styles.resultIconPass : styles.resultIconFail]}>
            <Flower2 size={44} color={passed ? GitaColors.gold : 'rgba(255,255,255,0.25)'} />
          </View>

          <Text style={styles.resultHeading}>
            {passed
              ? isWisdomGate
                ? 'Wisdom Gate Passed!'
                : 'Level Complete!'
              : isWisdomGate
              ? 'Not Yet'
              : 'Keep Practicing'}
          </Text>
          <Text style={styles.resultSubtext}>
            {passed
              ? isWisdomGate
                ? 'You have completed the Lotus Path. The next region awaits.'
                : `You're ready for level ${levelNumber + 1}`
              : isWisdomGate
              ? `You need ${threshold} of ${questionTotal} correct. Review and try again.`
              : 'Review the lesson and try once more'}
          </Text>

          {questionTotal > 0 && (
            <View style={styles.scoreCard}>
              <Text style={styles.scoreLabel}>YOUR SCORE</Text>
              <Text style={[styles.scoreValue, passed ? styles.scorePass : styles.scoreFail]}>
                {correctCount}
                <Text style={styles.scoreTotal}> / {questionTotal}</Text>
              </Text>
            </View>
          )}

          <View style={styles.resultBtns}>
            {!passed && (
              <HapticButton onPress={retry} style={styles.secondaryBtn}>
                <Text style={styles.secondaryBtnText}>Try Again</Text>
              </HapticButton>
            )}
            <HapticButton onPress={finish} style={[styles.primaryBtn, { flex: 1 }]}>
              <Text style={styles.primaryBtnText}>
                {passed ? 'Continue Journey' : 'Back to Path'}
              </Text>
            </HapticButton>
          </View>
        </Animated.View>
      </View>
    );
  }

  // ── Playing ────────────────────────────────────────────────────────────────
  const bottomLabel = !isQuestion
    ? 'Continue'
    : revealed
    ? currentIdx + 1 < totalBlocks
      ? 'Continue'
      : 'Finish'
    : 'Check';
  const bottomDisabled = isQuestion && !revealed && currentCorrect === null;
  const isLastBlock = currentIdx + 1 >= totalBlocks;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header: back arrow + level chip on top row, title centered, progress bar at bottom */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerTopRow}>
          <HapticButton onPress={() => router.back()} style={styles.iconBtn}>
            <ArrowLeft size={20} color={theme.text} />
          </HapticButton>
          <View style={styles.levelChipCenter} pointerEvents="none">
            <View style={styles.levelChip}>
              <Text style={styles.levelChipText}>LEVEL {levelNumber}</Text>
            </View>
          </View>
          {levelData.is_wisdom_gate ? (
            <View style={styles.wisdomGateChip}>
              <Text style={styles.wisdomGateChipText}>GATE</Text>
            </View>
          ) : (
            <SkipLevelButton
              path="lotus"
              level={levelNumber}
              onSkipped={closeLesson}
            />
          )}
        </View>
        <Text style={styles.headerTitle} numberOfLines={2}>
          {levelData.title}
        </Text>
        <View style={styles.progressRow}>
          {Array.from({ length: totalBlocks }, (_, i) => (
            <View
              key={i}
              style={[
                styles.progressSeg,
                i < currentIdx
                  ? styles.progressSegDone
                  : i === currentIdx
                  ? styles.progressSegActive
                  : styles.progressSegEmpty,
              ]}
            />
          ))}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: revealed && isQuestion ? 200 : 130 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View key={currentIdx} entering={FadeIn.duration(260)} style={styles.blockWrap}>
          {block && (
            <WorldLotusBlockView
              block={block}
              revealed={revealed}
              substep={substep}
              onAnswerChange={handleAnswerChange}
              theme={theme}
            />
          )}
        </Animated.View>
      </ScrollView>

      {/* Reveal bar (only for question blocks after Check) */}
      {isQuestion && revealed && (
        <Animated.View
          entering={FadeInUp.duration(240)}
          style={[
            styles.revealBar,
            currentCorrect ? styles.revealBarCorrect : styles.revealBarWrong,
            { paddingBottom: insets.bottom + 16 },
          ]}
        >
          <View style={styles.revealRow}>
            <View style={styles.revealLeft}>
              {currentCorrect ? (
                <CheckCircle2 size={26} color="#22C55E" />
              ) : (
                <XCircle size={26} color="#EF4444" />
              )}
              <View style={styles.revealTextWrap}>
                <Text
                  style={[
                    styles.revealHeading,
                    currentCorrect ? styles.revealHeadingCorrect : styles.revealHeadingWrong,
                  ]}
                >
                  {currentCorrect ? 'Correct!' : 'Not quite'}
                </Text>
              </View>
            </View>
            <HapticButton
              onPress={onRevealContinuePress}
              style={[
                styles.continueBtn,
                currentCorrect ? styles.continueBtnCorrect : styles.continueBtnWrong,
              ]}
            >
              <Text style={styles.continueBtnText}>{isLastBlock ? 'Finish' : 'Continue'}</Text>
            </HapticButton>
          </View>
        </Animated.View>
      )}

      {/* Main bottom button (hidden when reveal bar is up) */}
      {!(isQuestion && revealed) && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <HapticButton
            disabled={bottomDisabled}
            onPress={onBottomPress}
            style={[styles.bottomBtn, bottomDisabled && styles.bottomBtnDisabled]}
          >
            <Text style={[styles.bottomBtnText, bottomDisabled && styles.bottomBtnTextDisabled]}>
              {bottomLabel}
            </Text>
          </HapticButton>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.background },
    center: { justifyContent: 'center', alignItems: 'center', gap: 16 },
    loadingText: {
      color: theme.subtext,
      fontSize: 16,
      fontFamily: Fonts.serif,
      marginTop: 8,
    },

    // ── Header ───────────────────────────────────────────────────────────────
    header: { paddingHorizontal: 20, paddingBottom: 12, gap: 12 },
    headerTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    iconBtn: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      backgroundColor: theme.surface,
    },
    levelChipCenter: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    levelChip: {
      backgroundColor: 'rgba(251,191,36,0.1)',
      borderWidth: 1,
      borderColor: 'rgba(251,191,36,0.22)',
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 6,
    },
    levelChipText: {
      color: GitaColors.gold,
      fontSize: 11,
      fontWeight: '900',
      letterSpacing: 1.8,
    },
    wisdomGateChip: {
      backgroundColor: 'rgba(251,191,36,0.18)',
      borderWidth: 1,
      borderColor: 'rgba(251,191,36,0.42)',
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    wisdomGateChipText: {
      color: GitaColors.gold,
      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 1.6,
    },
    headerTitle: {
      color: theme.text,
      fontSize: 19,
      fontWeight: '800',
      fontFamily: Fonts.serif,
      lineHeight: 25,
      textAlign: 'center',
      paddingHorizontal: 8,
    },
    progressRow: {
      flexDirection: 'row',
      gap: 6,
      alignItems: 'center',
      marginTop: 4,
    },
    progressSeg: { flex: 1, height: 6, borderRadius: 3 },
    progressSegDone: { backgroundColor: GitaColors.gold },
    progressSegActive: { backgroundColor: 'rgba(251,191,36,0.45)' },
    progressSegEmpty: { backgroundColor: theme.surface },

    // ── Scroll body ──────────────────────────────────────────────────────────
    scroll: { flex: 1 },
    scrollContent: {
      paddingHorizontal: 24,
      paddingTop: 26,
    },
    blockWrap: { paddingVertical: 6 },

    // ── Footer (bottom button) ───────────────────────────────────────────────
    footer: {
      paddingHorizontal: 24,
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      backgroundColor: theme.background,
    },
    bottomBtn: {
      borderRadius: 16,
      backgroundColor: GitaColors.gold,
      paddingHorizontal: 24,
      paddingVertical: 18,
      shadowColor: '#000000',
      shadowOpacity: 0.18,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 6 },
      alignItems: 'center',
      justifyContent: 'center',
    },
    bottomBtnText: {
      color: '#0F172A',
      letterSpacing: 0.4,
      fontSize: 17,
      fontWeight: '900',
    },
    bottomBtnDisabled: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    bottomBtnTextDisabled: { color: theme.subtextMuted },

    // ── Reveal bar ───────────────────────────────────────────────────────────
    revealBar: { paddingHorizontal: 24, paddingTop: 18, borderTopWidth: 2 },
    revealBarCorrect: {
      backgroundColor: 'rgba(34,197,94,0.08)',
      borderTopColor: '#22C55E',
    },
    revealBarWrong: {
      backgroundColor: 'rgba(239,68,68,0.08)',
      borderTopColor: '#EF4444',
    },
    revealRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    revealLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
    revealTextWrap: { flex: 1 },
    revealHeading: { fontSize: 17, fontWeight: '800' },
    revealHeadingCorrect: { color: '#22C55E' },
    revealHeadingWrong: { color: '#EF4444' },
    continueBtn: {
      paddingVertical: 14,
      paddingHorizontal: 22,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 110,
    },
    continueBtnCorrect: { backgroundColor: '#22C55E' },
    continueBtnWrong: { backgroundColor: '#EF4444' },
    continueBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },

    // ── Result screen ────────────────────────────────────────────────────────
    resultContainer: {
      alignItems: 'center',
      paddingHorizontal: 32,
      width: '100%',
    },
    resultIcon: {
      width: 96,
      height: 96,
      borderRadius: 48,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
    },
    resultIconPass: {
      backgroundColor: 'rgba(251,191,36,0.1)',
      borderWidth: 2,
      borderColor: 'rgba(251,191,36,0.28)',
    },
    resultIconFail: {
      backgroundColor: theme.surface,
      borderWidth: 2,
      borderColor: theme.border,
    },
    resultHeading: {
      color: theme.text,
      fontSize: 28,
      fontWeight: '900',
      fontFamily: Fonts.serif,
      textAlign: 'center',
      marginBottom: 8,
    },
    resultSubtext: {
      color: theme.subtext,
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 32,
      lineHeight: 22,
    },
    scoreCard: {
      width: '100%',
      backgroundColor: theme.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 28,
      alignItems: 'center',
      marginBottom: 28,
    },
    scoreLabel: {
      color: theme.subtextMuted,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 2,
      marginBottom: 10,
    },
    scoreValue: { fontSize: 52, fontWeight: '900', lineHeight: 56 },
    scorePass: { color: '#22C55E' },
    scoreFail: { color: theme.text },
    scoreTotal: { fontSize: 30, fontWeight: '600', color: theme.subtext },
    resultBtns: { flexDirection: 'row', gap: 12, width: '100%' },
    primaryBtn: {
      backgroundColor: GitaColors.gold,
      borderRadius: 16,
      paddingVertical: 17,
      paddingHorizontal: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryBtnText: {
      color: '#0F172A',
      fontSize: 17,
      fontWeight: '800',
      letterSpacing: 0.1,
    },
    secondaryBtn: {
      borderWidth: 2,
      borderColor: theme.border,
      borderRadius: 16,
      paddingVertical: 17,
      paddingHorizontal: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    secondaryBtnText: {
      color: theme.subtext,
      fontSize: 17,
      fontWeight: '700',
    },
  });
