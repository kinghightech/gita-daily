import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
} from "react-native";
import {
  Flower2,
  Bot,
  Calendar,
  Send,
  BookOpen,
  Sparkles,
} from "lucide-react-native";
import { GitaColors } from "@/constants/theme";

type LearnTab = "lotus" | "ai" | "festivals";

export default function LearnScreen() {
  const [tab, setTab] = useState<LearnTab>("lotus");
  const [month, setMonth] = useState("February 2026");
  const [input, setInput] = useState("");

  return (
    <View style={styles.screen}>
      {/* Top tabs: Lotus Path | HinduAI | Festivals */}
      <View style={styles.topTabs}>
        <Pressable
          style={[styles.topTab, tab === "lotus" && styles.topTabActive]}
          onPress={() => setTab("lotus")}
        >
          <Flower2 size={18} color={tab === "lotus" ? "white" : GitaColors.text} />
          <Text
            style={[
              styles.topTabText,
              tab === "lotus" && styles.topTabTextActive,
            ]}
          >
            Lotus Path
          </Text>
        </Pressable>
        <Pressable
          style={[styles.topTab, tab === "ai" && styles.topTabActive]}
          onPress={() => setTab("ai")}
        >
          <Bot size={18} color={tab === "ai" ? "white" : GitaColors.text} />
          <Text
            style={[styles.topTabText, tab === "ai" && styles.topTabTextActive]}
          >
            HinduAI
          </Text>
        </Pressable>
        <Pressable
          style={[styles.topTab, tab === "festivals" && styles.topTabActive]}
          onPress={() => setTab("festivals")}
        >
          <Calendar size={18} color={tab === "festivals" ? "white" : GitaColors.text} />
          <Text
            style={[
              styles.topTabText,
              tab === "festivals" && styles.topTabTextActive,
            ]}
          >
            Festivals
          </Text>
        </Pressable>
      </View>

      {tab === "lotus" && <LotusPathView />}
      {tab === "ai" && <HinduAIView input={input} setInput={setInput} />}
      {tab === "festivals" && (
        <FestivalsView month={month} setMonth={setMonth} />
      )}
    </View>
  );
}

function LotusPathView() {
  const nodes = [1, 2, 3, 4, 5];
  return (
    <ScrollView
      style={styles.lotusScroll}
      contentContainerStyle={styles.lotusContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.lotusPath}>
        {nodes.map((n, i) => (
          <View
            key={n}
            style={[
              styles.lotusNode,
              i % 2 === 0 ? styles.lotusNodeRight : styles.lotusNodeLeft,
            ]}
          >
            <View style={[styles.lotusFlower, n === 5 && styles.lotusFlowerPink]}>
              <Text style={styles.lotusNumber}>{n}</Text>
            </View>
            {i < nodes.length - 1 && (
              <View
                style={[
                  styles.lotusConnector,
                  i % 2 === 0 ? styles.connectorRight : styles.connectorLeft,
                ]}
              />
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function HinduAIView({
  input,
  setInput,
}: {
  input: string;
  setInput: (s: string) => void;
}) {
  return (
    <ScrollView
      style={styles.aiScroll}
      contentContainerStyle={styles.aiContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.aiCard}>
        <View style={styles.aiHeader}>
          <View style={styles.aiAvatar}>
            <Bot size={28} color={GitaColors.gold} />
          </View>
          <View style={styles.aiTitleBlock}>
            <Text style={styles.aiTitle}>HinduAI</Text>
            <Text style={styles.aiSubtitle}>
              Ask me anything about Hinduism
            </Text>
          </View>
        </View>

        <View style={styles.aiWelcome}>
          <Text style={styles.aiWelcomeText}>
            Namaste! I can answer your questions about:
          </Text>
          <Text style={styles.aiWelcomeBullet}>
            • Anything related to Hinduism
          </Text>
          <Text style={styles.aiWelcomeBullet}>
            • Hindu philosophy — Vedanta, Yoga, Dharma, and more
          </Text>
          <Text style={styles.aiWelcomeText}>
            What would you like to learn about today?
          </Text>
        </View>

        <View style={styles.suggestedRow}>
          <Pressable style={styles.suggestedChip}>
            <Text style={styles.suggestedChipText}>What is the meaning of Om?</Text>
          </Pressable>
          <Pressable style={styles.suggestedChip}>
            <Text style={styles.suggestedChipText}>Explain the concept of Karma</Text>
          </Pressable>
          <Pressable style={styles.suggestedChip}>
            <Text style={styles.suggestedChipText}>Who is Lord Ganesha?</Text>
          </Pressable>
          <Pressable style={styles.suggestedChip}>
            <Text style={styles.suggestedChipText}>What are the Vedas?</Text>
          </Pressable>
        </View>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Ask about Hindu wisdom..."
            placeholderTextColor={GitaColors.textMuted}
            value={input}
            onChangeText={setInput}
          />
          <Pressable style={styles.sendBtn}>
            <Send size={22} color="white" />
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

function FestivalsView({
  month,
  setMonth,
}: {
  month: string;
  setMonth: (s: string) => void;
}) {
  return (
    <ScrollView
      style={styles.festScroll}
      contentContainerStyle={styles.festContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.festCard}>
        <View style={styles.festTitleRow}>
          <Calendar size={24} color={GitaColors.gold} />
          <Text style={styles.festTitle}>Indian Festival Calendar</Text>
        </View>
        <Text style={styles.festYear}>2026</Text>

        <View style={styles.monthRow}>
          <Pressable onPress={() => setMonth("January 2026")}>
            <Text style={styles.monthArrow}>‹</Text>
          </Pressable>
          <Text style={styles.monthText}>{month}</Text>
          <Pressable onPress={() => setMonth("March 2026")}>
            <Text style={styles.monthArrow}>›</Text>
          </Pressable>
        </View>

        <View style={styles.festivalCard}>
          <View>
            <Text style={styles.festivalName}>Maha Shivaratri</Text>
            <Text style={styles.festivalNameHindi}>महा शिवरात्रि</Text>
          </View>
          <View style={styles.festivalDateWrap}>
            <Text style={styles.festivalDate}>25</Text>
            <Sparkles size={14} color="white" />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: GitaColors.bg },
  topTabs: {
    flexDirection: "row",
    backgroundColor: GitaColors.bgCard,
    marginHorizontal: 20,
    marginTop: 56,
    marginBottom: 16,
    borderRadius: 14,
    padding: 4,
  },
  topTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  topTabActive: { backgroundColor: GitaColors.orange },
  topTabText: { color: GitaColors.text, fontSize: 14, fontWeight: "600" },
  topTabTextActive: { color: "white" },

  lotusScroll: { flex: 1 },
  lotusContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
    paddingTop: 20,
  },
  lotusPath: {
    alignItems: "center",
  },
  lotusNode: {
    alignItems: "center",
    marginBottom: 8,
  },
  lotusNodeLeft: { alignSelf: "flex-start" },
  lotusNodeRight: { alignSelf: "flex-end" },
  lotusFlower: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: GitaColors.orange,
    alignItems: "center",
    justifyContent: "center",
  },
  lotusFlowerPink: { backgroundColor: "#EC4899" },
  lotusNumber: {
    color: "white",
    fontSize: 20,
    fontWeight: "800",
  },
  lotusConnector: {
    width: 2,
    height: 40,
    backgroundColor: GitaColors.green,
    marginVertical: 4,
  },
  connectorLeft: { alignSelf: "flex-start", marginLeft: 31 },
  connectorRight: { alignSelf: "flex-end", marginRight: 31 },

  aiScroll: { flex: 1 },
  aiContent: { paddingHorizontal: 20, paddingBottom: 100 },
  aiCard: {
    backgroundColor: GitaColors.bgCard,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: GitaColors.goldBorder,
  },
  aiHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  aiAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(30,41,59,0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  aiTitleBlock: { flex: 1 },
  aiTitle: { color: GitaColors.text, fontSize: 20, fontWeight: "800" },
  aiSubtitle: { color: GitaColors.textMuted, fontSize: 14 },
  aiWelcome: {
    backgroundColor: "rgba(15,23,42,0.6)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  aiWelcomeText: {
    color: GitaColors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  aiWelcomeBullet: {
    color: GitaColors.text,
    fontSize: 15,
    marginTop: 8,
  },
  suggestedRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  suggestedChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: GitaColors.orange,
  },
  suggestedChipText: {
    color: GitaColors.text,
    fontSize: 13,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.6)",
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 14,
    color: GitaColors.text,
    fontSize: 16,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: GitaColors.orange,
    alignItems: "center",
    justifyContent: "center",
  },

  festScroll: { flex: 1 },
  festContent: { paddingHorizontal: 20, paddingBottom: 100 },
  festCard: {
    backgroundColor: GitaColors.bgCard,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: GitaColors.goldBorder,
  },
  festTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  festTitle: {
    color: GitaColors.gold,
    fontSize: 22,
    fontWeight: "700",
  },
  festYear: {
    color: GitaColors.gold,
    fontSize: 18,
    marginTop: 4,
  },
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    marginTop: 16,
  },
  monthText: {
    color: GitaColors.gold,
    fontSize: 16,
    fontWeight: "600",
  },
  monthArrow: {
    color: GitaColors.gold,
    fontSize: 28,
  },
  festivalCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 20,
    padding: 16,
    borderRadius: 14,
    backgroundColor: "#4F46E5",
    overflow: "hidden",
  },
  festivalName: {
    color: "white",
    fontSize: 18,
    fontWeight: "800",
  },
  festivalNameHindi: {
    color: "white",
    fontSize: 14,
    marginTop: 2,
  },
  festivalDateWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  festivalDate: {
    color: "white",
    fontSize: 28,
    fontWeight: "800",
  },
});
