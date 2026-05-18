import { getWorldPathBySlug } from '@/lib/worldPaths';
import { useTheme } from '@/hooks/useTheme';
import { GitaColors } from '@/constants/theme';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, BookOpen, ChevronRight, MapPin, Sparkles } from 'lucide-react-native';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Theme } from '@/theme/colors';

export default function WorldPathScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const path = getWorldPathBySlug(slug);

  if (!path) {
    return (
      <View style={[styles.root, styles.center, { paddingTop: insets.top + 24 }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.missingTitle}>Path not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.missingButton} activeOpacity={0.75}>
          <Text style={styles.missingButtonText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />

      <View style={[styles.navBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navButton} activeOpacity={0.72}>
          <ArrowLeft size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>
          {path.title}
        </Text>
        <View style={styles.navSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 38 }]}
      >
        <View style={[styles.hero, { borderColor: path.accent }]}>
          <View style={[styles.heroIcon, { backgroundColor: `${path.accent}24`, borderColor: path.accent }]}>
            <MapPin size={24} color={path.accent} strokeWidth={2.6} />
          </View>
          <View style={styles.testPill}>
            <Sparkles size={13} color={GitaColors.gold} />
            <Text style={styles.testPillText}>Test Page</Text>
          </View>
          <Text style={styles.heroTitle}>{path.title}</Text>
          <Text style={styles.heroSubtitle}>{path.subtitle}</Text>
          <Text style={styles.regionText}>{path.region}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <BookOpen size={17} color={GitaColors.gold} />
            <Text style={styles.sectionTitle}>Overview</Text>
          </View>
          <Text style={styles.bodyText}>{path.overview}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Sparkles size={17} color={GitaColors.gold} />
            <Text style={styles.sectionTitle}>Sample Lessons</Text>
          </View>
          <View style={styles.lessonList}>
            {path.testLessons.map((lesson, index) => (
              <View key={lesson} style={styles.lessonRow}>
                <View style={[styles.lessonNumber, { borderColor: path.accent }]}>
                  <Text style={styles.lessonNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.lessonText}>{lesson}</Text>
                <ChevronRight size={17} color={theme.subtextMuted} />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.background,
    },
    center: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      gap: 16,
    },
    navBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 18,
      paddingBottom: 12,
      backgroundColor: theme.background,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    navButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    navTitle: {
      flex: 1,
      color: theme.text,
      fontSize: 18,
      fontWeight: '900',
      textAlign: 'center',
      letterSpacing: 0,
      paddingHorizontal: 10,
    },
    navSpacer: {
      width: 42,
      height: 42,
    },
    scroll: {
      padding: 18,
      gap: 16,
    },
    hero: {
      borderWidth: 1,
      borderRadius: 24,
      padding: 20,
      alignItems: 'center',
      backgroundColor: theme.card,
      gap: 10,
    },
    heroIcon: {
      width: 58,
      height: 58,
      borderRadius: 29,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 2,
    },
    testPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
      backgroundColor: 'rgba(251,191,36,0.12)',
      borderWidth: 1,
      borderColor: 'rgba(251,191,36,0.22)',
    },
    testPillText: {
      color: GitaColors.gold,
      fontSize: 12,
      fontWeight: '900',
      letterSpacing: 0,
    },
    heroTitle: {
      color: theme.text,
      fontSize: 30,
      lineHeight: 34,
      fontWeight: '900',
      textAlign: 'center',
      letterSpacing: 0,
    },
    heroSubtitle: {
      color: GitaColors.gold,
      fontSize: 15,
      lineHeight: 21,
      fontWeight: '800',
      textAlign: 'center',
      letterSpacing: 0,
    },
    regionText: {
      color: theme.subtext,
      fontSize: 13,
      lineHeight: 19,
      textAlign: 'center',
      fontWeight: '600',
      letterSpacing: 0,
    },
    section: {
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
      padding: 18,
      gap: 12,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 15,
      fontWeight: '900',
      letterSpacing: 0,
    },
    bodyText: {
      color: theme.subtext,
      fontSize: 14,
      lineHeight: 21,
      fontWeight: '600',
      letterSpacing: 0,
    },
    lessonList: {
      gap: 10,
    },
    lessonRow: {
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: theme.card,
    },
    lessonNumber: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(251,191,36,0.08)',
    },
    lessonNumberText: {
      color: theme.textWarm,
      fontSize: 12,
      fontWeight: '900',
      letterSpacing: 0,
    },
    lessonText: {
      flex: 1,
      color: theme.text,
      fontSize: 14,
      lineHeight: 19,
      fontWeight: '700',
      letterSpacing: 0,
    },
    missingTitle: {
      color: theme.text,
      fontSize: 18,
      fontWeight: '900',
      letterSpacing: 0,
    },
    missingButton: {
      borderRadius: 999,
      paddingHorizontal: 18,
      paddingVertical: 10,
      backgroundColor: GitaColors.gold,
    },
    missingButtonText: {
      color: '#111827',
      fontSize: 14,
      fontWeight: '900',
      letterSpacing: 0,
    },
  });
}
