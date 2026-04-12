import LearnBackground from '@/components/LearnBackground';
import LotusLevel from '@/components/learning/LotusLevel';
import { Fonts, GitaColors } from '@/constants/theme';
import { fetchLotusLevels, updateCurrentLotusLevel, type LotusLevelData, type LotusQuestion } from '@/lib/lotus';
import { fetchAllFestivals, type Festival, getFestivalSymbol } from '@/lib/festivals';
import FestivalModal from '@/components/gita/FestivalModal';
import { fetchCurrentUserAndProfile, STREAK_UPDATED_EVENT } from '@/lib/profile';
import { useFocusEffect } from '@react-navigation/native';
import { Calendar, Check, ChevronRight, Flower2, Sparkles, X } from 'lucide-react-native';
import LotusLoader from '@/components/ui/LotusLoader';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TouchableOpacity,  Animated, DeviceEventEmitter, Dimensions, Easing, InteractionManager, Modal, Pressable, ScrollView, StyleSheet, Text, View  } from 'react-native';
import Reanimated, { useSharedValue, useAnimatedStyle, withTiming, withSequence, runOnJS } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

type LearnTab = 'lotus' | 'festivals';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type LessonState = 'reading' | 'quiz' | 'result';

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
const TOTAL_PATH_LENGTH = SEGMENT_LENGTH * (TOTAL_LEVELS - 1);

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
          <TouchableOpacity activeOpacity={0.7} style={styles.topTab} onPress={() => switchTab('lotus')}>
            <Flower2 size={15} color={tab === 'lotus' ? 'white' : 'rgba(255,255,255,0.5)'} />
            <Text style={[styles.topTabText, tab === 'lotus' && styles.topTabTextActive]}>Lotus Path</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7} style={styles.topTab} onPress={() => switchTab('festivals')}>
            <Calendar size={15} color={tab === 'festivals' ? 'white' : 'rgba(255,255,255,0.5)'} />
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
  const [currentLevel, setCurrentLevel] = useState(1);
  const [allLevels, setAllLevels] = useState<LotusLevelData[]>([]);
  const [selectedLevelId, setSelectedLevelId] = useState<number | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [lessonState, setLessonState] = useState<LessonState>('reading');
  const [lockedMessage, setLockedMessage] = useState<string | null>(null);
  const [lotusReady, setLotusReady] = useState(false);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);

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
    const found = allLevels.find(l => l.id === level);
    if (!found) {
      showLockedMessage('Level coming soon!');
      return;
    }
    setSelectedLevelId(level);
    setLessonState('reading');
    setCurrentQuestionIndex(0);
    setQuizScore(0);
    setSelectedOptionIndex(null);
    setIsAnswerRevealed(false);
    setIsSubmitted(false);
    setIsModalVisible(true);
  }, [currentLevel, allLevels]);

  const selectedLevelData = useMemo(() => allLevels.find(l => l.id === selectedLevelId), [allLevels, selectedLevelId]);
  const currentQuestion = selectedLevelData?.questions?.[currentQuestionIndex];
  const totalQuestions = selectedLevelData?.questions?.length ?? 0;

  const handleOptionPress = (index: number) => {
    if (isSubmitted) return;
    setSelectedOptionIndex(index);
  };

  const submitAnswer = () => {
    if (selectedOptionIndex === null || isSubmitted) return;
    setIsSubmitted(true);
    setIsAnswerRevealed(true);
    if (selectedOptionIndex === currentQuestion?.correct_index) {
      setQuizScore((prev) => prev + 1);
    }
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex + 1 < totalQuestions) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOptionIndex(null);
      setIsSubmitted(false);
      setIsAnswerRevealed(false);
    } else {
      setLessonState('result');
    }
  };

  const finishLesson = async () => {
    const passCriteria = Math.ceil((totalQuestions * 2) / 3);
    if (quizScore >= passCriteria && selectedLevelId) {
      await updateCurrentLotusLevel(selectedLevelId);
      await refreshProgress();
    }
    setIsModalVisible(false);
    setSelectedLevelId(null);
  };

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
      <Modal transparent animationType="slide" visible={isModalVisible} onRequestClose={() => setIsModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.headerLeft}>
                <View style={styles.levelBadge}><Text style={styles.levelBadgeText}>LEVEL {selectedLevelId}</Text></View>
                <Text style={styles.modalTitle}>{selectedLevelData?.title}</Text>
              </View>
              <TouchableOpacity activeOpacity={0.7} onPress={() => setIsModalVisible(false)}><X color="rgba(255,255,255,0.4)" size={22} /></TouchableOpacity>
            </View>

            {lessonState === 'reading' && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.readingLabel}>Mini-Lesson</Text>
                <Text style={styles.modalBody}>
                  {selectedLevelData?.reading.replace(/\\n/g, '\n')}
                </Text>
                
                <TouchableOpacity activeOpacity={0.7} style={[styles.primaryButton, { marginTop: 24 }]} onPress={() => setLessonState('quiz')}>
                  <Text style={styles.primaryButtonText}>Take Quick Quiz</Text>
                  <ChevronRight size={18} color="white" />
                </TouchableOpacity>
              </ScrollView>
            )}

            {lessonState === 'quiz' && (
              <View style={{ flex: 1 }}>
                <View style={styles.quizProgressHeader}>
                  <Text style={styles.quizProgressText}>Question {currentQuestionIndex + 1} of {totalQuestions}</Text>
                  <View style={styles.quizProgressBarBg}><View style={[styles.quizProgressBarFill, { width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }]} /></View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 12 }}>
                  <Text style={styles.questionText}>{currentQuestion?.question}</Text>
                  <View style={{ gap: 12 }}>
                    {currentQuestion?.options.map((opt, idx) => {
                      const isCorrect = idx === currentQuestion.correct_index;
                      const isSelected = selectedOptionIndex === idx;
                      const show = isAnswerRevealed && (isSelected || isCorrect);
                      let bc = 'rgba(255,255,255,0.1)';
                      let bg = show ? (isCorrect ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)') : (isSelected ? 'rgba(212,163,115,0.1)' : 'rgba(255,255,255,0.05)');
                      if (show) bc = isCorrect ? '#22c55e' : '#ef4444';
                      else if (isSelected) bc = GitaColors.gold;
                      return (
                        <TouchableOpacity activeOpacity={0.7} key={idx} style={[styles.optionBtn, { backgroundColor: bg, borderColor: bc }]} onPress={() => handleOptionPress(idx)}>
                          <View style={styles.optionRow}>
                            <View style={[styles.optionLetter, show && isCorrect && styles.optionLetterCorrect, show && !isCorrect && isSelected && styles.optionLetterWrong]}><Text style={styles.optionLetterText}>{String.fromCharCode(65+idx)}</Text></View>
                            <Text style={styles.optionText}>{opt}</Text>
                          </View>
                          {show && isCorrect && <Check size={18} color="#22c55e" />}
                          {show && !isCorrect && isSelected && <X size={18} color="#ef4444" />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>

                {!isSubmitted ? (
                  <TouchableOpacity activeOpacity={0.7}
                    style={[
                      styles.primaryButton, 
                      { marginTop: 12, opacity: selectedOptionIndex === null ? 0.6 : 1 }
                    ]}
                    disabled={selectedOptionIndex === null}
                    onPress={submitAnswer}
                  >
                    <Text style={styles.primaryButtonText}>Submit Answer</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity activeOpacity={0.7}
                    style={[styles.primaryButton, { marginTop: 12 }]}
                    onPress={goToNextQuestion}
                  >
                    <Text style={styles.primaryButtonText}>
                      {currentQuestionIndex + 1 < totalQuestions ? 'Next Question' : 'See Results'}
                    </Text>
                    <ChevronRight size={18} color="white" />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {lessonState === 'result' && (
              <View style={styles.resultWrapper}>
                {/* Bigger, more dynamic celebration */}
                {quizScore >= Math.ceil(totalQuestions * 2 / 3) ? (
                  <View style={styles.celebrationWrap}>
                    {[...Array(20)].map((_, i) => (
                      <Animated.View
                        key={`confetti-${i}`}
                        style={[
                          styles.confettiParticle,
                          {
                            left: Math.random() * 200 - 100,
                            top: Math.random() * 200 - 100,
                            backgroundColor: i % 3 === 0 ? GitaColors.gold : (i % 2 === 0 ? GitaColors.orange : '#22c55e'),
                            transform: [{ scale: Math.random() * 0.8 + 0.2 }]
                          }
                        ]}
                      />
                    ))}
                    <View style={[styles.resultIconCircle, styles.resultCirclePass]}>
                      <Sparkles size={56} color={GitaColors.gold} />
                    </View>
                  </View>
                ) : (
                  <View style={[styles.resultIconCircle, styles.resultCircleFail]}>
                    <Flower2 size={48} color="rgba(255,255,255,0.3)" />
                  </View>
                )}
                
                <Text style={styles.resultHeading}>
                  {quizScore >= Math.ceil(totalQuestions * 2 / 3) ? 'Congratulations!' : 'Keep Practicing'}
                </Text>
                <Text style={styles.resultSubheading}>{quizScore >= Math.ceil(totalQuestions*2/3) ? `Level ${selectedLevelId} Mastered!` : "Read again and try once more."}</Text>
                <View style={styles.scoreBoard}>
                  <Text style={styles.scoreLabel}>YOUR SCORE</Text>
                  <Text style={[styles.scoreValue, quizScore >= Math.ceil(totalQuestions*2/3) ? styles.scorePass : { color: 'white' }]}>{quizScore} / {totalQuestions}</Text>
                </View>
                <TouchableOpacity activeOpacity={0.7} style={[styles.primaryButton, { width: '100%', marginTop: 24 }]} onPress={finishLesson}>
                  <Text style={styles.primaryButtonText}>{quizScore >= Math.ceil(totalQuestions*2/3) ? 'Continue' : 'Try Again'}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
    animateTransition('next', () => {
      setCurrentMonthIdx(prev => (prev + 1) % 12);
    });
  };

  const prevMonth = () => {
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
                  onPress={() => onSelectFestival(fest)}
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

const styles = StyleSheet.create({
  topTabsWrap: { alignItems: 'center', marginTop: 12, marginBottom: 20 },
  topTabs: { flexDirection: 'row', backgroundColor: 'rgba(15,25,50,0.65)', borderRadius: 9999, padding: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', position: 'relative' },
  slidingPill: { position: 'absolute', top: 4, bottom: 4, left: 4, width: 128, borderRadius: 9999, backgroundColor: GitaColors.orange },
  topTab: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, width: 128 },
  topTabText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '600' },
  topTabTextActive: { color: 'white' },
  tabContentWrap: { flex: 1 },
  lockedBanner: { marginHorizontal: 16, marginBottom: 8, backgroundColor: 'rgba(248,113,113,0.2)', borderWidth: 1, borderColor: '#ef4444', borderRadius: 12, padding: 10, alignItems: 'center' },
  lockedBannerText: { color: '#fca5a5', fontSize: 13, fontWeight: '700' },
  lotusScroll: { flex: 1 },
  lotusContent: { alignItems: 'center', paddingBottom: 120 },
  header: { paddingVertical: 16, alignItems: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  title: { fontSize: 24, color: 'white', fontFamily: Fonts.serif, fontWeight: '700' },
  subtitle: { color: 'rgba(207,250,254,0.8)', fontSize: 14, fontWeight: '500' },
  progressContainer: { width: '100%', alignItems: 'center', marginTop: 8 },
  progress: { color: 'rgba(165,243,252,0.6)', fontSize: 12, marginBottom: 6 },
  progressBarBg: { width: 160, height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2 },
  progressBarFill: { height: '100%', backgroundColor: GitaColors.gold, borderRadius: 2 },
  pathContainer: { position: 'relative', alignSelf: 'center' },
  pathSvg: { position: 'absolute', top: 0, left: 0 },
  nodeWrapper: { position: 'absolute', zIndex: 10 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(9,15,28,0.9)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#0f172a', borderTopLeftRadius: 32, borderTopRightRadius: 32, borderWidth: 1, borderColor: 'rgba(212,163,115,0.2)', height: '85%', padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  headerLeft: { flex: 1, gap: 4 },
  levelBadge: { backgroundColor: 'rgba(212,163,115,0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start' },
  levelBadgeText: { color: GitaColors.gold, fontSize: 10, fontWeight: '800' },
  modalTitle: { color: 'white', fontSize: 24, fontWeight: '800', fontFamily: Fonts.serif, lineHeight: 28 },
  readingLabel: { color: GitaColors.gold, fontSize: 12, fontWeight: '700', marginBottom: 10 },
  modalBody: { color: 'rgba(255,255,255,0.9)', fontSize: 18, lineHeight: 26 },
  richTextContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 24 },
  boldKeyword: { fontWeight: '900', color: GitaColors.gold },
  primaryButton: { backgroundColor: 'rgba(251,191,36,0.85)', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryButtonText: { color: 'white', fontSize: 16, fontWeight: '800' },
  quizProgressHeader: { marginBottom: 20 },
  quizProgressText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 6 },
  quizProgressBarBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3 },
  quizProgressBarFill: { height: '100%', backgroundColor: GitaColors.gold },
  questionText: { color: 'white', fontSize: 20, fontWeight: '700', lineHeight: 26, marginBottom: 24, flexShrink: 1 },
  optionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 14, borderWidth: 2, minHeight: 60 },
  optionRow: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12, marginRight: 8 },
  optionLetter: { width: 30, height: 30, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  optionLetterCorrect: { backgroundColor: '#22c55e' },
  optionLetterWrong: { backgroundColor: '#ef4444' },
  optionLetterText: { color: 'white', fontSize: 14, fontWeight: '800' },
  optionText: { color: 'white', fontSize: 15, fontWeight: '600', flex: 1, flexWrap: 'wrap' },
  confettiContainer: { 
    width: 60, 
    height: 60, 
    alignItems: 'center', 
    justifyContent: 'center', 
    position: 'relative' 
  },
  celebrationWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    width: '100%',
    position: 'relative',
  },
  confettiParticle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  resultWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  resultIconCircle: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  resultCirclePass: { backgroundColor: 'rgba(34,197,94,0.1)', borderWidth: 2, borderColor: '#22c55e' },
  resultCircleFail: { backgroundColor: 'rgba(255,255,255,0.05)' },
  resultHeading: { color: 'white', fontSize: 26, fontWeight: '800', marginBottom: 8 },
  resultSubheading: { color: 'rgba(255,255,255,0.6)', fontSize: 15, textAlign: 'center', marginBottom: 30 },
  scoreBoard: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', width: '100%', padding: 20, borderRadius: 16 },
  scoreLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  scoreValue: { fontSize: 40, fontWeight: '900' },
  scorePass: { color: '#22c55e' },
  festScroll: { flex: 1 },
  festContent: { paddingHorizontal: 20, paddingBottom: 100 },
  festCard: { backgroundColor: 'rgba(15,25,50,0.65)', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(251,191,36,0.15)' },
  festHeader: { alignItems: 'center', paddingVertical: 18 },
  festTitle: { color: GitaColors.gold, fontSize: 30, fontWeight: '800', fontFamily: Fonts.serif, textAlign: 'center', lineHeight: 36 },
  festYear: { color: 'rgba(251,191,36,0.6)', fontSize: 16, marginTop: 4, fontWeight: '700', letterSpacing: 4, textAlign: 'center' },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, marginBottom: 20, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, paddingHorizontal: 24, paddingVertical: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  monthText: { color: 'white', fontSize: 20, fontWeight: '800', letterSpacing: 0.5 },
  monthArrow: { color: GitaColors.gold, fontSize: 36, fontWeight: '300', lineHeight: 36, paddingHorizontal: 10 },
  loaderArea: { paddingVertical: 60, alignItems: 'center' },
  emptyArea: { paddingVertical: 60, alignItems: 'center' },
  emptyText: { color: 'rgba(255,255,255,0.4)', fontSize: 16, textAlign: 'center' },
  festivalList: { marginTop: 4 },
  festivalItemCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  festItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 20, flex: 1 },
  symbolBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.2)',
  },
  festItemIcon: { fontSize: 28 },
  festItemMeta: { flex: 1 },
  festItemName: { color: 'white', fontSize: 20, fontWeight: '800', fontFamily: Fonts.serif, lineHeight: 24 },
  festItemDeity: { color: 'rgba(251, 191, 36, 0.7)', fontSize: 14, marginTop: 2, fontWeight: '600' },
  festItemDateText: { color: 'rgba(251, 191, 36, 0.5)', fontSize: 13, marginTop: 6, fontWeight: '700', letterSpacing: 0.5 },
  loaderCenterContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: 16 
  },
  loadingTextMain: {
    color: 'white',
    fontSize: 16,
    fontFamily: Fonts.serif,
    opacity: 0.8,
  },
  loadingText: {
    color: 'white',
    marginTop: 16,
    fontSize: 16,
    fontFamily: Fonts.serif,
    opacity: 0.8,
  },
});
