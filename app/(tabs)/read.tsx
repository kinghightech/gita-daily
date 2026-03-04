import BackgroundLayout from "@/components/BackgroundLayout";
import { GitaColors } from "@/constants/theme";
import { StyleSheet, Text, View } from "react-native";

export default function ReadScreen() {
  return (
    <BackgroundLayout>
      <View style={styles.container}>
        <Text style={styles.title}>Read the Gita</Text>
        <Text style={styles.subtitle}>
          Chapter-by-chapter reading will appear here
        </Text>
      </View>
    </BackgroundLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  title: {
    color: GitaColors.gold,
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    color: GitaColors.textMuted,
    fontSize: 16,
    marginTop: 8,
  },
});
