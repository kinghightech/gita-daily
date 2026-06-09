import { HapticButton } from '@/components/ui/HapticButton';
import LotusLoader from '@/components/ui/LotusLoader';
import * as Haptics from 'expo-haptics';
import { GitaColors, Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { refreshAndAwardUserBadges } from '@/lib/badges';
import { awardDharmaCoins } from '@/lib/dharmaCoins';
import {
  fetchLotusLevel,
  updateCurrentLotusLevel,
  type LotusLevelData,
  type LotusQuestion,
} from '@/lib/lotus';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, CheckCircle2, Flower2, XCircle } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Reanimated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import type { Theme } from '@/theme/colors';

type Phase = 'loading' | 'reading' | 'quiz' | 'result';

// Renders reading text, converting literal \n to newlines and **bold** to gold text
function RichText({
  text,
  bodyStyle,
  boldStyle,
}: {
  text: string;
  bodyStyle: object;
  boldStyle: object;
}) {
  const normalized = text.replace(/\\n/g, '\n');
  const paragraphs = normalized.split('\n').filter(p => p.trim().length > 0);

  return (
    <>
      {paragraphs.map((para, pIdx) => {
        const parts = para.split(/(\*\*[^*]+\*\*)/g);
        return (
          <Text key={pIdx} style={[bodyStyle, { marginBottom: 18 }]}>
            {parts.map((part, i) =>
              part.startsWith('**') && part.endsWith('**') ? (
                <Text key={i} style={boldStyle}>
                  {part.slice(2, -2)}
                </Text>
              ) : (
                part
              ),
            )}
          </Text>
        );
      })}
    </>
  );
}

export default function LevelScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const levelId = parseInt(id ?? '1', 10);
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  const [phase, setPhase] = useState<Phase>('loading');
  const [levelData, setLevelData] = useState<LotusLevelData | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);

  // Shared animation values
  const questionOpacity = useSharedValue(1);
  const questionTranslateY = useSharedValue(0);
  const revealOpacity = useSharedValue(0);
  const revealTranslateY = useSharedValue(24);
  const resultOpacity = useSharedValue(0);
  const resultScale = useSharedValue(0.94);

  const prevQ = useRef(currentQ);

  // Fetch level on mount
  useEffect(() => {
    (async () => {
      const data = await fetchLotusLevel(levelId);
      if (data) {
        setLevelData(data);
        setPhase('reading');
      } else {
        router.back();
      }
    })();
  }, [levelId]);

  // Question transition animation
  useEffect(() => {
    if (prevQ.current !== currentQ) {
      prevQ.current = currentQ;
      questionTranslateY.value = 22;
      questionOpacity.value = 0;
      questionOpacity.value = withTiming(1, { duration: 280 });
      questionTranslateY.value = withTiming(0, { duration: 270, easing: Easing.out(Easing.cubic) });
    }
  }, [currentQ, questionOpacity, questionTranslateY]);

  // Reveal bar animation
  useEffect(() => {
    if (revealed) {
      revealOpacity.value = withTiming(1, { duration: 240 });
      revealTranslateY.value = withTiming(0, { duration: 240, easing: Easing.out(Easing.cubic) });
    } else {
      revealOpacity.value = 0;
      revealTranslateY.value = 24;
    }
  }, [revealed, revealOpacity, revealTranslateY]);

  // Result screen entrance
  useEffect(() => {
    if (phase === 'result') {
      resultOpacity.value = withTiming(1, { duration: 400 });
      resultScale.value = withTiming(1, { duration: 370, easing: Easing.out(Easing.cubic) });
    }
  }, [phase, resultOpacity, resultScale]);

  const questions: LotusQuestion[] = levelData?.questions ?? [];
  const totalQ = questions.length;
  const question = questions[currentQ];

  const questionAnimStyle = useAnimatedStyle(() => ({
    opacity: questionOpacity.value,
    transform: [{ translateY: questionTranslateY.value }],
  }));

  const revealAnimStyle = useAnimatedStyle(() => ({
    opacity: revealOpacity.value,
    transform: [{ translateY: revealTranslateY.value }],
  }));

  const resultAnimStyle = useAnimatedStyle(() => ({
    opacity: resultOpacity.value,
    transform: [{ scale: resultScale.value }],
  }));

  const handleSelect = useCallback(
    (idx: number) => {
      if (!revealed) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelected(idx);
      }
    },
    [revealed],
  );

  const submitAnswer = useCallback(() => {
    if (selected === null || revealed) return;
    if (selected === question?.correct_index) {
      setScore(prev => prev + 1);
    }
    setRevealed(true);
  }, [selected, revealed, question]);

  const goNext = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentQ + 1 < totalQ) {
      setCurrentQ(prev => prev + 1);
      setSelected(null);
      setRevealed(false);
    } else {
      setPhase('result');
    }
  }, [currentQ, totalQ]);

  const finish = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const passCriteria = Math.ceil((totalQ * 2) / 3);
    if (score >= passCriteria) {
      await updateCurrentLotusLevel(levelId);
      // Award Dharma Coins for passing the level.
      // The RPC enforces both the per-level lifetime dedupe and the 3-levels-per-day cap.
      void awardDharmaCoins('lotus_level', String(levelId)).catch((error) => {
        console.warn('Lotus level coin award failed', error);
      });
      void refreshAndAwardUserBadges().catch((error) => {
        console.warn('Badge refresh after Lotus level failed', error);
      });
    }
    router.back();
  }, [score, totalQ, levelId]);

  const retry = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentQ(0);
    setSelected(null);
    setRevealed(false);
    setScore(0);
    prevQ.current = 0;
    questionOpacity.value = 1;
    questionTranslateY.value = 0;
    revealOpacity.value = 0;
    revealTranslateY.value = 24;
    resultOpacity.value = 0;
    resultScale.value = 0.94;
    setPhase('reading');
  }, [questionOpacity, questionTranslateY, revealOpacity, revealTranslateY, resultOpacity, resultScale]);

  // ── LOADING ──────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <View style={[styles.root, styles.center]}>
        <Stack.Screen options={{ headerShown: false }} />
        <LotusLoader size={72} color={GitaColors.gold} />
        <Text style={styles.loadingText}>Preparing lesson…</Text>
      </View>
    );
  }

  // ── READING ──────────────────────────────────────────────────────────────
  if (phase === 'reading') {
    return (
      <View style={styles.root}>
        <Stack.Screen options={{ headerShown: false }} />

        {/* Header */}
        <View style={[styles.readHeader, { paddingTop: insets.top + 10 }]}>
          <HapticButton
            onPress={() => router.back()}
            style={styles.iconBtn}
          >
            <ArrowLeft size={20} color={theme.text} />
          </HapticButton>
          <View style={styles.levelChip}>
            <Text style={styles.levelChipText}>LEVEL {levelId}</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        {/* Scrollable reading body */}
        <ScrollView
          style={styles.readScroll}
          contentContainerStyle={styles.readContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Ornament */}
          <View style={styles.ornament}>
            <View style={styles.ornamentLine} />
            <Flower2 size={16} color={GitaColors.goldMuted} />
            <View style={styles.ornamentLine} />
          </View>

          <Text style={styles.miniLabel}>MINI-LESSON</Text>
          <Text style={styles.readTitle}>{levelData?.title}</Text>

          {levelData && (
            <RichText
              text={levelData.reading}
              bodyStyle={styles.readBody}
              boldStyle={styles.readBold}
            />
          )}
        </ScrollView>

        {/* Sticky CTA */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <HapticButton
            style={styles.onboardingBtn}
            onPress={() => setPhase('quiz')}
          >
            <Text style={styles.onboardingBtnText}>Start Quiz</Text>
          </HapticButton>
        </View>
      </View>
    );
  }

  // ── RESULT ───────────────────────────────────────────────────────────────
  if (phase === 'result') {
    const passed = score >= Math.ceil((totalQ * 2) / 3);
    return (
      <View style={[styles.root, styles.center]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Reanimated.View style={[styles.resultContainer, resultAnimStyle]}>
          {/* Icon */}
          <View
            style={[
              styles.resultIcon,
              passed ? styles.resultIconPass : styles.resultIconFail,
            ]}
          >
            <Flower2
              size={44}
              color={passed ? GitaColors.gold : 'rgba(255,255,255,0.25)'}
            />
          </View>

          <Text style={styles.resultHeading}>
            {passed ? 'Level Complete!' : 'Keep Practicing'}
          </Text>
          <Text style={styles.resultSubtext}>
            {passed
              ? `You're ready for level ${levelId + 1}`
              : 'Review the lesson and try once more'}
          </Text>

          {/* Score card */}
          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>YOUR SCORE</Text>
            <Text style={[styles.scoreValue, passed ? styles.scorePass : styles.scoreFail]}>
              {score}
              <Text style={styles.scoreTotal}> / {totalQ}</Text>
            </Text>
          </View>

          {/* Action buttons */}
          <View style={styles.resultBtns}>
            {!passed && (
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.secondaryBtn}
                onPress={retry}
              >
                <Text style={styles.secondaryBtnText}>Try Again</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.primaryBtn, { flex: 1 }]}
              onPress={finish}
            >
              <Text style={styles.primaryBtnText}>
                {passed ? 'Continue Journey' : 'Back to Path'}
              </Text>
            </TouchableOpacity>
          </View>
        </Reanimated.View>
      </View>
    );
  }

  // ── QUIZ ─────────────────────────────────────────────────────────────────
  const isCorrect = revealed && selected === question?.correct_index;

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Quiz header: back + progress segments */}
      <View style={[styles.quizHeader, { paddingTop: insets.top + 10 }]}>
        <HapticButton
          onPress={() => router.back()}
          style={styles.iconBtn}
        >
          <ArrowLeft size={20} color={theme.subtext} />
        </HapticButton>
        <View style={styles.progressRow}>
          {Array.from({ length: totalQ }, (_, i) => (
            <View
              key={i}
              style={[
                styles.progressSeg,
                i < currentQ
                  ? styles.progressSegDone
                  : i === currentQ
                  ? styles.progressSegActive
                  : styles.progressSegEmpty,
              ]}
            />
          ))}
        </View>
        <View style={{ width: 44 }} />
      </View>

      {/* Question + Options */}
      <ScrollView
        style={styles.quizScroll}
        contentContainerStyle={[
          styles.quizContent,
          { paddingBottom: revealed ? 210 : 96 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Reanimated.View style={questionAnimStyle}>
          <Text style={styles.questionText}>{question?.question}</Text>

          <View style={styles.optionsWrap}>
            {question?.options.map((opt, idx) => {
              const isThisCorrect = idx === question.correct_index;
              const isThisSelected = selected === idx;

              let borderColor: string = theme.border;
              let bgColor: string = theme.surface;

              if (revealed) {
                if (isThisCorrect) {
                  borderColor = '#22C55E';
                  bgColor = 'rgba(34,197,94,0.1)';
                } else if (isThisSelected) {
                  borderColor = '#EF4444';
                  bgColor = 'rgba(239,68,68,0.1)';
                }
              } else if (isThisSelected) {
                borderColor = GitaColors.gold;
                bgColor = 'rgba(251,191,36,0.08)';
              }

              return (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={revealed ? 1 : 0.72}
                  onPress={() => handleSelect(idx)}
                  style={[styles.optionCard, { borderColor, backgroundColor: bgColor }]}
                >
                  {/* Letter badge */}
                  <View
                    style={[
                      styles.optionBadge,
                      !revealed && isThisSelected && styles.optionBadgeSelected,
                      revealed && isThisCorrect && styles.optionBadgeCorrect,
                      revealed && isThisSelected && !isThisCorrect && styles.optionBadgeWrong,
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionBadgeText,
                        !revealed && isThisSelected && styles.optionBadgeTextSelected,
                        revealed && (isThisCorrect || (isThisSelected && !isThisCorrect)) &&
                          styles.optionBadgeTextLight,
                      ]}
                    >
                      {String.fromCharCode(65 + idx)}
                    </Text>
                  </View>

                  {/* Option text */}
                  <Text
                    style={[
                      styles.optionText,
                      revealed && isThisCorrect && styles.optionTextCorrect,
                      revealed && isThisSelected && !isThisCorrect && styles.optionTextWrong,
                    ]}
                  >
                    {opt}
                  </Text>

                  {/* Result icon */}
                  {revealed && isThisCorrect && (
                    <CheckCircle2 size={20} color="#22C55E" />
                  )}
                  {revealed && isThisSelected && !isThisCorrect && (
                    <XCircle size={20} color="#EF4444" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Reanimated.View>
      </ScrollView>

      {/* Footer: Check button (hidden once revealed, reveal bar takes over) */}
      {!revealed && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <HapticButton
            disabled={selected === null}
            style={[
              styles.onboardingBtn,
              selected === null && styles.onboardingBtnDisabled,
            ]}
            onPress={submitAnswer}
          >
            <Text
              style={[
                styles.onboardingBtnText,
                selected === null && styles.onboardingBtnTextDisabled,
              ]}
            >
              Check Answer
            </Text>
          </HapticButton>
        </View>
      )}

      {/* Reveal bar — animated, overlays above footer */}
      {revealed && (
        <Reanimated.View
          style={[
            styles.revealBar,
            isCorrect ? styles.revealBarCorrect : styles.revealBarWrong,
            { paddingBottom: insets.bottom + 16 },
            revealAnimStyle,
          ]}
        >
          <View style={styles.revealRow}>
            {/* Icon + feedback text */}
            <View style={styles.revealLeft}>
              {isCorrect ? (
                <CheckCircle2 size={26} color="#22C55E" />
              ) : (
                <XCircle size={26} color="#EF4444" />
              )}
              <View style={styles.revealTextWrap}>
                <Text
                  style={[
                    styles.revealHeading,
                    isCorrect ? styles.revealHeadingCorrect : styles.revealHeadingWrong,
                  ]}
                >
                  {isCorrect ? 'Correct!' : 'Incorrect'}
                </Text>
                {!isCorrect && question && (
                  <Text style={styles.revealAnswer} numberOfLines={2}>
                    {question.options[question.correct_index]}
                  </Text>
                )}
              </View>
            </View>

            {/* Continue button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={goNext}
              style={[
                styles.continueBtn,
                isCorrect ? styles.continueBtnCorrect : styles.continueBtnWrong,
              ]}
            >
              <Text style={styles.continueBtnText}>
                {currentQ + 1 < totalQ ? 'Continue' : 'Finish'}
              </Text>
            </TouchableOpacity>
          </View>
        </Reanimated.View>
      )}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.background,
    },
    center: {
      justifyContent: 'center',
      alignItems: 'center',
      gap: 16,
    },
    loadingText: {
      color: theme.subtext,
      fontSize: 16,
      fontFamily: Fonts.serif,
      marginTop: 8,
    },

    // ── Reading ──────────────────────────────────────────
    readHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    iconBtn: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      backgroundColor: theme.surface,
    },
    levelChip: {
      backgroundColor: 'rgba(251,191,36,0.1)',
      borderWidth: 1,
      borderColor: 'rgba(251,191,36,0.22)',
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 7,
    },
    levelChipText: {
      color: GitaColors.gold,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1.8,
    },
    readScroll: {
      flex: 1,
    },
    readContent: {
      paddingHorizontal: 24,
      paddingTop: 28,
      paddingBottom: 16,
    },
    ornament: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 24,
    },
    ornamentLine: {
      flex: 1,
      height: 1,
      backgroundColor: 'rgba(251,191,36,0.18)',
    },
    miniLabel: {
      color: GitaColors.goldMuted,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 2.2,
      marginBottom: 10,
    },
    readTitle: {
      color: theme.text,
      fontSize: 28,
      fontWeight: '800',
      fontFamily: Fonts.serif,
      lineHeight: 34,
      marginBottom: 24,
    },
    readBody: {
      color: theme.textWarm,
      fontSize: 17,
      lineHeight: 27,
      fontWeight: '400',
    },
    readBold: {
      color: GitaColors.gold,
      fontWeight: '700',
    },
    footer: {
      paddingHorizontal: 24,
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      backgroundColor: theme.background,
    },

    // ── Buttons ──────────────────────────────────────────
    onboardingBtn: {
      borderRadius: 16,
      backgroundColor: 'rgba(251, 191, 36, 0.45)',
      borderWidth: 1,
      borderColor: 'rgba(251, 191, 36, 0.65)',
      paddingHorizontal: 24,
      paddingVertical: 16,
      shadowColor: '#000000',
      shadowOpacity: 0.18,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 6 },
      alignItems: 'center',
      justifyContent: 'center',
    },
    onboardingBtnText: {
      color: '#fff9e6',
      letterSpacing: 0.25,
      fontSize: 17,
      fontWeight: '800',
    },
    onboardingBtnDisabled: {
      backgroundColor: 'rgba(251, 191, 36, 0.15)',
      borderColor: 'rgba(251, 191, 36, 0.25)',
    },
    onboardingBtnTextDisabled: {
      color: 'rgba(255, 249, 230, 0.40)',
    },
    primaryBtn: {
      backgroundColor: GitaColors.gold,
      borderRadius: 16,
      paddingVertical: 17,
      paddingHorizontal: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryBtnDisabled: {
      backgroundColor: theme.surface,
      borderWidth: 2,
      borderColor: theme.border,
    },
    primaryBtnText: {
      color: '#0F172A',
      fontSize: 17,
      fontWeight: '800',
      letterSpacing: 0.1,
    },
    primaryBtnTextDisabled: {
      color: theme.subtextMuted,
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

    // ── Quiz ─────────────────────────────────────────────
    quizHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: 16,
      gap: 12,
    },
    progressRow: {
      flex: 1,
      flexDirection: 'row',
      gap: 6,
      alignItems: 'center',
    },
    progressSeg: {
      flex: 1,
      height: 6,
      borderRadius: 3,
    },
    progressSegDone: {
      backgroundColor: GitaColors.gold,
    },
    progressSegActive: {
      backgroundColor: 'rgba(251,191,36,0.45)',
    },
    progressSegEmpty: {
      backgroundColor: theme.surface,
    },
    quizScroll: {
      flex: 1,
    },
    quizContent: {
      paddingHorizontal: 24,
      paddingTop: 8,
    },
    questionText: {
      color: theme.text,
      fontSize: 22,
      fontWeight: '800',
      lineHeight: 30,
      marginBottom: 28,
      fontFamily: Fonts.serif,
    },
    optionsWrap: {
      gap: 12,
    },
    optionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 15,
      paddingHorizontal: 16,
      borderRadius: 16,
      borderWidth: 2,
      minHeight: 62,
      gap: 12,
    },
    optionBadge: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: theme.surface,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    optionBadgeSelected: {
      backgroundColor: 'rgba(251,191,36,0.18)',
    },
    optionBadgeCorrect: {
      backgroundColor: '#22C55E',
    },
    optionBadgeWrong: {
      backgroundColor: '#EF4444',
    },
    optionBadgeText: {
      color: theme.subtext,
      fontSize: 14,
      fontWeight: '800',
    },
    optionBadgeTextSelected: {
      color: GitaColors.gold,
    },
    optionBadgeTextLight: {
      color: '#FFFFFF',
    },
    optionText: {
      color: theme.text,
      fontSize: 16,
      fontWeight: '600',
      flex: 1,
      flexWrap: 'wrap',
      lineHeight: 22,
    },
    optionTextCorrect: {
      color: '#22C55E',
    },
    optionTextWrong: {
      color: '#EF4444',
    },

    // ── Reveal bar ───────────────────────────────────────
    revealBar: {
      paddingHorizontal: 24,
      paddingTop: 20,
      borderTopWidth: 2,
    },
    revealBarCorrect: {
      backgroundColor: 'rgba(34,197,94,0.07)',
      borderTopColor: '#22C55E',
    },
    revealBarWrong: {
      backgroundColor: 'rgba(239,68,68,0.07)',
      borderTopColor: '#EF4444',
    },
    revealRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      marginBottom: 16,
    },
    revealLeft: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    revealTextWrap: {
      flex: 1,
    },
    revealHeading: {
      fontSize: 17,
      fontWeight: '800',
      marginBottom: 3,
    },
    revealHeadingCorrect: {
      color: '#22C55E',
    },
    revealHeadingWrong: {
      color: '#EF4444',
    },
    revealAnswer: {
      color: theme.subtext,
      fontSize: 14,
      fontWeight: '500',
      lineHeight: 20,
    },
    continueBtn: {
      paddingVertical: 14,
      paddingHorizontal: 22,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 110,
    },
    continueBtnCorrect: {
      backgroundColor: '#22C55E',
    },
    continueBtnWrong: {
      backgroundColor: '#EF4444',
    },
    continueBtnText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '800',
    },

    // ── Result ───────────────────────────────────────────
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
    scoreValue: {
      fontSize: 52,
      fontWeight: '900',
      lineHeight: 56,
    },
    scorePass: {
      color: '#22C55E',
    },
    scoreFail: {
      color: theme.text,
    },
    scoreTotal: {
      fontSize: 30,
      fontWeight: '600',
      color: theme.subtext,
    },
    resultBtns: {
      flexDirection: 'row',
      gap: 12,
      width: '100%',
    },
  });
