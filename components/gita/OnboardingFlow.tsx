import BackgroundLayout from '@/components/BackgroundLayout';
import DharmaCoinEarnMethods from '@/components/gita/DharmaCoinEarnMethods';
import DiyaStreak from '@/components/ui/DiyaStreak';
import { HapticButton } from '@/components/ui/HapticButton';
import { Fonts } from '@/constants/theme';
import { ONBOARDING_VIDEO_URL } from '@/lib/storageAssets';
import { Image } from 'expo-image';
import { useVideoPlayer } from 'expo-video';
import {
    Bell,
    BookOpen,
    Calendar,
    Check,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    FileText,
    Flame,
    Flower2,
    Heart,
    Medal,
    Music,
    PlayCircle,
    Share,
    Shield,
    StickyNote,
    Volume2
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Alert, KeyboardAvoidingView, Linking, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withSpring, withTiming } from 'react-native-reanimated';

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
const TOTAL_STEPS = 12;
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

type SlideFeature = { id: string; title: string; desc: string; Icon: typeof BookOpen };

// "Read" slide — what you can do with the full scripture.
const READ_FEATURES: SlideFeature[] = [
  { id: 'read', title: 'Read every verse', desc: 'Move through all 18 chapters and 700 verses at your own pace.', Icon: BookOpen },
  { id: 'context', title: 'Understand with context', desc: 'Short notes set the scene so each moment makes sense.', Icon: FileText },
  { id: 'listen', title: 'Listen to it', desc: 'Press play to hear a whole chapter read aloud, verse by verse.', Icon: PlayCircle },
  { id: 'notes', title: 'Make it yours', desc: 'Write notes, and bookmark, like, copy, or share any verse you love.', Icon: StickyNote },
];

// "Festivals" slide — the Hindu festival calendar.
const FESTIVAL_FEATURES: SlideFeature[] = [
  { id: 'learn', title: 'Learn the stories', desc: 'Discover the meaning and history behind each festival.', Icon: BookOpen },
  { id: 'savefest', title: 'Save & share', desc: 'Keep the festivals you love and share them with friends.', Icon: Heart },
  { id: 'upcoming', title: 'Never miss one', desc: 'Upcoming festivals appear right on your home screen.', Icon: Calendar },
];

// "Prayers" slide — everything you can do with the prayers & chants.
const PRAYER_FEATURES: SlideFeature[] = [
  { id: 'choose', title: 'Choose your prayer', desc: 'Pick from a growing collection of sacred prayers and chants.', Icon: Music },
  { id: 'listenpray', title: 'Listen & follow along', desc: 'Press play and watch each line light up in time with the audio.', Icon: PlayCircle },
  { id: 'meaning', title: 'Tap any verse', desc: 'Tap a line to see what it means — and save the meaning to revisit anytime.', Icon: FileText },
  { id: 'learnpray', title: 'Learn about the prayer', desc: 'Discover what each prayer means, why it matters, and when to chant it.', Icon: BookOpen },
];

// "Begin your journey" slide — the 10 paths of the World of Hinduism, in walk order.
// Lotus → Temple are playable today; the rest are marked "Coming soon".
type JourneyPath = { title: string; blurb: string; accent: string; playable: boolean };
const JOURNEY_PATHS: JourneyPath[] = [
  { title: 'Lotus Path', accent: '#F9A8D4', playable: true, blurb: 'Start here — what Hinduism is and the big ideas behind it.' },
  { title: 'Mountain Path', accent: '#BAE6FD', playable: true, blurb: 'The soul and the truth behind everything (Brahman and Atman).' },
  { title: 'Garden Path', accent: '#86EFAC', playable: true, blurb: 'Karma, dharma, rebirth, and freedom (moksha) — made simple.' },
  { title: 'Forest Path', accent: '#4ADE80', playable: true, blurb: 'Meet the gods and goddesses and the stories about them.' },
  { title: 'Temple Path', accent: '#FBBF24', playable: true, blurb: 'Worship, puja, and what happens inside a mandir (temple).' },
  { title: 'City Path', accent: '#60A5FA', playable: false, blurb: 'Living as a Hindu today — at school, work, and in the world.' },
  { title: 'Village Path', accent: '#FDE68A', playable: false, blurb: 'Everyday faith — family customs, food, and festivals at home.' },
  { title: 'Sky Path', accent: '#E0F2FE', playable: false, blurb: 'Time, the universe, and the heavenly worlds above.' },
  { title: 'Library Path', accent: '#93C5FD', playable: false, blurb: 'The holy books — the Vedas, the great epics, and the Gita.' },
  { title: 'River Path', accent: '#38BDF8', playable: false, blurb: 'Sacred rivers like the Ganga, and the idea of pilgrimage.' },
];

// Static info card (icon + title + description) reused across the feature slides.
function FeatureCard({ Icon, title, desc }: { Icon: typeof BookOpen; title: string; desc: string }) {
  return (
    <View style={styles.infoCard}>
      <Icon size={20} color="#fbbf24" style={{ marginTop: 2 }} />
      <View style={styles.infoCopy}>
        <Text style={styles.infoTitle}>{title}</Text>
        <Text style={styles.infoDesc}>{desc}</Text>
      </View>
    </View>
  );
}

// Fades + lifts the Daily Verse content in once the headline finishes typing.
function StepTwoReveal({ opacity, progress, children }: { opacity: any; progress: any; children: ReactNode }) {
  const revealStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: (1 - progress.value) * 16 }],
  }));

  return <Animated.View style={revealStyle}>{children}</Animated.View>;
}

function StreakCelebration() {
  const [isLit, setIsLit] = useState(false);
  const matchProgress = useSharedValue(0);
  const matchOpacity = useSharedValue(0);
  const glowProgress = useSharedValue(0);
  const rewardProgress = useSharedValue(0);
  const diyaScale = useSharedValue(0.84);
  const matchFlamePulse = useSharedValue(0);

  useEffect(() => {
    matchOpacity.value = withTiming(1, { duration: 220 });
    matchFlamePulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 180 }),
        withTiming(0, { duration: 240 }),
      ),
      -1,
      true,
    );
    diyaScale.value = withSpring(1, { damping: 12, stiffness: 150 });
    matchProgress.value = withDelay(
      350,
      withTiming(1, { duration: 850, easing: Easing.inOut(Easing.cubic) }, (finished) => {
        if (!finished) return;
        runOnJS(setIsLit)(true);
        glowProgress.value = withSequence(
          withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }),
          withRepeat(withTiming(0.72, { duration: 900 }), -1, true),
        );
        rewardProgress.value = withDelay(280, withSpring(1, { damping: 12, stiffness: 135 }));
        matchOpacity.value = withDelay(180, withTiming(0, { duration: 380 }));
      }),
    );
  }, [diyaScale, glowProgress, matchFlamePulse, matchOpacity, matchProgress, rewardProgress]);

  const matchStyle = useAnimatedStyle(() => ({
    opacity: matchOpacity.value,
    transform: [
      { translateX: -34 * matchProgress.value },
      { translateY: 50 * matchProgress.value },
      { rotate: `${-18 - matchProgress.value * 12}deg` },
    ],
  }));

  const matchFlameStyle = useAnimatedStyle(() => ({
    opacity: matchOpacity.value,
    transform: [
      { translateY: matchFlamePulse.value * -1.5 },
      { scaleX: 0.9 + matchFlamePulse.value * 0.16 },
      { scaleY: 0.94 + matchFlamePulse.value * 0.12 },
      { rotate: `${-5 + matchFlamePulse.value * 8}deg` },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowProgress.value * 0.72,
    transform: [{ scale: 0.72 + glowProgress.value * 0.52 }],
  }));

  const diyaStyle = useAnimatedStyle(() => ({
    transform: [{ scale: diyaScale.value }],
  }));

  const rewardStyle = useAnimatedStyle(() => ({
    opacity: rewardProgress.value,
    transform: [
      { translateY: (1 - rewardProgress.value) * 18 },
      { scale: 0.88 + rewardProgress.value * 0.12 },
    ],
  }));

  return (
    <View style={styles.streakCelebration}>
      <Text style={styles.streakEyebrow}>YOUR JOURNEY BEGINS</Text>
      <Text style={styles.streakTitle}>Light your daily flame</Text>
      <Text style={styles.streakSubtitle}>Return each day to keep your diya glowing.</Text>

      <View style={styles.diyaStage}>
        <Animated.View style={[styles.diyaGlow, glowStyle]} />

        <Animated.View style={[styles.largeDiya, diyaStyle]}>
          <DiyaStreak streak={1} scale={3.35} lit={isLit} />
        </Animated.View>

        <Animated.View style={[styles.matchstick, matchStyle]}>
          <Animated.View style={[styles.matchFlame, matchFlameStyle]}>
            <View style={styles.matchFlameInner} />
          </Animated.View>
          <View style={styles.matchHead} />
          <View style={styles.matchStem} />
        </Animated.View>
      </View>

      <Animated.View style={[styles.streakReward, rewardStyle]}>
        <Flame size={20} color="#0f172a" fill="#0f172a" />
        <View>
          <Text style={styles.streakRewardValue}>1 day streak</Text>
          <Text style={styles.streakRewardCaption}>Your first flame is lit</Text>
        </View>
      </Animated.View>
    </View>
  );
}

export default function OnboardingFlow({ onComplete, onReminderPreferenceChange }: OnboardingFlowProps) {
  const onboardingScrollRef = useRef<ScrollView>(null);
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

    const promptText = `Welcome ${fullName}, meet the app.`;

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
    if (step === 9) return reminderChoice !== null;
    if (step === 10) return preferredLanguage !== null;

    if (step === 11) {
      if (authMode === 'signup') {
        return fullName.trim().length > 0 && email.trim().length > 0 && password.trim().length >= 6;
      }

      return email.trim().length > 0 && password.trim().length >= 6;
    }

    return true;
  }, [authMode, email, fullName, password, preferredLanguage, reminderChoice, step]);

  const animateToStep = (nextStep: number) => {
    const isForward = nextStep > step;
    onboardingScrollRef.current?.scrollTo({ y: 0, animated: false });
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
      const stepTwoPromptText = `Welcome ${fullName}, meet the app.`;
      const displayedStepTwoPrompt = stepTwoPromptText.slice(0, stepTwoPromptLength);
      const isTypingTwo = stepTwoPhase === 'typing' && stepTwoPromptLength < stepTwoPromptText.length;

      return (
        <ScrollView style={styles.slideScroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          <Text style={styles.stepOnePromptLine}>
            {displayedStepTwoPrompt}
            {isTypingTwo ? <Animated.Text style={[styles.heroBodyCursor, stepOneCursorStyle]}>|</Animated.Text> : null}
          </Text>

          <StepTwoReveal opacity={stepTwoDescOpacity} progress={stepTwoCardsProgress}>
            <Text style={styles.verseIntro}>
              Each day opens with your Verse of the Day — a fresh piece of Gita wisdom.
            </Text>

            <View style={styles.verseImageFrame}>
              <Image
                source={require('@/assets/images/onboarding.jpg')}
                style={styles.verseImage}
                contentFit="cover"
                transition={200}
                recyclingKey="onboarding-verse"
              />
            </View>

            <View style={styles.verseHintRow}>
              {[
                { Icon: Heart, label: 'Double-tap to like' },
                { Icon: Volume2, label: 'Tap to listen' },
                { Icon: Share, label: 'Tap to share' },
              ].map(({ Icon, label }) => (
                <View key={label} style={styles.verseHintChip}>
                  <ChevronUp size={16} color="rgba(251,191,36,0.7)" />
                  <View style={styles.verseHintIcon}>
                    <Icon size={18} color="#fbbf24" />
                  </View>
                  <Text style={styles.verseHintLabel}>{label}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.verseHintCaption}>
              Share it as a beautiful image or as plain text.
            </Text>
          </StepTwoReveal>
        </ScrollView>
      );
    }

    if (currentStep === 3) {
      return <StreakCelebration />;
    }

    if (currentStep === 4) {
      return (
        <ScrollView style={styles.slideScroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          <Text style={styles.title}>Read the whole Gita</Text>
          <Text style={styles.subtitle}>All 18 chapters — to read, hear, and reflect on.</Text>
          <View style={styles.cardList}>
            {READ_FEATURES.map((f) => (
              <FeatureCard key={f.id} Icon={f.Icon} title={f.title} desc={f.desc} />
            ))}
          </View>
        </ScrollView>
      );
    }

    if (currentStep === 5) {
      return (
        <ScrollView style={styles.slideScroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          <Text style={styles.title}>Celebrate every festival</Text>
          <Text style={styles.subtitle}>Discover the sacred days of the Hindu calendar.</Text>
          <View style={styles.cardList}>
            {FESTIVAL_FEATURES.map((f) => (
              <FeatureCard key={f.id} Icon={f.Icon} title={f.title} desc={f.desc} />
            ))}
          </View>
        </ScrollView>
      );
    }

    if (currentStep === 6) {
      return (
        <ScrollView style={styles.slideScroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          <View style={styles.pathsTitleRow}>
            <Flower2 size={24} color="#fbbf24" />
            <Text
              style={[styles.title, styles.pathsTitleText]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              Begin your learning
            </Text>
          </View>
          <Text style={styles.subtitle}>Learn about Hinduism through the World of Hinduism.</Text>

          <View style={styles.mapFrame}>
            <Image
              source={require('@/assets/images/hinduism-planet-map.png')}
              style={styles.mapImage}
              contentFit="cover"
              transition={200}
              recyclingKey="onboarding-map"
            />
          </View>

          <Text style={styles.pathsLead}>
            10 paths to explore, starting with the Lotus Path. Each one has 20–40 levels and ends
            with a Wisdom Gate you must pass to unlock the next.
          </Text>

          <View style={styles.pathsList}>
            {JOURNEY_PATHS.map((p, i) => (
              <View key={p.title} style={[styles.pathRow, !p.playable && styles.pathRowLocked]}>
                <View style={[styles.pathNum, { borderColor: p.accent }]}>
                  <Text style={[styles.pathNumText, { color: p.accent }]}>{i + 1}</Text>
                </View>
                <View style={styles.pathTextWrap}>
                  <View style={styles.pathNameRow}>
                    <Text style={styles.pathName}>{p.title}</Text>
                    {!p.playable && (
                      <View style={styles.comingSoonPill}>
                        <Text style={styles.comingSoonText}>Coming soon</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.pathBlurb}>{p.blurb}</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      );
    }

    if (currentStep === 7) {
      return (
        <ScrollView style={styles.slideScroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          <Text style={styles.title}>Pray along, anytime</Text>
          <Text style={styles.subtitle}>Sacred prayers and chants, with every word in front of you.</Text>

          <View style={styles.prayerImageFrame}>
            <Image
              source={require('@/assets/images/prayers-floating.png')}
              style={styles.prayerImage}
              contentFit="contain"
              transition={200}
              recyclingKey="onboarding-prayer"
            />
          </View>

          <View style={[styles.cardList, { marginTop: 18 }]}>
            {PRAYER_FEATURES.map((f) => (
              <FeatureCard key={f.id} Icon={f.Icon} title={f.title} desc={f.desc} />
            ))}
          </View>
        </ScrollView>
      );
    }

    if (currentStep === 8) {
      return (
        <ScrollView style={styles.slideScroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          <Image
            source={require('@/assets/images/coin.png')}
            style={styles.coinsHeroImage}
            contentFit="contain"
            transition={0}
            recyclingKey="onboarding-coin"
          />
          <Text style={styles.coinsTitle}>Unlock Dharma Coins</Text>
          <Text style={styles.coinsSubtitle}>
            Earn coins toward rewards — coming soon. Collect them by:
          </Text>

          <DharmaCoinEarnMethods tone="dark" />

          <View style={styles.streakCoinNote}>
            <View style={styles.streakCoinNoteHeader}>
              <Flame size={18} color="#fbbf24" />
              <Text style={styles.streakCoinNoteTitle}>Longer streaks earn more</Text>
            </View>
            <Text style={styles.streakCoinNoteBody}>
              Your daily streak multiplies every coin you earn — the longer it grows, the more each
              one is worth.
            </Text>
            <View style={styles.streakTierRow}>
              {[
                { days: '7 days', mult: '1.25×' },
                { days: '30 days', mult: '1.5×' },
                { days: '90 days', mult: '2×' },
              ].map((t) => (
                <View key={t.days} style={styles.streakTier}>
                  <Text style={styles.streakTierMult}>{t.mult}</Text>
                  <Text style={styles.streakTierDays}>{t.days}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.badgesBottom}>
            <View style={styles.badgeHero}>
              <View style={styles.badgeHeroIcon}>
                <Medal size={28} color="#fbbf24" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.badgeHeroTitle}>Earn badges, too</Text>
                <Text style={styles.badgeHeroDesc}>
                  Collect badges for daily streaks, reading, favorites, festivals, and more.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      );
    }

    if (currentStep === 9) {
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

    if (currentStep === 10) {
      return (
        <ScrollView style={styles.slideScroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          <Text style={styles.title}>Choose your preferred language</Text>
          <Text style={styles.subtitle}>Pick the language you want to read your daily verses in.</Text>

          <View style={styles.choiceList}>
            <HapticButton
              style={[styles.choiceCard, preferredLanguage === 'english' && styles.choiceCardSelected]}
              onPress={() => setPreferredLanguage('english')}
            >
              <Text style={[styles.langGlyph, preferredLanguage === 'english' && styles.langGlyphSelected]}>A</Text>
              <Text style={[styles.choiceText, preferredLanguage === 'english' && styles.choiceTextSelected]}>English</Text>
            </HapticButton>

            <HapticButton
              style={[styles.choiceCard, preferredLanguage === 'hindi' && styles.choiceCardSelected]}
              onPress={() => setPreferredLanguage('hindi')}
            >
              <Text style={[styles.langGlyph, preferredLanguage === 'hindi' && styles.langGlyphSelected]}>अ</Text>
              <Text style={[styles.choiceText, preferredLanguage === 'hindi' && styles.choiceTextSelected]}>Hindi</Text>
            </HapticButton>
          </View>

          <Text style={styles.comingSoonNote}>More languages coming soon</Text>

          <View style={styles.appearanceSection}>
            <Text style={styles.sectionTitle}>Make the app yours</Text>
            <Text style={styles.subtitle}>
              The app follows your phone&apos;s theme — choose either light or dark mode from your
              Control Center.
            </Text>
          </View>
        </ScrollView>
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
            ref={onboardingScrollRef}
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
    gap: 5,
    marginBottom: 20,
    justifyContent: 'center',
  },
  progressDot: {
    height: 6,
    borderRadius: 999,
  },
  progressDotActive: {
    width: 18,
    backgroundColor: '#fbbf24',
  },
  progressDotInactive: {
    width: 7,
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
  slideScroll: {
    flex: 1,
    width: '100%',
    paddingTop: 12,
  },

  /* ── Daily Verse slide ── */
  verseIntro: {
    color: 'rgba(251,191,36,0.78)',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 4,
    paddingHorizontal: 10,
  },
  verseImageFrame: {
    width: '74%',
    maxWidth: 280,
    aspectRatio: 1039 / 1294,
    alignSelf: 'center',
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.28)',
    backgroundColor: 'rgba(0,0,0,0.25)',
    marginTop: 14,
  },
  verseImage: {
    width: '100%',
    height: '100%',
  },
  verseHintRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 2,
  },
  verseHintChip: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(30,41,59,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.2)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 6,
  },
  verseHintIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(251,191,36,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verseHintLabel: {
    color: '#fef3c7',
    fontSize: 11.5,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 15,
  },
  verseHintCaption: {
    color: 'rgba(251,191,36,0.55)',
    fontSize: 12.5,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 14,
    paddingHorizontal: 10,
  },

  /* ── Prayers slide ── */
  // The cards float on a transparent background with a baked-in glow + shadow,
  // so no border/box here — just size the area to the (landscape) artwork.
  prayerImageFrame: {
    width: '100%',
    aspectRatio: 1584 / 1125,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 2,
  },
  prayerImage: {
    width: '100%',
    height: '100%',
  },

  /* ── Paths slide ── */
  pathsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  pathsTitleText: {
    flex: 1,
    marginBottom: 0,
  },
  mapFrame: {
    width: '100%',
    aspectRatio: 1774 / 887,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.22)',
    backgroundColor: 'rgba(15,23,42,0.4)',
    marginTop: 4,
    marginBottom: 18,
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  pathsLead: {
    color: '#fef3c7',
    fontSize: 15,
    lineHeight: 23,
    fontFamily: Fonts.serif,
    paddingHorizontal: 2,
    marginBottom: 16,
  },
  pathsList: {
    gap: 10,
  },
  pathRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(30,41,59,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.18)',
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 12,
  },
  pathRowLocked: {
    opacity: 0.6,
  },
  pathNum: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pathNumText: {
    fontSize: 13,
    fontWeight: '800',
  },
  pathTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  pathNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  pathName: {
    color: '#fef3c7',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: Fonts.serif,
  },
  pathBlurb: {
    color: 'rgba(251,191,36,0.7)',
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 2,
  },
  comingSoonPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(148,163,184,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.35)',
  },
  comingSoonText: {
    color: 'rgba(226,232,240,0.85)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },

  /* ── Dharma Coins: streak multiplier note ── */
  streakCoinNote: {
    marginTop: 16,
    backgroundColor: 'rgba(251,191,36,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.22)',
    borderRadius: 16,
    padding: 16,
  },
  streakCoinNoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  streakCoinNoteTitle: {
    color: '#fef3c7',
    fontSize: 15,
    fontWeight: '800',
  },
  streakCoinNoteBody: {
    color: 'rgba(251,191,36,0.72)',
    fontSize: 13,
    lineHeight: 19,
  },
  streakTierRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  streakTier: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(30,41,59,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.2)',
    borderRadius: 12,
    paddingVertical: 10,
  },
  streakTierMult: {
    color: '#fbbf24',
    fontSize: 16,
    fontWeight: '900',
  },
  streakTierDays: {
    color: 'rgba(254,243,199,0.7)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  badgesBottom: {
    marginTop: 28,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },

  /* ── Badges + Coins slide ── */
  badgeHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(30,41,59,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.2)',
    borderRadius: 16,
    padding: 16,
  },
  badgeHeroIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(251,191,36,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeHeroTitle: {
    color: '#fef3c7',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  badgeHeroDesc: {
    color: 'rgba(251,191,36,0.72)',
    fontSize: 13,
    lineHeight: 19,
  },
  streakCelebration: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 18,
    paddingBottom: 40,
  },
  streakEyebrow: {
    color: '#fbbf24',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
    letterSpacing: 2.2,
    marginBottom: 12,
  },
  streakTitle: {
    color: '#fef3c7',
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '700',
    fontFamily: Fonts.serif,
    textAlign: 'center',
  },
  streakSubtitle: {
    color: 'rgba(254,243,199,0.72)',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 280,
  },
  diyaStage: {
    width: 280,
    height: 270,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginTop: 8,
  },
  diyaGlow: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#fbbf24',
    shadowColor: '#f59e0b',
    shadowOpacity: 0.95,
    shadowRadius: 36,
    shadowOffset: { width: 0, height: 0 },
  },
  largeDiya: {
    zIndex: 2,
    marginTop: 30,
  },
  matchstick: {
    position: 'absolute',
    zIndex: 3,
    top: 64,
    right: 18,
    width: 94,
    height: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  matchFlame: {
    position: 'absolute',
    left: -1,
    top: -23,
    width: 18,
    height: 27,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderBottomLeftRadius: 13,
    borderBottomRightRadius: 4,
    backgroundColor: '#ff6b00',
    transform: [{ rotate: '45deg' }],
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 4,
    shadowColor: '#fbbf24',
    shadowOpacity: 0.95,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  matchFlameInner: {
    width: 8,
    height: 13,
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 2,
    backgroundColor: '#fff3a3',
  },
  matchHead: {
    width: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: '#dc2626',
    borderWidth: 2,
    borderColor: '#7f1d1d',
  },
  matchStem: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#f4c27a',
  },
  streakReward: {
    minWidth: 230,
    borderRadius: 20,
    backgroundColor: '#fbbf24',
    borderWidth: 1,
    borderColor: '#fde68a',
    paddingHorizontal: 22,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#f59e0b',
    shadowOpacity: 0.34,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },
  streakRewardValue: {
    color: '#0f172a',
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '900',
  },
  streakRewardCaption: {
    color: 'rgba(15,23,42,0.72)',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
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
  coinsHeroImage: {
    width: 92,
    height: 92,
    alignSelf: 'center',
    marginBottom: 10,
  },
  coinsTitle: {
    color: '#FBBF24',
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    fontFamily: Fonts.serif,
    letterSpacing: 0.3,
  },
  coinsSubtitle: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 13.5,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 18,
    paddingHorizontal: 12,
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
  langGlyph: {
    width: 22,
    textAlign: 'center',
    color: '#fbbf24',
    fontSize: 18,
    fontWeight: '800',
  },
  langGlyphSelected: {
    color: '#0f172a',
  },
  comingSoonNote: {
    color: 'rgba(251,191,36,0.55)',
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 12,
  },
  appearanceSection: {
    marginTop: 28,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },
  sectionTitle: {
    color: '#fef3c7',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    fontFamily: Fonts.serif,
    marginBottom: 8,
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
