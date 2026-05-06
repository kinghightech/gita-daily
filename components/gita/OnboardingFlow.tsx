import BackgroundLayout from '@/components/BackgroundLayout';
import { HapticButton } from '@/components/ui/HapticButton';
import { Fonts } from '@/constants/theme';
import { useVideoPlayer } from 'expo-video';
import {
    Bell,
    BookOpen,
    ChevronLeft,
    ChevronRight,
    Flower2,
    Globe,
    ListChecks,
    Shield,
    Sparkles,
} from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

type AuthChoice = 'email';
type AuthMode = 'signup' | 'login';
type PreferredLanguage = 'english' | 'hindi';

type OnboardingData = {
  fullName: string;
  goals: string[];
  remindersEnabled: boolean;
  preferredLanguage: PreferredLanguage;
  authChoice: AuthChoice;
  email: string | null;
  password: string | null;
  authMode: AuthMode;
};

interface OnboardingFlowProps {
  onComplete: (data: OnboardingData) => void;
  onReminderPreferenceChange?: (enabled: boolean) => Promise<void> | void;
}

type ReminderChoice = 'yes' | 'no' | null;
const TOTAL_STEPS = 6;
const INTRO_HEADLINE = "Did you know connecting back to your roots doesn't have to feel...";
const INTRO_WORDS = ['hard?', 'stressful?', 'complicated?'] as const;

function OnboardingIntroHero() {
  const [headlineLength, setHeadlineLength] = useState(0);
  const [wordIndex, setWordIndex] = useState(0);
  const [wordLength, setWordLength] = useState(0);
  const [wordPhase, setWordPhase] = useState<'typing' | 'holding' | 'deleting'>('typing');
  const cursorOpacity = useSharedValue(1);

  useEffect(() => {
    cursorOpacity.value = withRepeat(withTiming(0.18, { duration: 520 }), -1, true);
  }, [cursorOpacity]);

  useEffect(() => {
    if (headlineLength >= INTRO_HEADLINE.length) return;

    const timeout = setTimeout(() => {
      setHeadlineLength((current) => current + 1);
    }, headlineLength === 0 ? 220 : 34);

    return () => clearTimeout(timeout);
  }, [headlineLength]);

  useEffect(() => {
    if (headlineLength < INTRO_HEADLINE.length) return;

    const currentWord = INTRO_WORDS[wordIndex];

    if (wordPhase === 'typing') {
      if (wordLength >= currentWord.length) {
        const holdTimeout = setTimeout(() => setWordPhase('holding'), 850);
        return () => clearTimeout(holdTimeout);
      }

      const typeTimeout = setTimeout(() => {
        setWordLength((current) => current + 1);
      }, 70);

      return () => clearTimeout(typeTimeout);
    }

    if (wordPhase === 'holding') {
      const holdTimeout = setTimeout(() => setWordPhase('deleting'), 950);
      return () => clearTimeout(holdTimeout);
    }

    if (wordLength === 0) {
      const nextWordTimeout = setTimeout(() => {
        setWordIndex((current) => (current + 1) % INTRO_WORDS.length);
        setWordPhase('typing');
      }, 150);

      return () => clearTimeout(nextWordTimeout);
    }

    const deleteTimeout = setTimeout(() => {
      setWordLength((current) => current - 1);
    }, 38);

    return () => clearTimeout(deleteTimeout);
  }, [headlineLength, wordIndex, wordLength, wordPhase]);

  const cursorStyle = useAnimatedStyle(() => ({
    opacity: cursorOpacity.value,
  }));

  const displayedHeadline = INTRO_HEADLINE.slice(0, headlineLength);
  const displayedWord = INTRO_WORDS[wordIndex].slice(0, wordLength);
  const isHeadlineTyping = headlineLength < INTRO_HEADLINE.length;

  return (
    <View style={styles.heroBlock}>
      <View style={styles.heroTitleWrap}>
        <Text style={styles.heroTitleIntro}>Welcome to</Text>
        <Text numberOfLines={1} style={styles.heroTitleMain}>
          Dharma Daily
        </Text>
      </View>

      <Text style={styles.heroHeadline}>
        {displayedHeadline}
        {isHeadlineTyping ? <Animated.Text style={[styles.heroBodyCursor, cursorStyle]}>|</Animated.Text> : null}
      </Text>

      <View style={styles.heroWordRow}>
        <Text style={styles.heroWord}>{displayedWord || ' '}</Text>
        {!isHeadlineTyping ? <Animated.Text style={[styles.heroCursor, cursorStyle]}>|</Animated.Text> : null}
      </View>
    </View>
  );
}

export default function OnboardingFlow({ onComplete, onReminderPreferenceChange }: OnboardingFlowProps) {
  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState('');
  const [reminderChoice, setReminderChoice] = useState<ReminderChoice>(null);
  const [preferredLanguage, setPreferredLanguage] = useState<PreferredLanguage | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const pageTransition = useSharedValue(1);
  const direction = useSharedValue(1); // 1 for forward, -1 for backward
  // Local bundled asset for the full-screen onboarding background.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const backgroundVideoPlayer = useVideoPlayer(require('@/assets/images/onboarding.MOV'), (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  const pageAnimatedStyle = useAnimatedStyle(() => {
    const opacity = pageTransition.value;
    
    // When fading out (target 0), we want to slide OUT.
    // When fading in (target 1), we want to slide IN.
    // Actually, a simpler way is to just use direction to flip the start/end points.
    const translateX = (1 - pageTransition.value) * 50 * direction.value;

    return {
      opacity,
      transform: [{ translateX }],
    };
  });

  useEffect(() => {
    if (step < 0 || step > TOTAL_STEPS - 1) {
      setStep(0);
    }
  }, [step]);

  const canContinue = useMemo(() => {
    if (step === 0) return true;
    if (step === 1) return fullName.trim().length > 0;
    if (step === 3) return reminderChoice !== null;
    if (step === 4) return preferredLanguage !== null;

    if (step === 5) {
      if (authMode === 'signup') {
        return fullName.trim().length > 0 && email.trim().length > 0 && password.trim().length >= 6;
      }

      return email.trim().length > 0 && password.trim().length >= 6;
    }

    return true;
  }, [authMode, email, fullName, password, preferredLanguage, reminderChoice, step]);

  const setStepFromAnimation = (nextStep: number, isForward: boolean) => {
    setStep(nextStep);
    // On the way in, flip direction to come from the opposite side
    direction.value = isForward ? -1 : 1;
    
    pageTransition.value = 0;
    pageTransition.value = withTiming(1, {
      duration: 350,
      easing: Easing.bezier(0.33, 1, 0.68, 1),
    });
  };

  const animateToStep = (nextStep: number) => {
    const isForward = nextStep > step;
    // On the way out, slide in the primary direction
    direction.value = isForward ? 1 : -1;

    pageTransition.value = withTiming(
      0,
      {
        duration: 200,
        easing: Easing.bezier(0.33, 1, 0.68, 1),
      },
      (finished) => {
        if (!finished) return;
        runOnJS(setStepFromAnimation)(nextStep, isForward);
      }
    );
  };

  const requestNotificationsIfNeeded = async () => {
    if (reminderChoice !== 'yes') return;
  };

  const handleReminderChoice = async (choice: Exclude<ReminderChoice, null>) => {
    setReminderChoice(choice);

    try {
      await onReminderPreferenceChange?.(choice === 'yes');
    } catch (error) {
      console.warn('Failed to persist reminder preference during onboarding', error);
    }
  };

  const continueFlow = async () => {
    if (!canContinue) return;

    if (step === 3) {
      await requestNotificationsIfNeeded();
    }

    if (step < TOTAL_STEPS - 1) {
      animateToStep(step + 1);
      return;
    }

    onComplete({
      fullName: fullName.trim(),
      goals: [],
      remindersEnabled: reminderChoice === 'yes',
      preferredLanguage: preferredLanguage ?? 'english',
      authChoice: 'email',
      email: email.trim(),
      password,
      authMode,
    });
  };

  const goBackFlow = () => {
    if (step <= 0) return;
    animateToStep(step - 1);
  };

  const renderStepContent = () => {
    if (step === 0) {
      return (
        <>
          <OnboardingIntroHero />

          <View style={[styles.firstStepForm, styles.hiddenHeroForm]}>
            <Text style={styles.label}>What is your full name?</Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter your full name"
              placeholderTextColor="rgba(251,191,36,0.35)"
              style={styles.input}
            />

            <Text style={styles.helper}>Your name helps personalize your experience.</Text>
          </View>

          <View style={styles.hiddenLegacyBlock}>

          <Text style={styles.label}>What’s your full name?</Text>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="Enter your full name"
            placeholderTextColor="rgba(251,191,36,0.35)"
            style={styles.input}
          />

          <Text style={styles.helper}>Your name helps personalize your experience.</Text>
          </View>
        </>
      );
    }

    if (step === 1) {
      return (
        <>
          <Text style={styles.title}>Let&apos;s make this personal</Text>
          <Text style={styles.subtitle}>Tell us your name first, and we&apos;ll shape the journey around you.</Text>

          <View style={styles.firstStepForm}>
            <Text style={styles.label}>What is your full name?</Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter your full name"
              placeholderTextColor="rgba(251,191,36,0.35)"
              style={styles.input}
            />

            <Text style={styles.helper}>Your name helps personalize your experience.</Text>
          </View>

          <Text style={styles.title}>Daily wisdom, made simple</Text>
          <Text style={styles.subtitle}>
            We give daily quotes from the Bhagavad Gita that you can read anytime. You can like a quote by double
            tapping to save it, share it with others, listen to it, and explore more features as you grow in your
            journey.
          </Text>

          <View style={styles.featureList}>
            {[
              { icon: BookOpen, text: 'Read daily quotes' },
              { icon: Sparkles, text: 'Double tap to save' },
              { icon: Globe, text: 'Share with others' },
              { icon: Bell, text: 'Listen anytime' },
              { icon: Flower2, text: 'Explore more daily' },
            ].map(({ icon: Icon, text }) => (
              <View key={text} style={styles.featureRow}>
                <View style={styles.featureIcon}>
                  <Icon size={14} color="#fbbf24" />
                </View>
                <Text style={styles.featureText}>{text}</Text>
              </View>
            ))}
          </View>
        </>
      );
    }

    if (step === 2) {
      return (
        <>
          <Text style={styles.title}>Go deeper with Lotus Path and Festivals</Text>
          <Text style={styles.subtitle}>
            Lotus Path helps you connect back with your roots through bite-sized lessons that are simple, meaningful,
            and easy to finish. You can also explore the Festivals section, where you can learn about Hindu festivals
            and their meaning in an easy way.
          </Text>

          <View style={styles.cardList}>
            <View style={styles.infoCard}>
              <Flower2 size={18} color="#fbbf24" />
              <View style={styles.infoCopy}>
                <Text style={styles.infoTitle}>Lotus Path</Text>
                <Text style={styles.infoDesc}>Short lessons that help you learn Hindu teachings step by step.</Text>
              </View>
            </View>

            <View style={styles.infoCard}>
              <ListChecks size={18} color="#fbbf24" />
              <View style={styles.infoCopy}>
                <Text style={styles.infoTitle}>Festivals</Text>
                <Text style={styles.infoDesc}>Learn about Hindu festivals, what they mean, and why they are celebrated.</Text>
              </View>
            </View>
          </View>
        </>
      );
    }

    if (step === 3) {
      return (
        <>
          <Text style={styles.title}>Would you want daily reminders?</Text>
          <Text style={styles.subtitle}>Get gentle reminders to come back for your daily Gita quote and more.</Text>

          <View style={styles.choiceList}>
            <HapticButton
              style={[styles.choiceCard, reminderChoice === 'yes' && styles.choiceCardSelected]}
              onPress={() => {
                void handleReminderChoice('yes');
              }}
            >
              <Bell size={18} color={reminderChoice === 'yes' ? '#0f172a' : '#fbbf24'} />
              <Text style={[styles.choiceText, reminderChoice === 'yes' && styles.choiceTextSelected]}>Yes, remind me</Text>
            </HapticButton>

            <HapticButton
              style={[styles.choiceCard, reminderChoice === 'no' && styles.choiceCardSelected]}
              onPress={() => {
                void handleReminderChoice('no');
              }}
            >
              <Shield size={18} color={reminderChoice === 'no' ? '#0f172a' : '#fbbf24'} />
              <Text style={[styles.choiceText, reminderChoice === 'no' && styles.choiceTextSelected]}>No, maybe later</Text>
            </HapticButton>
          </View>
        </>
      );
    }

    if (step === 4) {
      return (
        <>
          <Text style={styles.title}>Choose your preferred language</Text>
          <Text style={styles.subtitle}>Pick the language you want to read your daily verses in.</Text>

          <View style={styles.choiceList}>
            <HapticButton
              style={[styles.choiceCard, preferredLanguage === 'english' && styles.choiceCardSelected]}
              onPress={() => setPreferredLanguage('english')}
            >
              <Globe size={18} color={preferredLanguage === 'english' ? '#0f172a' : '#fbbf24'} />
              <Text style={[styles.choiceText, preferredLanguage === 'english' && styles.choiceTextSelected]}>English</Text>
            </HapticButton>

            <HapticButton
              style={[styles.choiceCard, preferredLanguage === 'hindi' && styles.choiceCardSelected]}
              onPress={() => setPreferredLanguage('hindi')}
            >
              <Globe size={18} color={preferredLanguage === 'hindi' ? '#0f172a' : '#fbbf24'} />
              <Text style={[styles.choiceText, preferredLanguage === 'hindi' && styles.choiceTextSelected]}>Hindi</Text>
            </HapticButton>
          </View>
        </>
      );
    }

    return (
      <>
        <Text style={styles.title}>Save your journey</Text>
        <Text style={styles.subtitle}>
          {authMode === 'signup'
            ? 'Create an account to save your streaks, favorites, progress, and daily journey across devices.'
            : 'Log in to continue your saved journey across devices.'}
        </Text>

        <View style={styles.modeSwitchWrap}>
          <HapticButton
            style={[styles.modeSwitchBtn, authMode === 'signup' && styles.modeSwitchBtnActive]}
            onPress={() => setAuthMode('signup')}
          >
            <Text style={[styles.modeSwitchText, authMode === 'signup' && styles.modeSwitchTextActive]}>
              Create Account
            </Text>
          </HapticButton>

          <HapticButton
            style={[styles.modeSwitchBtn, authMode === 'login' && styles.modeSwitchBtnActive]}
            onPress={() => setAuthMode('login')}
          >
            <Text style={[styles.modeSwitchText, authMode === 'login' && styles.modeSwitchTextActive]}>
              Log In
            </Text>
          </HapticButton>
        </View>

        <View style={styles.emailFieldsWrap}>
          {authMode === 'signup' && (
            <>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your full name"
                placeholderTextColor="rgba(251,191,36,0.35)"
                style={styles.input}
              />
            </>
          )}

          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            placeholderTextColor="rgba(251,191,36,0.35)"
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder={authMode === 'signup' ? 'Create a password' : 'Enter your password'}
            placeholderTextColor="rgba(251,191,36,0.35)"
            secureTextEntry
            style={styles.input}
          />

          <Text style={styles.helper}>
            {authMode === 'signup'
              ? 'Password must be at least 6 characters.'
              : 'Use the email and password from your existing account.'}
          </Text>
        </View>

        <Text style={styles.helper}>Your progress, saved in one place.</Text>
      </>
    );
  };

  return (
    <BackgroundLayout backgroundPlayer={backgroundVideoPlayer}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
      >
        <View style={styles.contentWrap}>
          {step > 0 && (
            <HapticButton
              onPress={goBackFlow}
              style={styles.backBtn}
            >
              <ChevronLeft size={22} color="#fef3c7" />
            </HapticButton>
          )}

          <View style={styles.progressRow}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <View key={`step-${i}`} style={[styles.progressDot, i <= step ? styles.progressDotActive : styles.progressDotInactive]} />
            ))}
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          >
            <Animated.View style={[styles.stepBlock, pageAnimatedStyle]}>{renderStepContent()}</Animated.View>
          </ScrollView>

          <HapticButton
            onPress={continueFlow}
            disabled={!canContinue}
            style={[
              styles.continueBtn,
              step === 0 && styles.introContinueBtn,
              !canContinue && styles.continueBtnDisabled,
            ]}
          >
            <Text
              style={[
                styles.continueText,
                step === 0 && styles.introContinueBtnText,
                !canContinue && styles.continueTextDisabled,
              ]}
            >
              {step === 0
                ? 'Start My Journey'
                : step === TOTAL_STEPS - 1
                  ? (authMode === 'signup' ? 'Finish' : 'Log In')
                  : 'Continue'}
            </Text>
            {step > 0 && step < TOTAL_STEPS - 1 && (
              <ChevronRight size={16} color={!canContinue ? 'rgba(15,23,42,0.45)' : '#0f172a'} />
            )}
          </HapticButton>
        </View>
      </KeyboardAvoidingView>
    </BackgroundLayout>
  );
}

const styles = StyleSheet.create({
  keyboardAvoiding: {
    flex: 1,
  },
  contentWrap: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 20,
  },
  backBtn: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    justifyContent: 'center',
  },
  progressDot: {
    height: 6,
    borderRadius: 999,
  },
  progressDotActive: {
    width: 26,
    backgroundColor: '#fbbf24',
  },
  progressDotInactive: {
    width: 10,
    backgroundColor: 'rgba(100,116,139,0.55)',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  stepBlock: {
    paddingTop: 8,
    flexGrow: 1,
  },
  heroBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 0,
    paddingBottom: 120,
    paddingHorizontal: 16,
  },
  heroTitle: {
    color: '#FFF4CF',
    fontSize: 58,
    lineHeight: 60,
    fontWeight: '700',
    fontFamily: Fonts.serif,
    textAlign: 'center',
    letterSpacing: -1.1,
    marginBottom: 20,
    textShadowColor: 'rgba(0,0,0,0.16)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  heroTitleWrap: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  heroTitleIntro: {
    color: '#FFF4CF',
    fontSize: 44,
    lineHeight: 48,
    fontWeight: '700',
    fontFamily: Fonts.serif,
    textAlign: 'center',
    letterSpacing: -0.8,
    textShadowColor: 'rgba(0,0,0,0.16)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  heroTitleMain: {
    color: '#FFF4CF',
    fontSize: 42,
    lineHeight: 46,
    fontWeight: '700',
    fontFamily: Fonts.serif,
    textAlign: 'center',
    letterSpacing: -0.8,
    width: '100%',
    maxWidth: 360,
    textShadowColor: 'rgba(0,0,0,0.16)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  heroHeadline: {
    color: '#fef3c7',
    fontSize: 42,
    lineHeight: 48,
    fontWeight: '600',
    fontFamily: Fonts.serif,
    textAlign: 'center',
    letterSpacing: -0.65,
    minHeight: 192,
    maxWidth: 340,
    textShadowColor: 'rgba(0,0,0,0.18)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 14,
  },
  heroBodyCursor: {
    color: '#FCD34D',
    fontSize: 42,
    lineHeight: 48,
  },
  heroWordRow: {
    minHeight: 72,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'nowrap',
    minWidth: 220,
  },
  heroWord: {
    color: '#fcd34d',
    fontSize: 42,
    lineHeight: 48,
    fontFamily: Fonts.serif,
    fontStyle: 'italic',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.22)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  heroCursor: {
    color: '#fcd34d',
    fontSize: 30,
    lineHeight: 48,
    marginLeft: 2,
  },
  firstStepForm: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.18)',
    backgroundColor: 'rgba(15,23,42,0.42)',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  hiddenHeroForm: {
    display: 'none',
  },
  hiddenLegacyBlock: {
    display: 'none',
  },
  title: {
    color: '#fef3c7',
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700',
    fontFamily: Fonts.serif,
    marginBottom: 10,
  },
  subtitle: {
    color: 'rgba(251,191,36,0.75)',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 22,
  },
  label: {
    color: '#fcd34d',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    backgroundColor: 'rgba(30,41,59,0.65)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.28)',
    color: '#fef3c7',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 10,
  },
  helper: {
    color: 'rgba(251,191,36,0.5)',
    fontSize: 13,
    marginTop: 4,
  },
  featureList: {
    gap: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.2)',
    backgroundColor: 'rgba(30,41,59,0.45)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  featureIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(251,191,36,0.15)',
  },
  featureText: {
    color: '#fef3c7',
    fontSize: 14,
    flex: 1,
  },
  cardList: {
    gap: 12,
  },
  infoCard: {
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.2)',
    backgroundColor: 'rgba(30,41,59,0.45)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  infoCopy: {
    flex: 1,
  },
  infoTitle: {
    color: '#fef3c7',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  infoDesc: {
    color: 'rgba(251,191,36,0.7)',
    fontSize: 13,
    lineHeight: 19,
  },
  choiceList: {
    gap: 12,
  },
  choiceCard: {
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.24)',
    backgroundColor: 'rgba(30,41,59,0.45)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  choiceCardSelected: {
    backgroundColor: '#fbbf24',
    borderColor: '#fcd34d',
  },
  choiceText: {
    color: '#fef3c7',
    fontSize: 15,
    fontWeight: '600',
  },
  choiceTextSelected: {
    color: '#0f172a',
  },
  authButtons: {
    gap: 10,
  },
  authBtn: {
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.24)',
    backgroundColor: 'rgba(30,41,59,0.45)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  authBtnSelected: {
    backgroundColor: '#fbbf24',
    borderColor: '#fcd34d',
  },
  authBtnText: {
    color: '#fef3c7',
    fontSize: 15,
    fontWeight: '700',
  },
  authBtnTextSelected: {
    color: '#0f172a',
  },
  modeSwitchWrap: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  modeSwitchBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.24)',
    backgroundColor: 'rgba(30,41,59,0.45)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeSwitchBtnActive: {
    backgroundColor: '#fbbf24',
    borderColor: '#fcd34d',
  },
  modeSwitchText: {
    color: '#fef3c7',
    fontSize: 14,
    fontWeight: '700',
  },
  modeSwitchTextActive: {
    color: '#0f172a',
  },
  emailFieldsWrap: {
    marginTop: 10,
  },
  continueBtn: {
    marginTop: 10,
    borderRadius: 16,
    backgroundColor: '#fbbf24',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  introContinueBtn: {
    marginTop: 2,
    marginBottom: 8,
    backgroundColor: 'rgba(251, 191, 36, 0.24)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.38)',
    paddingHorizontal: 22,
    shadowColor: '#000000',
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  continueBtnDisabled: {
    backgroundColor: 'rgba(251,191,36,0.35)',
  },
  continueText: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '800',
  },
  introContinueBtnText: {
    color: '#FFF7DB',
    letterSpacing: 0.2,
  },
  continueTextDisabled: {
    color: 'rgba(15,23,42,0.45)',
  },
});
