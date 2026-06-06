import { Fonts, GitaColors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/theme/colors';
import { router } from 'expo-router';
import { BookOpen, ChevronLeft } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type IntroSection = {
  emoji: string;
  title: string;
  body?: string;
  bullets?: string[];
};

// Plain-English, accurate primer on the Bhagavad Gita. Written so a 10–15 year old
// (or anyone brand new to it) can understand before reading Chapter 1.
const SECTIONS: IntroSection[] = [
  {
    emoji: '📖',
    title: 'The Song of God',
    body:
      'The Bhagavad Gita (say it: BHUH-guh-vad GEE-ta) means "The Song of God." It is one of the most loved holy books in the world. At its heart, it is a conversation between a warrior named Arjuna and his guide and friend, Lord Krishna. In it, Krishna teaches Arjuna how to live a brave, honest, and peaceful life.',
  },
  {
    emoji: '📜',
    title: 'A Story Inside a Bigger Story',
    body:
      'The Gita is one part of a huge, ancient Indian epic called the Mahabharata. The Mahabharata tells the tale of two sets of cousins who could not agree on who should rule their kingdom. The Gita is the special moment, right before a great war, when Krishna shares his wisdom with Arjuna. It has 18 chapters and about 700 short verses.',
  },
  {
    emoji: '⚔️',
    title: 'A Battlefield and Two Families',
    body:
      'The whole story happens on a battlefield called Kurukshetra. Two armies stand ready to fight. On one side are Arjuna and his brothers, who were treated unfairly and had their kingdom taken away. On the other side are their own cousins, who refused to give it back. War became the last choice only after every attempt at peace had failed.',
  },
  {
    emoji: '💔',
    title: "Arjuna's Big Problem",
    body:
      'Just as the fighting is about to begin, Arjuna looks across the field and sees his own family, teachers, and old friends on the other side. His heart breaks. He does not want to hurt the people he loves. He lowers his bow, sits down in his chariot, and tells Krishna he would rather give up than cause so much pain. He feels lost, scared, and confused.',
  },
  {
    emoji: '🌟',
    title: 'What Krishna Teaches',
    body:
      'Krishna is Arjuna’s charioteer (the one driving his chariot) and also God in human form. He helps Arjuna find courage and calm. He does not only talk about the war — he shares deep lessons for everyday life:',
    bullets: [
      'Do your duty bravely, even when it is hard. This is called your "dharma."',
      "Always do your best, but don't stress about the reward. Focus on doing the right thing, not on what you will get for it.",
      'The soul never dies. Your body grows and changes, but the real "you" inside lives on forever.',
      'Stay calm and steady — in happy times and sad times alike.',
      'You are never alone. Loving and trusting God brings true peace.',
    ],
  },
  {
    emoji: '🌍',
    title: 'Why People Love It',
    body:
      'For thousands of years, people all over the world — not only Hindus — have turned to the Gita for guidance. Leaders like Mahatma Gandhi found great strength in it. People love it because, even though it begins on a battlefield, it is really about the battles inside each of us: our fears, our doubts, and our hardest choices. It offers simple, calming advice for living with purpose and peace.',
  },
];

export default function GitaIntroScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
            <ChevronLeft size={26} color={GitaColors.gold} />
          </Pressable>
          <View style={styles.headerCenter}>
            <BookOpen size={20} color={GitaColors.gold} />
            <Text style={styles.headerTitle}>What Is the Gita?</Text>
          </View>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Intro line */}
          <Text style={styles.lead}>
            A quick, simple guide before you begin reading. Take a minute here, then dive into
            Chapter 1.
          </Text>

          {SECTIONS.map((section, idx) => (
            <View key={idx} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardEmoji}>{section.emoji}</Text>
                <Text style={styles.cardTitle}>{section.title}</Text>
              </View>
              {section.body && <Text style={styles.cardBody}>{section.body}</Text>}
              {section.bullets && (
                <View style={styles.bulletList}>
                  {section.bullets.map((bullet, bIdx) => (
                    <View key={bIdx} style={styles.bulletRow}>
                      <Text style={styles.bulletDot}>•</Text>
                      <Text style={styles.bulletText}>{bullet}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Now you know the story behind the words. Enjoy your reading. 🪷
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    root: { flex: 1 },

    /* ── Header ── */
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerCenter: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    headerTitle: {
      color: theme.textWarm,
      fontSize: 20,
      fontWeight: '700',
      fontFamily: Fonts.serif,
    },
    headerRight: { width: 40 },

    /* ── Scroll ── */
    scroll: { flex: 1 },
    scrollContent: {
      paddingHorizontal: 16,
      paddingBottom: 60,
      gap: 16,
    },

    /* ── Lead ── */
    lead: {
      color: theme.subtext,
      fontSize: 15,
      lineHeight: 23,
      fontFamily: Fonts.serif,
      fontStyle: 'italic',
      textAlign: 'center',
      paddingHorizontal: 8,
      marginBottom: 4,
    },

    /* ── Card ── */
    card: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 18,
      padding: 18,
      gap: 12,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    cardEmoji: {
      fontSize: 26,
    },
    cardTitle: {
      flex: 1,
      color: theme.primary,
      fontSize: 19,
      fontWeight: '700',
      fontFamily: Fonts.serif,
    },
    cardBody: {
      color: theme.textWarm,
      fontSize: 16,
      lineHeight: 26,
      fontFamily: Fonts.serif,
    },

    /* ── Bullets ── */
    bulletList: {
      gap: 10,
      marginTop: 2,
    },
    bulletRow: {
      flexDirection: 'row',
      gap: 10,
    },
    bulletDot: {
      color: GitaColors.gold,
      fontSize: 16,
      lineHeight: 26,
      fontWeight: '700',
    },
    bulletText: {
      flex: 1,
      color: theme.textWarm,
      fontSize: 16,
      lineHeight: 26,
      fontFamily: Fonts.serif,
    },

    /* ── Footer ── */
    footer: {
      alignItems: 'center',
      paddingVertical: 16,
    },
    footerText: {
      color: theme.subtextMuted,
      fontSize: 14,
      fontStyle: 'italic',
      fontFamily: Fonts.serif,
      textAlign: 'center',
    },
  });
