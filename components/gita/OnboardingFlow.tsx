import { ThemedText } from '@/components/themed-text';
import { BookOpen, Flame, Heart, Share2, Sparkles } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

interface OnboardingFlowProps {
  onComplete: () => void;
}

const STEPS = [
  {
    icon: BookOpen,
    title: 'Welcome to Gita Daily',
    subtitle: 'Your daily dose of wisdom from the Bhagavad Gita',
    description:
      'Each day you receive a fresh verse from one of the most profound spiritual texts ever written — translated into clear, modern language.',
    color: '#f59e0b',
  },
  {
    icon: Sparkles,
    title: 'Daily Verses',
    subtitle: 'A new teaching, every day',
    description:
      'Swipe or tap arrows to explore verses. Each verse comes with an "Explain" button that gives you an easy-to-understand breakdown of its meaning.',
    color: '#06b6d4',
  },
  {
    icon: Flame,
    title: 'Build Your Streak',
    subtitle: 'Come back daily to keep your streak alive',
    description:
      'Every day you visit, your streak grows. Tap the flame icon at the top to see your streak calendar and share your progress with friends.',
    color: '#f97316',
  },
  {
    icon: Heart,
    title: 'Like & Save Verses',
    subtitle: 'Never lose a verse that speaks to you',
    description:
      'Tap the heart button — or double-tap anywhere on a verse card — to save it to your favorites. Find all saved verses in your Profile.',
    color: '#ef4444',
  },
  {
    icon: Share2,
    title: 'Share the Wisdom',
    subtitle: 'Spread peace and light',
    description:
      'Tap the share button on any verse to send it to friends or family. You can also enable daily email reminders from the Home page.',
    color: '#10b981',
  },
];

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];
  const IconComponent = current.icon;

  return (
    <View style={styles.container}>
      <View style={styles.decorBgTop} />
      <View style={styles.decorBgBottom} />

      <View style={styles.content}>
        {/* Step indicator */}
        <View style={styles.indicatorRow}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.indicator,
                i === step
                  ? styles.indicatorActive
                  : i < step
                    ? styles.indicatorComplete
                    : styles.indicatorInactive,
              ]}
            />
          ))}
        </View>

        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: current.color }]}>
          <IconComponent size={48} color="#ffffff" />
        </View>

        {/* Text */}
        <ThemedText style={styles.title}>{current.title}</ThemedText>
        <ThemedText style={styles.subtitle}>{current.subtitle}</ThemedText>
        <ThemedText style={styles.description}>{current.description}</ThemedText>

        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          <Pressable
            onPress={() => (isLast ? onComplete() : setStep(step + 1))}
            style={styles.primaryBtn}
          >
            <ThemedText style={styles.primaryBtnText}>
              {isLast ? 'Get Started' : 'Next'}
            </ThemedText>
          </Pressable>

          {!isLast && (
            <Pressable onPress={onComplete}>
              <ThemedText style={styles.skipText}>Skip intro</ThemedText>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  decorBgTop: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  decorBgBottom: {
    position: 'absolute',
    bottom: -40,
    left: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  indicatorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 40,
  },
  indicator: {
    height: 6,
    borderRadius: 3,
  },
  indicatorActive: {
    width: 32,
    backgroundColor: '#f59e0b',
  },
  indicatorComplete: {
    width: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.5)',
  },
  indicatorInactive: {
    width: 12,
    backgroundColor: 'rgba(71, 85, 105, 0.5)',
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fcd34d',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f59e0b',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: 'rgba(254, 243, 199, 0.6)',
    lineHeight: 22,
    marginBottom: 32,
    textAlign: 'center',
  },
  buttonsContainer: {
    width: '100%',
    gap: 12,
  },
  primaryBtn: {
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 16,
  },
  skipText: {
    color: 'rgba(251, 191, 36, 0.4)',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 8,
  },
});
