// @ts-nocheck
import { ChevronLeft, ChevronRight, Shuffle } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  onPrevious: () => void;
  onNext: () => void;
  onRandom: () => void;
  currentIndex: number;
  total: number;
};

export default function VerseNavigator({ onPrevious, onNext, onRandom, currentIndex, total }: Props) {
  return (
    <View style={styles.row}>
      <Pressable onPress={onPrevious} style={styles.iconBtn} hitSlop={10}>
        <ChevronLeft color="rgba(251,191,36,0.9)" size={22} />
      </Pressable>

      <Pressable onPress={onRandom} style={styles.pill}>
        <Shuffle color="rgba(251,191,36,0.95)" size={16} />
        <Text style={styles.pillText}>New Verse</Text>
        <Text style={styles.counter}>
          {currentIndex + 1}/{total}
        </Text>
      </Pressable>

      <Pressable onPress={onNext} style={styles.iconBtn} hitSlop={10}>
        <ChevronRight color="rgba(251,191,36,0.9)" size={22} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  iconBtn: {
    height: 40,
    width: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15,23,42,0.55)",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.25)",
    backgroundColor: "transparent",
  },
  pillText: { color: "rgba(251,191,36,0.9)", fontWeight: "700" },
  counter: { color: "rgba(251,191,36,0.55)", fontSize: 12, marginLeft: 4 },
});