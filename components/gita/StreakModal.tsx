import React, { useMemo } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  Share,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { X, Flame, Trophy, Share2, Calendar } from "lucide-react-native";
import { GitaColors } from "@/constants/theme";

interface StreakModalProps {
  open: boolean;
  onClose: () => void;
  preferences: {
    streak_count?: number;
    longest_streak?: number;
    last_visit_date?: string;
  } | null;
}

export default function StreakModal({
  open,
  onClose,
  preferences,
}: StreakModalProps) {
  const streak = preferences?.streak_count ?? 0;
  const longest = preferences?.longest_streak ?? 0;
  const weeks = Math.floor(streak / 7);
  const { height: winHeight } = useWindowDimensions();

  const calendarDays = useMemo(() => {
    const days: {
      date: Date;
      dateStr: string;
      isToday: boolean;
      isActive: boolean;
      dayOfWeek: number;
    }[] = [];
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    for (let i = 34; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const daysDiff = Math.floor(
        (new Date(todayStr).getTime() - new Date(dateStr).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      const isActive = daysDiff < streak;
      days.push({
        date: d,
        dateStr,
        isToday: dateStr === todayStr,
        isActive,
        dayOfWeek: d.getDay(),
      });
    }
    return days;
  }, [streak]);

  const handleShare = async () => {
    try {
      await Share.share({
        title: "My Gita Streak",
        message: `🔥 I'm on a ${streak}-day streak reading the Bhagavad Gita on Gita Daily!\n\n"You have a right to perform your duties, but not to the fruits of your actions." — BG 2.47`,
      });
    } catch {}
  };

  if (!open) return null;

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { maxHeight: winHeight * 0.88 }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.dragHandle} />
          <View style={styles.sheetHeader}>
            <Pressable onPress={handleShare} hitSlop={12} style={styles.headerBtn}>
              <Share2 size={22} color={GitaColors.goldMuted} />
            </Pressable>
            <Pressable onPress={onClose} hitSlop={12} style={styles.headerBtn}>
              <X size={22} color={GitaColors.goldMuted} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.streakCircle}>
              <Flame size={32} color="white" />
            </View>
            <Text style={styles.streakLabel}>CURRENT STREAK</Text>
            <Text style={styles.streakValue}>{streak}</Text>
            <Text style={styles.streakSub}>days in a row</Text>

            <View style={styles.statsRow}>
              <View style={styles.statBlock}>
                <Trophy size={18} color={GitaColors.gold} />
                <Text style={styles.statValue}>{longest}</Text>
                <Text style={styles.statLabel}>Best streak</Text>
              </View>
              <View style={[styles.statBlock, styles.statBlockRight]}>
                <Calendar size={18} color={GitaColors.teal} />
                <Text style={styles.statValue}>{weeks}</Text>
                <Text style={styles.statLabel}>Weeks in a row</Text>
              </View>
            </View>

            <Text style={styles.calendarTitle}>LAST 5 WEEKS</Text>
            <View style={styles.weekdayRow}>
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <Text key={i} style={styles.weekdayCell}>
                  {d}
                </Text>
              ))}
            </View>
            <View style={styles.calendarGrid}>
              {calendarDays[0] &&
                Array.from({ length: calendarDays[0].dayOfWeek }).map((_, i) => (
                  <View key={`pad-${i}`} style={styles.calCell} />
                ))}
              {calendarDays.map((day, i) => (
                <View
                  key={i}
                  style={[
                    styles.calCell,
                    day.isToday && styles.calCellToday,
                    day.isActive && !day.isToday && styles.calCellActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.calCellText,
                      day.isToday && styles.calCellTextToday,
                      day.isActive && !day.isToday && styles.calCellTextActive,
                    ]}
                  >
                    {day.date.getDate()}
                  </Text>
                </View>
              ))}
            </View>
            <View style={{ height: 40 }} />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: GitaColors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: GitaColors.goldBorder,
    borderBottomWidth: 0,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: GitaColors.textMuted,
    alignSelf: "center",
    marginTop: 12,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    position: "absolute",
    left: 0,
    right: 0,
    top: 24,
    zIndex: 10,
  },
  headerBtn: { padding: 4 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingTop: 56,
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: "center",
  },
  streakCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: GitaColors.orange,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  streakLabel: {
    color: GitaColors.goldMuted,
    fontSize: 11,
    letterSpacing: 2,
  },
  streakValue: {
    color: GitaColors.text,
    fontSize: 40,
    fontWeight: "800",
  },
  streakSub: { color: GitaColors.textMuted, fontSize: 14, marginTop: 2 },
  statsRow: {
    flexDirection: "row",
    width: "100%",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: GitaColors.goldBorder,
    marginTop: 20,
  },
  statBlock: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    borderRightWidth: 1,
    borderColor: GitaColors.goldBorder,
  },
  statBlockRight: { borderRightWidth: 0 },
  statValue: {
    color: GitaColors.text,
    fontSize: 20,
    fontWeight: "800",
    marginTop: 4,
  },
  statLabel: { color: GitaColors.textMuted, fontSize: 12, marginTop: 2 },
  calendarTitle: {
    color: GitaColors.goldMuted,
    fontSize: 11,
    letterSpacing: 1,
    alignSelf: "flex-start",
    marginTop: 20,
    marginBottom: 8,
  },
  weekdayRow: {
    flexDirection: "row",
    width: "100%",
    marginBottom: 6,
  },
  weekdayCell: {
    flex: 1,
    textAlign: "center",
    color: GitaColors.textMuted,
    fontSize: 11,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
    gap: 4,
  },
  calCell: {
    width: "13%",
    aspectRatio: 1,
    maxWidth: 40,
    borderRadius: 8,
    backgroundColor: "rgba(30,41,59,0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  calCellToday: {
    backgroundColor: GitaColors.gold,
    borderWidth: 2,
    borderColor: "rgba(251,191,36,0.8)",
  },
  calCellActive: {
    backgroundColor: GitaColors.orange,
  },
  calCellText: { color: GitaColors.textMuted, fontSize: 12 },
  calCellTextToday: { color: "#0F172A", fontWeight: "800" },
  calCellTextActive: { color: "white" },
});
