import BackgroundLayout from '@/components/BackgroundLayout';
import { HapticButton } from '@/components/ui/HapticButton';
import { Fonts } from '@/constants/theme';
import { ONBOARDING_VIDEO_URL } from '@/lib/storageAssets';
import { useVideoPlayer } from 'expo-video';
import {
    Bell,
    Book,
    BookOpen,
    Check,
    ChevronLeft,
    ChevronRight,
    Flame,
    Globe,
    Heart,
    Maximize2,
    Medal,
    Mic,
    PlayCircle,
    Share,
    Shield
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Linking, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withRepeat, withSpring, withTiming } from 'react-native-reanimated';

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
  emailUpdatesOptIn: boolean;
};

interface OnboardingFlowProps {
  onComplete: (data: OnboardingData) => void;
  onReminderPreferenceChange?: (enabled: boolean) => Promise<void> | void;
}

type ReminderChoice = 'yes' | 'no' | null;
const TOTAL_STEPS = 6;
const INTRO_HEADLINE = "Did you know connecting back to your roots doesn't have to feel...";
const INTRO_WORDS = ['hard?', 'stressful?', 'complicated?'] as const;
const WELCOME_TOP = 'Welcome to';
const WELCOME_MAIN = 'Dharma Daily';
const STEP_ONE_PROMPT_TOP = "Let’s personalize your journey";
const STEP_ONE_PROMPT_BOTTOM = "What’s your full name?";

function OnboardingIntroHero({ startTyping }: { startTyping: boolean }) {
  const [titleTopLength, setTitleTopLength] = useState(0);
  const [titleMainLength, setTitleMainLength] = useState(0);
  const [headlineLength, setHeadlineLength] = useState(0);
  const [wordIndex, setWordIndex] = useState(0);
  const [wordLength, setWordLength] = useState(0);
  const [wordPhase, setWordPhase] = useState<'typing' | 'holding' | 'deleting'>('typing');
  const cursorOpacity = useSharedValue(1);
  const titleReveal = useSharedValue(0);

  const titleTopDone = titleTopLength >= WELCOME_TOP.length;
  const titleMainDone = titleMainLength >= WELCOME_MAIN.length;
  const titleDone = titleTopDone && titleMainDone;

  useEffect(() => {
    cursorOpacity.value = withRepeat(withTiming(0.18, { duration: 520 }), -1, true);
  }, [cursorOpacity]);

  // Smooth entrance for the whole title once the video has loaded.
  useEffect(() => {
    if (!startTyping) return;
    titleReveal.value = withTiming(1, { duration: 450, easing: Easing.out(Easing.cubic) });
  }, [startTyping, titleReveal]);

  // 1) Type "Welcome to".
  useEffect(() => {
    if (!startTyping) return;
    if (titleTopLength >= WELCOME_TOP.length) return;

    const timeout = setTimeout(() => {
      setTitleTopLength((current) => current + 1);
    }, titleTopLength === 0 ? 120 : 45);

    return () => clearTimeout(timeout);
  }, [startTyping, titleTopLength]);

  // 2) Then type "Dharma Daily".
  useEffect(() => {
    if (!startTyping || !titleTopDone) return;
    if (titleMainLength >= WELCOME_MAIN.length) return;

    const timeout = setTimeout(() => {
      setTitleMainLength((current) => current + 1);
    }, titleMainLength === 0 ? 180 : 48);

    return () => clearTimeout(timeout);
  }, [startTyping, titleTopDone, titleMainLength]);

  // 3) Then type the headline.
  useEffect(() => {
    if (!startTyping || !titleDone) return;
    if (headlineLength >= INTRO_HEADLINE.length) return;

    const timeout = setTimeout(() => {
      setHeadlineLength((current) => current + 1);
    }, headlineLength === 0 ? 200 : 50);

    return () => clearTimeout(timeout);
  }, [startTyping, titleDone, headlineLength]);

  // 4) Then cycle the rotating words — fast write + fast delete.
  useEffect(() => {
    if (headlineLength < INTRO_HEADLINE.length) return;

    const currentWord = INTRO_WORDS[wordIndex];

    if (wordPhase === 'typing') {
      if (wordLength >= currentWord.length) {
        const holdTimeout = setTimeout(() => setWordPhase('holding'), 450);
        return () => clearTimeout(holdTimeout);
      }

      const typeTimeout = setTimeout(() => {
        setWordLength((current) => current + 1);
      }, 40);

      return () => clearTimeout(typeTimeout);
    }

    if (wordPhase === 'holding') {
      const holdTimeout = setTimeout(() => setWordPhase('deleting'), 150);
      return () => clearTimeout(holdTimeout);
    }

    if (wordLength === 0) {
      const nextWordTimeout = setTimeout(() => {
        setWordIndex((current) => (current + 1) % INTRO_WORDS.length);
        setWordPhase('typing');
      }, 80);

      return () => clearTimeout(nextWordTimeout);
    }

    const deleteTimeout = setTimeout(() => {
      setWordLength((current) => current - 1);
    }, 20);

    return () => clearTimeout(deleteTimeout);
  }, [headlineLength, wordIndex, wordLength, wordPhase]);

  const cursorStyle = useAnimatedStyle(() => ({
    opacity: cursorOpacity.value,
  }));

  const titleRevealStyle = useAnimatedStyle(() => ({
    opacity: titleReveal.value,
    transform: [{ translateY: (1 - titleReveal.value) * 10 }],
  }));

  const displayedTitleTop = WELCOME_TOP.slice(0, titleTopLength);
  const displayedTitleMain = WELCOME_MAIN.slice(0, titleMainLength);
  const displayedHeadline = INTRO_HEADLINE.slice(0, headlineLength);
  const displayedWord = INTRO_WORDS[wordIndex].slice(0, wordLength);
  const isHeadlineTyping = headlineLength < INTRO_HEADLINE.length;

  return (
    <View style={styles.heroBlock}>
      <Animated.View style={[styles.heroTitleWrap, titleRevealStyle]}>
        <Text style={styles.heroTitleIntro}>
          {displayedTitleTop}
          {startTyping && !titleTopDone ? <Animated.Text style={[styles.heroTitleCursor, cursorStyle]}>|</Animated.Text> : null}
        </Text>
        <Text numberOfLines={1} style={styles.heroTitleMain}>
          {displayedTitleMain}
          {startTyping && titleTopDone && !titleMainDone ? <Animated.Text style={[styles.heroTitleCursor, cursorStyle]}>|</Animated.Text> : null}
        </Text>
      </Animated.View>

      <Text style={styles.heroHeadline}>
        {displayedHeadline}
        {startTyping && titleDone && isHeadlineTyping ? <Animated.Text style={[styles.heroBodyCursor, cursorStyle]}>|</Animated.Text> : null}
      </Text>

      <View style={styles.heroWordRow}>
        <Text style={styles.heroWord}>{displayedWord || ' '}</Text>
        {titleDone && !isHeadlineTyping ? <Animated.Text style={[styles.heroCursor, cursorStyle]}>|</Animated.Text> : null}
      </View>
    </View>
  );
}

const FEATURES_LIST = [
  { id: 'verses', title: 'Daily verses', desc: 'When you first open the app you will be met with the verse of the day', Icon: BookOpen },
  { id: 'streaks', title: 'Streaks', desc: 'Open the app once a day to view your verse to upgrade your streak', Icon: Flame },
  { id: 'likes', title: 'Likes', desc: 'Each day you can like a verse by clicking the heart button or simply double tapping.', Icon: Heart },
  { id: 'listening', title: 'Listening', desc: 'Click the microphone button to hear the verse.', Icon: Mic },
  { id: 'expand', title: 'Expand', desc: 'Click the quote card box to expand and have it take up your whole screen', Icon: Maximize2 },
  { id: 'share', title: 'Share', desc: 'Tap the share button to share the verses with anyone!', Icon: Share },
  { id: 'read', title: 'Read', desc: 'Click the read section to read the whole Gita, you can even tap on a verse to like it, share, note, bookmark, copy.', Icon: Book },
  { id: 'listenBook', title: 'Listen to the book', desc: 'Tap the play button on the read section to listen to it', Icon: PlayCircle },
  { id: 'badges', title: 'Unlock badges', desc: 'The more you use the app the more badges you unlock and rewards that are commign soon!', Icon: Medal },
];

function AnimatedFeatureCard({ feature, index, progress, totalCards }: { feature: any, index: number, progress: any, totalCards: number }) {
  const cardAnimStyle = useAnimatedStyle(() => {
    const chunk = 1 / totalCards;
    const val = Math.max(0, Math.min(1, (progress.value - index * chunk * 0.5) * 4));
    return {
      opacity: val,
      transform: [
        { translateY: (1 - val) * 15 },
        { scale: 0.98 + val * 0.02 }
      ],
    };
  });

  return (
    <Animated.View style={[styles.infoCard, cardAnimStyle]}>
      <feature.Icon size={20} color="#fbbf24" style={{ marginTop: 2 }} />
      <View style={styles.infoCopy}>
        <Text style={styles.infoTitle}>{feature.title}</Text>
        <Text style={styles.infoDesc}>{feature.desc}</Text>
      </View>
    </Animated.View>
  );
}

function StepTwoDescription({ descOpacity }: { descOpacity: any }) {
  const descAnimStyle = useAnimatedStyle(() => ({
    opacity: descOpacity.value,
    transform: [{ translateY: (1 - descOpacity.value) * 10 }],
  }));

  return (
    <Animated.View style={descAnimStyle}>
      <Text style={[styles.subtitle, { marginTop: 12, marginBottom: 24 }]}>
        Dharma Daily gives daily quotes of the Bhagavad Gita that you can read anytime. Here&apos;s a breakdown of the many features:
      </Text>
    </Animated.View>
  );
}

export default function OnboardingFlow({ onComplete, onReminderPreferenceChange }: OnboardingFlowProps) {
  const [step, setStep] = useState(0);
  const [previousStep, setPreviousStep] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [fullName, setFullName] = useState('');
  const [reminderChoice, setReminderChoice] = useState<ReminderChoice>(null);
  const [preferredLanguage, setPreferredLanguage] = useState<PreferredLanguage | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [emailUpdatesOptIn, setEmailUpdatesOptIn] = useState(false);
  const [stepOnePromptTopLength, setStepOnePromptTopLength] = useState(0);
  const [stepOnePromptBottomLength, setStepOnePromptBottomLength] = useState(0);
  const [stepOnePromptPhase, setStepOnePromptPhase] = useState<'typingTop' | 'typingBottom' | 'done'>('typingTop');
  // Becomes true once the background video has loaded — gates the intro typewriter.
  const [videoReady, setVideoReady] = useState(false);
  const handleVideoReady = useCallback(() => setVideoReady(true), []);

  // Step 2 (Features) states
  const [stepTwoPromptLength, setStepTwoPromptLength] = useState(0);
  const [stepTwoPhase, setStepTwoPhase] = useState<'typing' | 'done'>('typing');
  const stepTwoDescOpacity = useSharedValue(0);
  const stepTwoCardsProgress = useSharedValue(0);

  const pageTransition = useSharedValue(1);
  const direction = useSharedValue(1); // 1 for forward, -1 for backward
  const stepOneFormProgress = useSharedValue(0);
  const stepOneCursorOpacity = useSharedValue(1);
  const backgroundVideoPlayer = useVideoPlayer(ONBOARDING_VIDEO_URL, (player) => {
    player.loop = true;
    player.muted = true;
    // Buffer well past the 24s clip so we never re-fetch mid-loop.
    player.bufferOptions = {
      preferredForwardBufferDuration: 60,
      maxBufferBytes: 10 * 1024 * 1024,
    };
    player.play();
  });

  const outgoingPageAnimatedStyle = useAnimatedStyle(() => ({
    opacity: 1 - pageTransition.value,
    transform: [{ translateX: -direction.value * pageTransition.value * 52 }],
  }));

  const incomingPageAnimatedStyle = useAnimatedStyle(() => ({
    opacity: pageTransition.value,
    transform: [{ translateX: direction.value * (1 - pageTransition.value) * 52 }],
  }));

  const stepOneFormAnimatedStyle = useAnimatedStyle(() => ({
    opacity: stepOneFormProgress.value,
    transform: [
      { translateY: (1 - stepOneFormProgress.value) * 14 },
      { scale: 0.94 + stepOneFormProgress.value * 0.06 },
    ],
  }));

  const stepOneCursorStyle = useAnimatedStyle(() => ({
    opacity: stepOneCursorOpacity.value,
  }));

  useEffect(() => {
    stepOneCursorOpacity.value = withRepeat(withTiming(0.18, { duration: 520 }), -1, true);
  }, [stepOneCursorOpacity]);

  useEffect(() => {
    if (step < 0 || step > TOTAL_STEPS - 1) {
      setStep(0);
    }
  }, [step]);

  useEffect(() => {
    if (step !== 1) {
      setStepOnePromptTopLength(0);
      setStepOnePromptBottomLength(0);
      setStepOnePromptPhase('typingTop');
      stepOneFormProgress.value = 0;
      return;
    }

    if (stepOnePromptPhase === 'typingTop') {
      if (stepOnePromptTopLength >= STEP_ONE_PROMPT_TOP.length) {
        const nextPhaseTimeout = setTimeout(() => setStepOnePromptPhase('typingBottom'), 220);
        return () => clearTimeout(nextPhaseTimeout);
      }

      const timeout = setTimeout(() => {
        setStepOnePromptTopLength((current) => current + 1);
      }, stepOnePromptTopLength === 0 ? 220 : 34);

      return () => clearTimeout(timeout);
    }

    if (stepOnePromptPhase === 'typingBottom') {
      if (stepOnePromptBottomLength >= STEP_ONE_PROMPT_BOTTOM.length) {
        const revealTimeout = setTimeout(() => {
          setStepOnePromptPhase('done');
          stepOneFormProgress.value = withSpring(1, {
            damping: 14,
            stiffness: 180,
            mass: 0.9,
          });
        }, 180);

        return () => clearTimeout(revealTimeout);
      }

      const timeout = setTimeout(() => {
        setStepOnePromptBottomLength((current) => current + 1);
      }, stepOnePromptBottomLength === 0 ? 200 : 34);

      return () => clearTimeout(timeout);
    }
  }, [
    step,
    stepOnePromptTopLength,
    stepOnePromptBottomLength,
    stepOnePromptPhase,
    stepOneFormProgress,
  ]);

  useEffect(() => {
    if (step !== 2) {
      setStepTwoPromptLength(0);
      setStepTwoPhase('typing');
      stepTwoDescOpacity.value = 0;
      stepTwoCardsProgress.value = 0;
      return;
    }

    const promptText = `Welcome ${fullName}, Meet the app.`;

    if (stepTwoPhase === 'typing') {
      if (stepTwoPromptLength >= promptText.length) {
        const revealTimeout = setTimeout(() => {
          setStepTwoPhase('done');
          stepTwoDescOpacity.value = withTiming(1, { duration: 600 });
          stepTwoCardsProgress.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) });
        }, 180);

        return () => clearTimeout(revealTimeout);
      }

      const timeout = setTimeout(() => {
        setStepTwoPromptLength((current) => current + 1);
      }, stepTwoPromptLength === 0 ? 200 : 34);

      return () => clearTimeout(timeout);
    }
  }, [step, stepTwoPromptLength, stepTwoPhase, fullName, stepTwoDescOpacity, stepTwoCardsProgress]);

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

  const animateToStep = (nextStep: number) => {
    const isForward = nextStep > step;
    setPreviousStep(step);
    setIsTransitioning(true);
    setStep(nextStep);
    // Incoming slide starts from the side associated with the navigation direction.
    direction.value = isForward ? 1 : -1;

    pageTransition.value = 0;
    pageTransition.value = withTiming(1, {
      duration: 350,
      easing: Easing.bezier(0.33, 1, 0.68, 1),
    }, (finished) => {
      if (!finished) return;
      runOnJS(setIsTransitioning)(false);
      runOnJS(setPreviousStep)(null);
    });
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

    if (step < TOTAL_STEPS - 1) {
      animateToStep(step + 1);
      return;
    }

    if (authMode === 'signup' && !termsAccepted) {
      Alert.alert(
        'Terms Required',
        'To use Dharma Daily you must accept the Terms and Conditions.',
        [{ text: 'OK' }]
      );
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
      emailUpdatesOptIn,
    });
  };

  const goBackFlow = () => {
    if (step <= 0) return;
    animateToStep(step - 1);
  };

  const renderStepContent = (currentStep = step) => {
    if (currentStep === 0) {
      return (
        <>
          <OnboardingIntroHero startTyping={videoReady} />

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

    if (currentStep === 1) {
      const displayedStepOnePromptTop = STEP_ONE_PROMPT_TOP.slice(0, stepOnePromptTopLength);
      const displayedStepOnePromptBottom = STEP_ONE_PROMPT_BOTTOM.slice(0, stepOnePromptBottomLength);
      const isTypingTop = stepOnePromptPhase === 'typingTop' && stepOnePromptTopLength < STEP_ONE_PROMPT_TOP.length;
      const isTypingBottom = stepOnePromptPhase === 'typingBottom' && stepOnePromptBottomLength < STEP_ONE_PROMPT_BOTTOM.length;

      return (
        <View style={styles.stepOneContent}>
          <Text style={styles.stepOnePromptLine}>
            {displayedStepOnePromptTop}
            {isTypingTop ? <Animated.Text style={[styles.heroBodyCursor, stepOneCursorStyle]}>|</Animated.Text> : null}
          </Text>

          {stepOnePromptPhase !== 'typingTop' ? (
            <Text style={styles.stepOnePromptLineBottom}>
              {displayedStepOnePromptBottom}
              {isTypingBottom ? <Animated.Text style={[styles.heroBodyCursor, stepOneCursorStyle]}>|</Animated.Text> : null}
            </Text>
          ) : null}

          <Animated.View style={[styles.firstStepForm, stepOneFormAnimatedStyle]}>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter your full name"
              placeholderTextColor="rgba(251,191,36,0.35)"
              style={styles.input}
            />
          </Animated.View>
        </View>
      );
    }

    if (currentStep === 2) {
      const stepTwoPromptText = `Welcome ${fullName}, Meet the app.`;
      const displayedStepTwoPrompt = stepTwoPromptText.slice(0, stepTwoPromptLength);
      const isTypingTwo = stepTwoPhase === 'typing' && stepTwoPromptLength < stepTwoPromptText.length;

      return (
        <ScrollView style={styles.stepTwoScroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          <Text style={styles.stepOnePromptLine}>
            {displayedStepTwoPrompt}
            {isTypingTwo ? <Animated.Text style={[styles.heroBodyCursor, stepOneCursorStyle]}>|</Animated.Text> : null}
          </Text>

          <StepTwoDescription descOpacity={stepTwoDescOpacity} />

          <View style={styles.cardList}>
            {FEATURES_LIST.map((feature, index) => (
              <AnimatedFeatureCard 
                key={feature.id} 
                feature={feature} 
                index={index} 
                progress={stepTwoCardsProgress} 
                totalCards={FEATURES_LIST.length} 
              />
            ))}
          </View>
        </ScrollView>
      );
    }

    if (currentStep === 3) {
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

    if (currentStep === 4) {
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

        {authMode === 'signup' && (
          <View style={styles.checkboxSection}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setTermsAccepted(!termsAccepted)}
              style={styles.checkboxRow}
            >
              <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
                {termsAccepted && <Check size={12} color="#0f172a" strokeWidth={3} />}
              </View>
              <Text style={styles.checkboxText}>
                {'I am 13 or older and agree to the '}
                <Text
                  style={styles.checkboxLink}
                  onPress={() => void Linking.openURL('https://dharmadailytermsofuse.notion.site/')}
                >
                  Terms of Use
                </Text>
                {' and '}
                <Text
                  style={styles.checkboxLink}
                  onPress={() => void Linking.openURL('https://dharmadailyprivacypolicy.notion.site')}
                >
                  Privacy Policy
                </Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setEmailUpdatesOptIn(!emailUpdatesOptIn)}
              style={styles.checkboxRow}
            >
              <View style={[styles.checkbox, emailUpdatesOptIn && styles.checkboxChecked]}>
                {emailUpdatesOptIn && <Check size={12} color="#0f172a" strokeWidth={3} />}
              </View>
              <Text style={styles.checkboxText}>
                Send me occasional emails with tips, verses, and updates
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.helper}>Your progress, saved in one place.</Text>
      </>
    );
  };

  return (
    <BackgroundLayout backgroundPlayer={backgroundVideoPlayer} onReady={handleVideoReady}>
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
            <View style={styles.stepStage}>
              {isTransitioning && previousStep !== null ? (
                <Animated.View style={[styles.stepLayerAbsolute, outgoingPageAnimatedStyle]}>
                  <View style={styles.stepBlock}>{renderStepContent(previousStep)}</View>
                </Animated.View>
              ) : null}

              <Animated.View style={[styles.stepLayerRelative, incomingPageAnimatedStyle]}>
                <View style={styles.stepBlock}>{renderStepContent(step)}</View>
              </Animated.View>
            </View>
          </ScrollView>

          <HapticButton
            onPress={continueFlow}
            disabled={!canContinue}
            style={[
              styles.continueBtn,
              !canContinue && styles.continueBtnDisabled,
            ]}
          >
            <Text
              style={[
                styles.continueText,
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
              <ChevronRight size={16} color={!canContinue ? 'rgba(255, 249, 230, 0.45)' : '#fff9e6'} />
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
    paddingBottom: 80,
  },
  stepBlock: {
    paddingTop: 8,
    flexGrow: 1,
  },
  stepStage: {
    flex: 1,
    position: 'relative',
  },
  stepLayerAbsolute: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  stepLayerRelative: {
    flex: 1,
    zIndex: 2,
  },
  stepOneContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 10,
    paddingBottom: 80,
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
  heroTitleCursor: {
    color: '#FCD34D',
    fontSize: 38,
    lineHeight: 46,
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
  stepOnePromptLine: {
    color: '#fef3c7',
    fontSize: 42,
    lineHeight: 48,
    fontWeight: '600',
    fontFamily: Fonts.serif,
    textAlign: 'center',
    letterSpacing: -0.65,
    width: '100%',
    maxWidth: 360,
    textShadowColor: 'rgba(0,0,0,0.18)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 14,
  },
  stepOnePromptLineBottom: {
    color: '#fef3c7',
    fontSize: 42,
    lineHeight: 48,
    fontWeight: '600',
    fontFamily: Fonts.serif,
    textAlign: 'center',
    letterSpacing: -0.65,
    width: '100%',
    maxWidth: 360,
    marginTop: 20,
    textShadowColor: 'rgba(0,0,0,0.18)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 14,
  },
  stepTwoScroll: {
    flex: 1,
    width: '100%',
    paddingTop: 30, // Increased top padding
  },
  firstStepForm: {
    marginTop: 10,
    width: '85%',
    backgroundColor: 'transparent',
    borderRadius: 20,
    paddingHorizontal: 0,
    paddingVertical: 0,
    marginBottom: 80,
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
    backgroundColor: 'rgba(30,41,59,0.72)',
    color: '#fef3c7',
    borderRadius: 18,
    paddingHorizontal: 28,
    paddingVertical: 20,
    minHeight: 62,
    fontSize: 18,
    marginBottom: 12,
    fontWeight: '500',
    width: '100%',
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
  checkboxSection: {
    marginTop: 16,
    gap: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(251,191,36,0.5)',
    backgroundColor: 'rgba(30,41,59,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: '#fbbf24',
    borderColor: '#fcd34d',
  },
  checkboxText: {
    color: 'rgba(254,243,199,0.85)',
    fontSize: 13,
    lineHeight: 20,
    flex: 1,
  },
  checkboxLink: {
    color: '#fbbf24',
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  continueBtn: {
    marginTop: 12,
    marginBottom: 0,
    borderRadius: 16,
    backgroundColor: 'rgba(251, 191, 36, 0.45)', // Brighter yellow transparent
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.65)',
    paddingHorizontal: 24,
    paddingVertical: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  continueBtnDisabled: {
    backgroundColor: 'rgba(251, 191, 36, 0.20)',
    borderColor: 'rgba(251, 191, 36, 0.30)',
  },
  continueText: {
    color: '#fff9e6',
    letterSpacing: 0.25,
    fontSize: 17,
    fontWeight: '800',
  },
  continueTextDisabled: {
    color: 'rgba(255, 249, 230, 0.45)',
  },
});
