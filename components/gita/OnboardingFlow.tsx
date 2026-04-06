import BackgroundLayout from '@/components/BackgroundLayout';
import { Fonts } from '@/constants/theme';
import { Image } from 'expo-image';
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
import { TouchableOpacity,  KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View  } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

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

export default function OnboardingFlow({ onComplete, onReminderPreferenceChange }: OnboardingFlowProps) {
  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState('');
  const [reminderChoice, setReminderChoice] = useState<ReminderChoice>(null);
  const [preferredLanguage, setPreferredLanguage] = useState<PreferredLanguage | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const pageTransition = useSharedValue(1);

  const pageAnimatedStyle = useAnimatedStyle(() => {
    const opacity = pageTransition.value;
    const translateX = (1 - pageTransition.value) * 28;

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
    if (step === 0) return fullName.trim().length > 0;
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

  const setStepFromAnimation = (nextStep: number) => {
    setStep(nextStep);
    pageTransition.value = 0;
    pageTransition.value = withTiming(1, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
  };

  const animateToStep = (nextStep: number) => {
    pageTransition.value = withTiming(
      0,
      {
        duration: 150,
        easing: Easing.out(Easing.cubic),
      },
      (finished) => {
        if (!finished) return;
        runOnJS(setStepFromAnimation)(nextStep);
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
          <View style={styles.logoWrap}>
            <Image
              source={require('@/assets/images/onboarding-logo.png')}
              style={styles.logoImage}
              contentFit="contain"
            />
          </View>
          <Text style={styles.title}>Welcome to Gita Daily</Text>
          <Text style={styles.subtitle}>Begin your daily journey with wisdom from the Bhagavad Gita.</Text>

          <Text style={styles.label}>What’s your full name?</Text>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="Enter your full name"
            placeholderTextColor="rgba(251,191,36,0.35)"
            style={styles.input}
          />

          <Text style={styles.helper}>Your name helps personalize your experience.</Text>
        </>
      );
    }

    if (step === 1) {
      return (
        <>
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
            <TouchableOpacity activeOpacity={0.7}
              style={[styles.choiceCard, reminderChoice === 'yes' && styles.choiceCardSelected]}
              onPress={() => {
                void handleReminderChoice('yes');
              }}
            >
              <Bell size={18} color={reminderChoice === 'yes' ? '#0f172a' : '#fbbf24'} />
              <Text style={[styles.choiceText, reminderChoice === 'yes' && styles.choiceTextSelected]}>Yes, remind me</Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.7}
              style={[styles.choiceCard, reminderChoice === 'no' && styles.choiceCardSelected]}
              onPress={() => {
                void handleReminderChoice('no');
              }}
            >
              <Shield size={18} color={reminderChoice === 'no' ? '#0f172a' : '#fbbf24'} />
              <Text style={[styles.choiceText, reminderChoice === 'no' && styles.choiceTextSelected]}>No, maybe later</Text>
            </TouchableOpacity>
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
            <TouchableOpacity activeOpacity={0.7}
              style={[styles.choiceCard, preferredLanguage === 'english' && styles.choiceCardSelected]}
              onPress={() => setPreferredLanguage('english')}
            >
              <Globe size={18} color={preferredLanguage === 'english' ? '#0f172a' : '#fbbf24'} />
              <Text style={[styles.choiceText, preferredLanguage === 'english' && styles.choiceTextSelected]}>English</Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.7}
              style={[styles.choiceCard, preferredLanguage === 'hindi' && styles.choiceCardSelected]}
              onPress={() => setPreferredLanguage('hindi')}
            >
              <Globe size={18} color={preferredLanguage === 'hindi' ? '#0f172a' : '#fbbf24'} />
              <Text style={[styles.choiceText, preferredLanguage === 'hindi' && styles.choiceTextSelected]}>Hindi</Text>
            </TouchableOpacity>
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
          <TouchableOpacity activeOpacity={0.7}
            style={[styles.modeSwitchBtn, authMode === 'signup' && styles.modeSwitchBtnActive]}
            onPress={() => setAuthMode('signup')}
          >
            <Text style={[styles.modeSwitchText, authMode === 'signup' && styles.modeSwitchTextActive]}>
              Create Account
            </Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.7}
            style={[styles.modeSwitchBtn, authMode === 'login' && styles.modeSwitchBtnActive]}
            onPress={() => setAuthMode('login')}
          >
            <Text style={[styles.modeSwitchText, authMode === 'login' && styles.modeSwitchTextActive]}>
              Log In
            </Text>
          </TouchableOpacity>
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
    <BackgroundLayout>
      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
      >
        <View style={styles.contentWrap}>
          {step > 0 && (
            <TouchableOpacity activeOpacity={0.7}
              onPress={goBackFlow}
              style={styles.backBtn}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ChevronLeft size={22} color="#fef3c7" />
            </TouchableOpacity>
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

          <TouchableOpacity activeOpacity={0.7}
            onPress={continueFlow}
            disabled={!canContinue}
            style={[styles.continueBtn, !canContinue && styles.continueBtnDisabled]}
          >
            <Text style={[styles.continueText, !canContinue && styles.continueTextDisabled]}>
              {step === TOTAL_STEPS - 1 ? (authMode === 'signup' ? 'Finish' : 'Log In') : 'Continue'}
            </Text>
            {step < TOTAL_STEPS - 1 && <ChevronRight size={16} color={!canContinue ? 'rgba(15,23,42,0.45)' : '#0f172a'} />}
          </TouchableOpacity>
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
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 18,
  },
  logoImage: {
    width: 200,
    height: 200,
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
  continueBtnDisabled: {
    backgroundColor: 'rgba(251,191,36,0.35)',
  },
  continueText: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '800',
  },
  continueTextDisabled: {
    color: 'rgba(15,23,42,0.45)',
  },
});