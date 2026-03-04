import BackgroundLayout from "@/components/BackgroundLayout";
import { GitaColors } from "@/constants/theme";
import {
  BookOpen,
  Brain,
  ChevronDown,
  Filter,
  Flame,
  Heart,
  Leaf,
  Moon,
  Search,
  Shield,
  Sparkles,
  Sun,
  Zap,
} from "lucide-react-native";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const MOODS = [
  { id: "anxious", label: "Anxious", icon: Brain },
  { id: "sad", label: "Sad", icon: Moon },
  { id: "angry", label: "Angry", icon: Flame },
  { id: "confused", label: "Confused", icon: Zap },
  { id: "peace", label: "Seeking Peace", icon: Leaf },
  { id: "motivation", label: "Need Motivation", icon: Sun },
  { id: "fearful", label: "Fearful", icon: Shield },
  { id: "grateful", label: "Grateful", icon: Heart },
];

const MOCK_VERSES = [
  { id: "1.47", ref: "1.47", text: "Sanjaya said: Having thus spoken in the midst of the...", speaker: "Sanjaya" },
  { id: "1.1", ref: "1.1", text: "Dhritarashtra said: O Sanjaya, what did my sons...", speaker: "Dhritarashtra" },
  { id: "1.21", ref: "1.21", text: "Arjuna said: O Infallible One, please draw my chario...", speaker: "Arjuna" },
];

export default function VersesScreen() {
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  return (
    <BackgroundLayout>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Find Wisdom for Your Mood */}
        <View style={styles.moodSection}>
          <View style={styles.moodHeader}>
            <Sparkles size={24} color={GitaColors.gold} />
            <Text style={styles.moodTitle}>Find Wisdom for Your Mood</Text>
          </View>
          <Text style={styles.moodHint}>
            How are you feeling today? Select a mood to find a relevant verse.
            Click again for another verse.
          </Text>
          <View style={styles.moodGrid}>
            {MOODS.map((m) => {
              const Icon = m.icon;
              return (
                <Pressable key={m.id} style={styles.moodChip}>
                  <Icon size={22} color={GitaColors.gold} />
                  <Text style={styles.moodChipText}>{m.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Dotted separator */}
        <View style={styles.dottedSep} />

        {/* Select a Verse placeholder */}
        <View style={styles.selectSection}>
          <BookOpen size={48} color={GitaColors.gold} />
          <Text style={styles.selectTitle}>Select a Verse</Text>
          <Text style={styles.selectHint}>
            Click on any verse from the list to view it in detail with
            translations and audio
          </Text>
        </View>

        {/* All Verses list */}
        <Text style={styles.listTitle}>All Verses</Text>
        <Text style={styles.subtitle}>
          Explore the complete collection of wisdom
        </Text>

        <View style={styles.searchRow}>
          <Search size={20} color={GitaColors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search verses or type 2.47..."
            placeholderTextColor={GitaColors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <Pressable
          style={styles.filterRow}
          onPress={() => setFilterOpen(!filterOpen)}
        >
          <Filter size={20} color={GitaColors.textMuted} />
          <Text style={styles.filterText}>All Chapters</Text>
          <ChevronDown size={20} color={GitaColors.textMuted} />
        </Pressable>

        <View style={styles.list}>
          {MOCK_VERSES.map((v) => (
            <Pressable key={v.id} style={styles.verseCard}>
              <View style={styles.verseRefWrap}>
                <Text style={styles.verseRef}>{v.ref}</Text>
              </View>
              <View style={styles.verseContent}>
                <Text style={styles.verseText} numberOfLines={2}>
                  {v.text}
                </Text>
                <Text style={styles.verseSpeaker}>— {v.speaker}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </BackgroundLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 100,
  },
  title: {
    color: GitaColors.gold,
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    color: GitaColors.goldMuted,
    fontSize: 14,
    textAlign: "center",
    marginTop: 4,
  },
  moodSection: { marginBottom: 20 },
  moodHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  moodTitle: {
    color: GitaColors.gold,
    fontSize: 22,
    fontWeight: "800",
  },
  moodHint: {
    color: GitaColors.goldMuted,
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
  },
  moodGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 16,
  },
  moodChip: {
    width: "22%",
    minWidth: 72,
    backgroundColor: GitaColors.bgCard,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: GitaColors.goldBorder,
  },
  moodChipText: {
    color: GitaColors.gold,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 6,
    textAlign: "center",
  },
  dottedSep: {
    height: 1,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: GitaColors.goldBorder,
    marginBottom: 24,
  },
  selectSection: {
    alignItems: "center",
    marginBottom: 28,
  },
  selectTitle: {
    color: GitaColors.gold,
    fontSize: 20,
    fontWeight: "800",
    marginTop: 12,
  },
  selectHint: {
    color: GitaColors.goldMuted,
    fontSize: 14,
    textAlign: "center",
    marginTop: 6,
    paddingHorizontal: 24,
  },
  listTitle: {
    color: GitaColors.gold,
    fontSize: 24,
    fontWeight: "700",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: GitaColors.bgCard,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 20,
  },
  searchInput: {
    flex: 1,
    color: GitaColors.text,
    fontSize: 16,
    paddingVertical: 0,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: GitaColors.bgCard,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 10,
  },
  filterText: {
    flex: 1,
    color: GitaColors.textMuted,
    fontSize: 16,
  },
  list: { marginTop: 20, gap: 12 },
  verseCard: {
    flexDirection: "row",
    backgroundColor: GitaColors.bgCard,
    borderRadius: 14,
    padding: 14,
    alignItems: "flex-start",
    gap: 12,
  },
  verseRefWrap: {
    backgroundColor: GitaColors.gold,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    minWidth: 44,
    alignItems: "center",
  },
  verseRef: {
    color: GitaColors.bg,
    fontSize: 14,
    fontWeight: "800",
  },
  verseContent: { flex: 1 },
  verseText: {
    color: GitaColors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  verseSpeaker: {
    color: GitaColors.gold,
    fontSize: 13,
    marginTop: 4,
  },
});
