import BackgroundLayout from "@/components/BackgroundLayout";
import { GitaColors } from "@/constants/theme";
import {
    Award,
    BookOpen,
    Calendar,
    Camera,
    ChevronDown,
    Flame,
    Globe,
    Heart,
    LogOut,
    Star,
    Target,
    Trash2,
} from "lucide-react-native";
import { useState } from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View
} from "react-native";

export default function ProfileScreen() {
  const [language, setLanguage] = useState("English");

  return (
    <BackgroundLayout>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar} />
            <Pressable style={styles.cameraBtn}>
              <Camera size={18} color="white" />
            </Pressable>
          </View>
          <Text style={styles.userName}>Aahish Abbani</Text>
          <Text style={styles.userEmail}>aahish.abbani@gmail.com</Text>
        </View>

        {/* Stats cards */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.statCardStreak]}>
            <Flame size={28} color="white" />
            <Text style={styles.statNumber}>1</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={[styles.statCard, styles.statCardLessons]}>
            <BookOpen size={28} color="white" />
            <Text style={styles.statNumber}>19/15</Text>
            <Text style={styles.statLabel}>Lessons</Text>
          </View>
        </View>

        {/* Default Language */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Globe size={20} color={GitaColors.gold} />
            <Text style={styles.sectionTitle}>Default Language</Text>
          </View>
          <Pressable style={styles.dropdown}>
            <Text style={styles.dropdownText}>{language}</Text>
            <ChevronDown size={20} color={GitaColors.goldMuted} />
          </Pressable>
          <Text style={styles.sectionHint}>
            All verses will display in your chosen language by default
          </Text>
        </View>

        {/* Account actions */}
        <View style={styles.actionsRow}>
          <Pressable style={styles.actionBtn}>
            <LogOut size={20} color={GitaColors.gold} />
            <Text style={styles.actionTextGold}>Sign Out</Text>
          </Pressable>
          <Pressable style={styles.actionBtn}>
            <Trash2 size={20} color={GitaColors.red} />
            <Text style={styles.actionTextRed}>Delete Account</Text>
          </Pressable>
        </View>

        {/* Favorite Verses */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Heart size={20} color={GitaColors.red} />
            <Text style={styles.sectionTitle}>Favorite Verses</Text>
          </View>
          <View style={styles.favCard}>
            <View style={styles.favRefRow}>
              <Text style={styles.favRef}>18.2</Text>
              <Heart size={16} color={GitaColors.red} fill={GitaColors.red} />
            </View>
            <Text style={styles.favText} numberOfLines={2}>
              &quot;The Supreme Lord said: The sages understand sannyasa to be the
              renunciation of actions...
            </Text>
          </View>
        </View>

        {/* Badges */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Award size={20} color={GitaColors.gold} />
            <Text style={styles.sectionTitle}>Badges</Text>
          </View>
          <View style={styles.badgeGrid}>
            <View style={[styles.badgeCard, styles.badgeWelcome]}>
              <View style={styles.badgeIconWrap}>
                <Star size={24} color="white" />
              </View>
              <Text style={styles.badgeName}>Welcome</Text>
              <Text style={styles.badgeDesc}>Joined the journey</Text>
            </View>
            <View style={[styles.badgeCard, styles.badgeStreak]}>
              <View style={styles.badgeIconWrap}>
                <Flame size={24} color="white" />
              </View>
              <Text style={styles.badgeName}>7-Day Streak</Text>
              <Text style={styles.badgeDesc}>7 days in a row</Text>
            </View>
            <View style={[styles.badgeCard, styles.badgeLocked]}>
              <View style={styles.badgeIconWrap}>
                <Award size={24} color={GitaColors.textMuted} />
              </View>
              <Text style={[styles.badgeName, styles.badgeNameMuted]}>
                21-Day Streak
              </Text>
              <Text style={styles.badgeDescMuted}>21 days in a row</Text>
            </View>
            <View style={[styles.badgeCard, styles.badgeLessons]}>
              <View style={styles.badgeIconWrap}>
                <BookOpen size={24} color="white" />
              </View>
              <Text style={styles.badgeName}>5 Levels Done</Text>
              <Text style={styles.badgeDesc}>Completed 5 lessons</Text>
            </View>
          </View>
        </View>

        {/* Your Journey */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Award size={20} color={GitaColors.gold} />
            <Text style={styles.sectionTitle}>Your Journey</Text>
          </View>
          <View style={styles.journeyList}>
            <View style={styles.journeyRow}>
              <Calendar size={20} color={GitaColors.teal} />
              <Text style={styles.journeyLabel}>Last Visit</Text>
              <Text style={styles.journeyValue}>Feb 27, 2026</Text>
            </View>
            <View style={styles.journeyRow}>
              <Target size={20} color={GitaColors.green} />
              <Text style={styles.journeyLabel}>Current Level</Text>
              <Text style={styles.journeyValue}>Level 20</Text>
            </View>
            <View style={styles.journeyRow}>
              <Star size={20} color={GitaColors.gold} />
              <Text style={styles.journeyLabel}>Member Since</Text>
              <Text style={styles.journeyValue}>Jan 15, 2026</Text>
            </View>
            <View style={[styles.journeyRow, styles.journeyRowLast]}>
              <Heart size={20} color={GitaColors.red} />
              <Text style={styles.journeyLabel}>Favorites</Text>
              <Text style={styles.journeyValue}>4 verses</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </BackgroundLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 24,
  },
  profileHeader: { alignItems: "center", marginBottom: 24 },
  avatarWrap: { position: "relative" },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "white",
    borderWidth: 3,
    borderColor: GitaColors.gold,
  },
  cameraBtn: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: GitaColors.orange,
    alignItems: "center",
    justifyContent: "center",
  },
  userName: {
    color: GitaColors.gold,
    fontSize: 24,
    fontWeight: "800",
    marginTop: 12,
  },
  userEmail: {
    color: GitaColors.goldMuted,
    fontSize: 14,
    marginTop: 4,
  },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
  },
  statCardStreak: { backgroundColor: "#5B4B3A" },
  statCardLessons: { backgroundColor: "#1E3A3A" },
  statNumber: { color: "white", fontSize: 28, fontWeight: "800", marginTop: 8 },
  statLabel: { color: GitaColors.textMuted, fontSize: 13, marginTop: 4 },
  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    color: GitaColors.gold,
    fontSize: 18,
    fontWeight: "700",
  },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: GitaColors.bgCard,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: GitaColors.goldBorder,
  },
  dropdownText: { color: GitaColors.text, fontSize: 16 },
  sectionHint: {
    color: GitaColors.textMuted,
    fontSize: 13,
    marginTop: 8,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  actionTextGold: { color: GitaColors.gold, fontSize: 15, fontWeight: "600" },
  actionTextRed: { color: GitaColors.red, fontSize: 15, fontWeight: "600" },
  favCard: {
    backgroundColor: GitaColors.bgCard,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: GitaColors.goldBorder,
  },
  favRefRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  favRef: { color: GitaColors.gold, fontSize: 16, fontWeight: "700" },
  favText: {
    color: GitaColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  badgeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  badgeCard: {
    width: "47%",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  badgeWelcome: { backgroundColor: GitaColors.gold },
  badgeStreak: { backgroundColor: GitaColors.orange },
  badgeLocked: { backgroundColor: GitaColors.bgCard },
  badgeLessons: { backgroundColor: GitaColors.green },
  badgeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  badgeName: { color: "white", fontSize: 16, fontWeight: "800" },
  badgeNameMuted: { color: GitaColors.textMuted },
  badgeDesc: { color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 2 },
  badgeDescMuted: { color: GitaColors.textMuted, fontSize: 12, marginTop: 2 },
  journeyList: {
    backgroundColor: GitaColors.bgCard,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: GitaColors.goldBorder,
  },
  journeyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(251,191,36,0.1)",
  },
  journeyRowLast: { borderBottomWidth: 0 },
  journeyLabel: {
    flex: 1,
    color: GitaColors.text,
    fontSize: 15,
    marginLeft: 12,
  },
  journeyValue: {
    color: GitaColors.gold,
    fontSize: 15,
    fontWeight: "600",
  },
});
