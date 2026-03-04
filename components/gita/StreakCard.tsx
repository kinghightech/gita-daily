import { Flame, HeartCrack } from "lucide-react-native";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  streak?: number;
  lastVisit?: string; // ISO date
};

export default function StreakCard({ streak = 0, lastVisit }: Props) {
  const streakLost = useMemo(() => {
    if (!lastVisit) return false;
    const today = new Date().toISOString().split("T")[0];
    const lastStr = lastVisit.split("T")[0];
    if (lastStr === today) return false;
    const diffMs = new Date(today).getTime() - new Date(lastStr).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return diffDays > 1;
  }, [lastVisit]);

  const isOnFire = streak >= 7;

  return (
    <View style={[styles.card, streakLost ? styles.cardLost : styles.cardOk]}>
      <View style={styles.row}>
        <View style={[styles.iconWrap, streakLost ? styles.iconLost : streak > 0 ? styles.iconHot : styles.iconOff]}>
          {streakLost ? (
            <HeartCrack color="rgba(252,165,165,0.95)" size={26} />
          ) : (
            <Flame color={streak > 0 ? "white" : "rgba(148,163,184,0.9)"} size={26} />
          )}
        </View>

        <View style={{ flex: 1 }}>
          {streakLost ? (
            <>
              <Text style={styles.lostLabel}>STREAK LOST</Text>
              <Text style={styles.lostTitle}>Come back today!</Text>
              <Text style={styles.lostSub}>Start fresh — your journey continues</Text>
            </>
          ) : (
            <>
              <Text style={styles.label}>DAILY STREAK</Text>
              <Text style={styles.value}>
                {streak} <Text style={styles.valueUnit}>days</Text>
              </Text>
            </>
          )}
        </View>

        {isOnFire && !streakLost ? (
          <View style={{ alignItems: "center", gap: 4 }}>
            <View style={styles.fireBadge}>
              <Flame color="white" size={18} />
            </View>
            <Text style={styles.fireText}>On Fire!</Text>
          </View>
        ) : null}
      </View>

      {!streakLost && streak > 0 ? (
        <View style={styles.barRow}>
          {Array.from({ length: Math.min(streak, 7) }).map((_, i) => (
            <View key={`on-${i}`} style={styles.barOn} />
          ))}
          {Array.from({ length: Math.max(0, 7 - streak) }).map((_, i) => (
            <View key={`off-${i}`} style={styles.barOff} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.25)",
    backgroundColor: "rgba(15,23,42,0.55)",
  },
  cardOk: {},
  cardLost: { borderColor: "rgba(248,113,113,0.3)" },

  row: { flexDirection: "row", alignItems: "center", gap: 12 },

  iconWrap: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  iconHot: { backgroundColor: "rgba(251,191,36,0.95)" },
  iconOff: { backgroundColor: "rgba(51,65,85,0.9)" },
  iconLost: { backgroundColor: "rgba(127,29,29,0.7)" },

  label: { color: "rgba(251,191,36,0.7)", fontSize: 12, letterSpacing: 2 },
  value: { color: "rgba(254,243,199,1)", fontSize: 34, fontWeight: "800" },
  valueUnit: { color: "rgba(251,191,36,0.6)", fontSize: 18, fontWeight: "400" },

  lostLabel: { color: "rgba(248,113,113,0.8)", fontSize: 12, letterSpacing: 2 },
  lostTitle: { color: "rgba(252,165,165,0.95)", fontSize: 24, fontWeight: "800" },
  lostSub: { color: "rgba(248,113,113,0.55)", marginTop: 2, fontSize: 12 },

  fireBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(251,191,36,0.95)",
    alignItems: "center",
    justifyContent: "center",
  },
  fireText: { color: "rgba(251,191,36,0.7)", fontSize: 12, fontWeight: "700" },

  barRow: { flexDirection: "row", gap: 6, marginTop: 12 },
  barOn: { flex: 1, height: 8, borderRadius: 999, backgroundColor: "rgba(251,191,36,0.95)" },
  barOff: { flex: 1, height: 8, borderRadius: 999, backgroundColor: "rgba(51,65,85,0.9)" },
});