// @ts-nocheck
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
    Bell,
    BookOpen,
    ChevronLeft,
    ChevronRight,
    Flame,
    GraduationCap,
    Heart,
    List,
    ScrollText,
    Shuffle,
    User,
    X,
} from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

interface OnboardingWalkthroughProps {
  onComplete: () => void;
}

interface Step {
  icon: any;
  title: string;
  subtitle: string;
  description: string;
  features?: Array<{ icon: any; label: string }>;
}

const STEPS: Step[] = [
  {
    icon: BookOpen,
    title: 'Welcome to Gita Daily',
    subtitle: 'Your daily companion to the Bhagavad Gita',
    description:
      'Every day, a new verse from the Bhagavad Gita awaits you — translated in English and Hindi, with audio, AI explanations, and more. Let us show you around.',
  },
  {
    icon: BookOpen,
    title: "Today's Verse",
    subtitle: 'Home',
    description:
      "Each day you'll receive a unique verse. You can listen to it, get an AI explanation, save it to your favourites, or share it with friends.",
    features: [
      { icon: Heart, label: 'Double-tap or tap ♡ to favourite a verse' },
      { icon: Shuffle, label: 'Use navigation to browse all verses' },
      { icon: BookOpen, label: "Tap 'Explain' for an AI-powered breakdown" },
    ],
  },
  {
    icon: List,
    title: 'All Verses',
    subtitle: 'Verses tab',
    description:
      'Browse the complete Bhagavad Gita — all 18 chapters. Search by keyword, filter by chapter, or use the Mood Search to find a verse that matches how you\'re feeling right now.',
    features: [
      { icon: List, label: 'Search or filter by chapter' },
      { icon: Heart, label: 'Mood Search — find verses by emotion' },
    ],
  },
  {
    icon: ScrollText,
    title: 'Read the Gita',
    subtitle: 'Read tab',
    description:
      'Read the Bhagavad Gita chapter by chapter in a clean, distraction-free format. Switch between English and Hindi translations as you go.',
    features: [
      { icon: ScrollText, label: 'Chapter-by-chapter reading experience' },
      { icon: BookOpen, label: 'Toggle English / Hindi translations' },
    ],
  },
  {
    icon: GraduationCap,
    title: 'Learn',
    subtitle: 'Learn tab',
    description:
      'Level up your understanding with guided lessons, quizzes, and the HinduAI chat assistant. Progress through lotus-path levels as you deepen your knowledge.',
    features: [
      { icon: GraduationCap, label: 'Structured lessons with quizzes' },
      { icon: BookOpen, label: 'Ask HinduAI any question about the Gita' },
    ],
  },
  {
    icon: Flame,
    title: 'Daily Streak',
    subtitle: 'Keep the flame alive',
    description:
      'Visit every day to keep your streak going. Tap the 🔥 streak pill at the top of Home to see your history, best streak, and calendar. Consistency is the path.',
    features: [
      { icon: Flame, label: 'Tap the streak pill to view detailed stats' },
      { icon: Bell, label: 'Enable daily email quotes in the settings below' },
    ],
  },
  {
    icon: User,
    title: 'Your Profile',
    subtitle: 'Profile tab',
    description:
      'View all your favourite verses, manage your preferences, and track your journey. Your saved verses are always one tap away.',
    features: [
      { icon: Heart, label: 'Access all your saved favourite verses' },
      { icon: User, label: 'Manage language & notification preferences' },
    ],
  },
];

export default function OnboardingWalkthrough({ onComplete }: OnboardingWalkthroughProps) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;
  const IconComponent = current.icon;

  const go = (next: number) => {
    setStep(Math.max(0, Math.min(next, STEPS.length - 1)));
  };

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.backdropTouch} />

        <ThemedView style={styles.card}>
          {/* Skip button */}
          <Pressable onPress={onComplete} style={styles.skipBtn}>
            <X size={20} color="rgba(251, 191, 36, 0.4)" />
          </Pressable>

          {/* Step dots */}
          <View style={styles.dotsRow}>
            {STEPS.map((_, i) => (
              <Pressable
                key={i}
                onPress={() => go(i)}
                style={[
                  styles.dot,
                  i === step ? styles.dotActive : styles.dotInactive,
                ]}
              />
            ))}
          </View>

          {/* Scrollable content */}
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Icon */}
            <View style={styles.iconContainer}>
              <IconComponent size={32} color="#ffffff" />
            </View>

            {/* Subtitle */}
            {current.subtitle && (
              <ThemedText style={styles.subtitle}>{current.subtitle}</ThemedText>
            )}

            {/* Title */}
            <ThemedText style={styles.title}>{current.title}</ThemedText>

            {/* Description */}
            <ThemedText style={styles.description}>{current.description}</ThemedText>

            {/* Features list */}
            {current.features && (
              <View style={styles.featuresList}>
                {current.features.map((f, i) => {
                  const FIcon = f.icon;
                  return (
                    <View key={i} style={styles.featureItem}>
                      <View style={styles.featureIcon}>
                        <FIcon size={14} color="#f59e0b" />
                      </View>
                      <ThemedText style={styles.featureLabel}>{f.label}</ThemedText>
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>

          {/* Navigation */}
          <View style={styles.navRow}>
            <Pressable
              onPress={() => go(step - 1)}
              disabled={isFirst}
              style={[styles.navBtn, isFirst && styles.navBtnDisabled]}
            >
              <ChevronLeft size={20} color="rgba(251, 191, 36, 0.5)" />
            </Pressable>

            {isLast ? (
              <Pressable onPress={onComplete} style={styles.ctaBtn}>
                <ThemedText style={styles.ctaBtnText}>Begin My Journey 🙏</ThemedText>
              </Pressable>
            ) : (
              <Pressable
                onPress={() => go(step + 1)}
                style={styles.ctaBtn}
              >
                <ThemedText style={styles.ctaBtnText}>
                  Next
                </ThemedText>
                <ChevronRight size={16} color="#111827" />
              </Pressable>
            )}

            <View style={styles.spacer} />
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  backdropTouch: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '85%',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    overflow: 'hidden',
    zIndex: 10,
  },
  skipBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 11,
    padding: 6,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 16,
  },
  dot: {
    borderRadius: 6,
  },
  dotActive: {
    width: 20,
    height: 6,
    backgroundColor: '#f59e0b',
  },
  dotInactive: {
    width: 6,
    height: 6,
    backgroundColor: 'rgba(71, 85, 105, 0.6)',
  },
  scrollContent: {
    paddingHorizontal: 28,
    paddingVertical: 16,
    minHeight: 280,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(245, 158, 11, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 11,
    color: 'rgba(245, 158, 11, 0.6)',
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: '#fcd34d',
    marginBottom: 12,
    lineHeight: 28,
  },
  description: {
    textAlign: 'center',
    fontSize: 13,
    color: 'rgba(254, 243, 199, 0.7)',
    lineHeight: 20,
    marginBottom: 16,
  },
  featuresList: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  featureIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  featureLabel: {
    flex: 1,
    fontSize: 12,
    color: 'rgba(254, 243, 199, 0.8)',
    lineHeight: 18,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingVertical: 28,
    gap: 12,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnDisabled: {
    opacity: 0,
  },
  ctaBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(245, 158, 11, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  ctaBtnText: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 13,
  },
  spacer: {
    width: 40,
  },
});
