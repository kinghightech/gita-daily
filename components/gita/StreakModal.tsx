import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, Flame, Share2, Trophy, X } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, Share, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    Easing,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

interface StreakModalProps {
  open: boolean;
  onClose: () => void;
  preferences: {
    streak_count?: number;
    longest_streak?: number;
    last_visit_date?: string;
  } | null;
}

type CalendarDay = {
  date: Date;
  isToday: boolean;
  isActive: boolean;
  isCurrentMonth: boolean;
};

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function StreakModal({ open, onClose, preferences }: StreakModalProps) {
  const { height: screenHeight } = useWindowDimensions();
  const [isMounted, setIsMounted] = useState(open);
  const closeFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollOffsetY = useSharedValue(0);
  const canDrag = useSharedValue(true);
  const overlayOpacity = useSharedValue(0);
  const sheetTranslateY = useSharedValue(screenHeight);

  const streak = Math.max(0, preferences?.streak_count ?? 0);
  const longest = Math.max(streak, preferences?.longest_streak ?? 0);
  const weeksInRow = Math.floor(streak / 7);
  const sheetHeight = Math.round(screenHeight * 0.85);

  const closeModal = useCallback(() => {
    if (open) onClose();
  }, [onClose, open]);

  const { monthLabel, calendarWeeks } = useMemo(() => {
    const calendarCells: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const year = today.getFullYear();
    const month = today.getMonth();
    const monthStart = new Date(year, month, 1);
    const monthDays = new Date(year, month + 1, 0).getDate();
    const leadingDays = monthStart.getDay();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const streakStart = new Date(today);
    streakStart.setDate(today.getDate() - Math.max(streak - 1, 0));

    const toCell = (date: Date, isCurrentMonth: boolean): CalendarDay => {
      const cellDate = new Date(date);
      cellDate.setHours(0, 0, 0, 0);

      return {
        date: cellDate,
        isToday: cellDate.getTime() === today.getTime(),
        isActive: streak > 0 && cellDate >= streakStart && cellDate <= today,
        isCurrentMonth,
      };
    };

    for (let i = 0; i < leadingDays; i++) {
      const day = prevMonthDays - leadingDays + i + 1;
      calendarCells.push(toCell(new Date(year, month - 1, day), false));
    }

    for (let day = 1; day <= monthDays; day++) {
      calendarCells.push(toCell(new Date(year, month, day), true));
    }

    let trailingDay = 1;
    while (calendarCells.length % 7 !== 0 || calendarCells.length < 35) {
      calendarCells.push(toCell(new Date(year, month + 1, trailingDay), false));
      trailingDay += 1;
    }

    const weeks: CalendarDay[][] = [];
    for (let i = 0; i < calendarCells.length; i += 7) {
      weeks.push(calendarCells.slice(i, i + 7));
    }

    const label = today.toLocaleString(undefined, { month: 'long', year: 'numeric' });
    return { monthLabel: label.toUpperCase(), calendarWeeks: weeks };
  }, [streak]);

  const dragDownGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY(6)
        .failOffsetX([-22, 22])
        .onBegin(() => {
          canDrag.value = scrollOffsetY.value <= 0;
        })
        .onUpdate((event) => {
          if (!canDrag.value || event.translationY <= 0) return;

          const dragY = Math.min(event.translationY, sheetHeight);
          sheetTranslateY.value = dragY;
          overlayOpacity.value = Math.max(0.18, 1 - dragY / sheetHeight);
        })
        .onEnd((event) => {
          if (!canDrag.value) return;

          const shouldClose = event.translationY > sheetHeight * 0.18 || event.velocityY > 950;

          if (shouldClose) {
            runOnJS(closeModal)();
            return;
          }

          overlayOpacity.value = withTiming(1, { duration: 120, easing: Easing.out(Easing.cubic) });
          sheetTranslateY.value = withSpring(0, {
            damping: 28,
            stiffness: 260,
            mass: 1,
          });
        }),
    [canDrag, closeModal, overlayOpacity, scrollOffsetY, sheetHeight, sheetTranslateY]
  );

  useEffect(() => {
    if (open) {
      setIsMounted(true);
    }
  }, [open]);

  useEffect(() => {
    if (!isMounted) return;

    if (open) {
      if (closeFallbackTimerRef.current) {
        clearTimeout(closeFallbackTimerRef.current);
        closeFallbackTimerRef.current = null;
      }

      overlayOpacity.value = 0;
      sheetTranslateY.value = screenHeight;
      overlayOpacity.value = withTiming(1, { duration: 180, easing: Easing.out(Easing.cubic) });
      sheetTranslateY.value = withSpring(0, {
        damping: 28,
        stiffness: 260,
        mass: 1,
      });
      return;
    }

    if (closeFallbackTimerRef.current) {
      clearTimeout(closeFallbackTimerRef.current);
      closeFallbackTimerRef.current = null;
    }

    overlayOpacity.value = withTiming(0, { duration: 180, easing: Easing.in(Easing.cubic) });
    sheetTranslateY.value = withTiming(
      screenHeight,
      { duration: 220, easing: Easing.in(Easing.cubic) },
      (finished) => {
        if (finished) runOnJS(setIsMounted)(false);
      }
    );

    // Fallback: if timing callback gets interrupted, still unmount modal.
    closeFallbackTimerRef.current = setTimeout(() => {
      setIsMounted(false);
      closeFallbackTimerRef.current = null;
    }, 280);
  }, [isMounted, open, overlayOpacity, screenHeight, sheetTranslateY]);

  useEffect(() => {
    return () => {
      if (closeFallbackTimerRef.current) {
        clearTimeout(closeFallbackTimerRef.current);
        closeFallbackTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isMounted) {
      overlayOpacity.value = 0;
      sheetTranslateY.value = screenHeight;
    }
  }, [isMounted, overlayOpacity, screenHeight, sheetTranslateY]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.value }],
  }));

  const shareStreak = async () => {
    try {
      await Share.share({
        title: 'My Gita Daily Streak',
        message:
          streak > 0
            ? `I am on a ${streak}-day Bhagavad Gita reading streak in Gita Daily.`
            : 'I just started my Bhagavad Gita reading streak in Gita Daily.',
      });
    } catch {
      // User canceled share sheet.
    }
  };

  if (!isMounted) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[styles.overlay, overlayStyle]}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={closeModal} />

        <View style={styles.bottomWrap} pointerEvents="box-none">
          <Animated.View style={[styles.sheet, { height: sheetHeight }, sheetStyle]}>
            <LinearGradient
              colors={['#0f172a', '#111f45']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sheetGradient}
            >
              <GestureDetector gesture={dragDownGesture}>
                <View style={styles.dragArea}>
                  <View style={styles.dragHandle} />
                </View>
              </GestureDetector>

              <Pressable style={[styles.headerIconBtn, styles.headerLeft]} onPress={shareStreak} hitSlop={12}>
                <Share2 size={20} color="rgba(252,211,77,0.5)" />
              </Pressable>
              <Pressable style={[styles.headerIconBtn, styles.headerRight]} onPress={closeModal} hitSlop={12}>
                <X size={20} color="rgba(252,211,77,0.5)" />
              </Pressable>

              <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                bounces={false}
                overScrollMode="never"
                scrollEventThrottle={16}
                onScroll={(event) => {
                  scrollOffsetY.value = event.nativeEvent.contentOffset.y;
                }}
              >
                <View style={styles.currentHeader}>
                  <LinearGradient
                    colors={['#fbbf24', '#f97316']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.flameWrap}
                  >
                    <Flame size={28} color="#ffffff" />
                  </LinearGradient>

                  <Text style={styles.currentLabel}>CURRENT STREAK</Text>
                  <Text style={styles.currentValue}>{streak}</Text>
                  <Text style={styles.currentSub}>days in a row</Text>
                </View>

                <View style={styles.statsRow}>
                  <View style={[styles.statBlock, styles.statDivider]}>
                    <Trophy size={16} color="#fbbf24" />
                    <Text style={styles.statValue}>{longest}</Text>
                    <Text style={styles.statLabel}>Best streak</Text>
                  </View>

                  <View style={styles.statBlock}>
                    <Calendar size={16} color="#22d3ee" />
                    <Text style={styles.statValue}>{weeksInRow}</Text>
                    <Text style={styles.statLabel}>Weeks in a row</Text>
                  </View>
                </View>

                <Text style={styles.calendarTitle}>{monthLabel}</Text>

                <View style={styles.weekdayRow}>
                  {WEEKDAY_LABELS.map((day, index) => (
                    <Text key={`${day}-${index}`} style={styles.weekdayText}>
                      {day}
                    </Text>
                  ))}
                </View>

                <View style={styles.calendarWrap}>
                  {calendarWeeks.map((week, weekIndex) => (
                    <View key={`week-${weekIndex}`} style={styles.weekRow}>
                      {week.map((day, dayIndex) => {
                        const dayStyle = day.isToday
                          ? styles.dayToday
                          : day.isActive
                            ? styles.dayActive
                            : day.isCurrentMonth
                              ? styles.dayInactive
                              : styles.dayOutOfMonth;

                        const textStyle = day.isToday
                          ? styles.dayTextToday
                          : day.isActive
                            ? styles.dayTextActive
                            : day.isCurrentMonth
                              ? styles.dayTextInactive
                              : styles.dayTextOutOfMonth;

                        return (
                          <View key={`day-${weekIndex}-${dayIndex}-${day.date.getTime()}`} style={[styles.dayCell, dayStyle]}>
                            <Text style={[styles.dayTextBase, textStyle]}>{day.date.getDate()}</Text>
                          </View>
                        );
                      })}
                    </View>
                  ))}
                </View>

                <View style={styles.bottomSpace} />
              </ScrollView>
            </LinearGradient>
          </Animated.View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  bottomWrap: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  sheet: {
    width: '100%',
    maxWidth: 448,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.3)',
    borderBottomWidth: 0,
    shadowColor: '#000000',
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 18,
  },
  sheetGradient: {
    flex: 1,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#475569',
    alignSelf: 'center',
    marginTop: 10,
  },
  dragArea: {
    alignSelf: 'stretch',
    height: 74,
    justifyContent: 'flex-start',
  },
  headerIconBtn: {
    position: 'absolute',
    top: 14,
    padding: 6,
    zIndex: 10,
  },
  headerLeft: {
    left: 12,
  },
  headerRight: {
    right: 12,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 22,
  },
  currentHeader: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 16,
  },
  flameWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f59e0b',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    marginBottom: 10,
  },
  currentLabel: {
    color: 'rgba(252,211,77,0.7)',
    fontSize: 11,
    letterSpacing: 2.2,
    fontWeight: '600',
  },
  currentValue: {
    color: '#fdf6e3',
    fontSize: 42,
    fontWeight: '800',
    lineHeight: 46,
    marginTop: 2,
    fontFamily: 'serif',
  },
  currentSub: {
    color: 'rgba(252,211,77,0.6)',
    fontSize: 13,
    marginTop: 1,
  },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(251,191,36,0.2)',
  },
  statBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  statDivider: {
    borderRightWidth: 1,
    borderColor: 'rgba(251,191,36,0.2)',
  },
  statValue: {
    color: '#fdf6e3',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 3,
  },
  statLabel: {
    color: 'rgba(252,211,77,0.6)',
    fontSize: 11,
    marginTop: 2,
  },
  calendarTitle: {
    color: 'rgba(252,211,77,0.5)',
    fontSize: 11,
    letterSpacing: 1.4,
    fontWeight: '600',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 8,
  },
  weekdayRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 6,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    color: 'rgba(252,211,77,0.4)',
    fontSize: 12,
    fontWeight: '600',
  },
  calendarWrap: {
    paddingHorizontal: 20,
  },
  weekRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayInactive: {
    backgroundColor: 'rgba(30,41,59,0.6)',
  },
  dayOutOfMonth: {
    backgroundColor: 'rgba(30,41,59,0.35)',
  },
  dayActive: {
    backgroundColor: '#f59e0b',
  },
  dayToday: {
    backgroundColor: '#fbbf24',
    borderWidth: 3,
    borderColor: '#fcd34d',
  },
  dayTextBase: {
    fontSize: 12,
    fontWeight: '600',
  },
  dayTextInactive: {
    color: '#64748b',
  },
  dayTextOutOfMonth: {
    color: 'rgba(100,116,139,0.58)',
  },
  dayTextActive: {
    color: '#ffffff',
  },
  dayTextToday: {
    color: '#0f172a',
    fontWeight: '800',
  },
  bottomSpace: {
    height: 30,
  },
});
