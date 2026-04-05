import OnboardingFlow from '@/components/gita/OnboardingFlow';
import { PREFERRED_LANGUAGE_CHANGED_EVENT } from '@/lib/preferredLanguage';
import { completeOnboardingProfile, getCurrentAuthUserWithRetry, syncProfileFromAuthUser, updateUserStreak } from '@/lib/profile';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Alert, AppState, DeviceEventEmitter, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { Toaster } from 'sonner';
import '../global.css';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

const ONBOARDING_COMPLETE_KEY = 'gitaDaily.onboardingComplete.v1';
const ONBOARDING_PROFILE_KEY = 'gitaDaily.onboardingProfile.v1';
const ONBOARDING_REPLAY_EVENT = 'gitaDaily.replayOnboarding';

type OnboardingPayload = {
  fullName: string;
  goals: string[];
  remindersEnabled: boolean;
  preferredLanguage: 'english' | 'hindi';
  authChoice: 'google' | 'apple' | 'email' | 'later' | null;
  email: string | null;
  password: string | null;
  authMode: 'signup' | 'login';
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isBooting, setIsBooting] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const persistReminderPreference = async (enabled: boolean) => {
    const authenticatedUser = await getCurrentAuthUserWithRetry();

    if (!authenticatedUser) {
      return;
    }

    try {
      await supabase.auth.updateUser({
        data: {
          daily_notification_enabled: enabled,
          notification_time: '08:00',
        },
      });
    } catch (error) {
      console.warn('Failed to update auth metadata for reminder preference', error);
    }

    const { error } = await supabase.from('profiles').upsert(
      {
        id: authenticatedUser.id,
        email: authenticatedUser.email ?? null,
        daily_notification_enabled: enabled,
        notification_time: '08:00',
      },
      { onConflict: 'id' }
    );

    if (error) {
      throw error;
    }
  };

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        // If a session exists, always enter the app directly.
        setShowOnboarding(!session?.user);

        if (session?.user) {
          void syncProfileFromAuthUser(session.user).catch((error) => {
            console.warn('Profile sync from session metadata failed', error);
          });
          void updateUserStreak().catch((error) => {
            console.warn('Daily streak update failed', error);
          });
        }
      } catch {
        if (!mounted) return;
        setShowOnboarding(true);
      } finally {
        if (mounted) setIsBooting(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(ONBOARDING_REPLAY_EVENT, () => {
      setShowOnboarding(true);
      setIsBooting(false);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user) {
            void updateUserStreak().catch((error) => {
              console.warn('Daily streak update on foreground failed', error);
            });
          }
        });
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const persistOnboardingToSupabase = async (userId: string, payload: OnboardingPayload) => {
    let metadataSaved = false;
    let profileSaved = false;

    // Always attempt to persist auth metadata as a fallback channel.
    try {
      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          full_name: payload.fullName,
          preferred_language: payload.preferredLanguage,
          daily_notification_enabled: payload.remindersEnabled,
          notification_time: '08:00',
          onboarding_complete: true,
        },
      });

      metadataSaved = !metadataError;
    } catch {
      metadataSaved = false;
    }

    try {
      await completeOnboardingProfile({
        userId,
        email: payload.email,
        fullName: payload.fullName,
        preferredLanguage: payload.preferredLanguage,
        remindersEnabled: payload.remindersEnabled,
        notificationTime: '08:00',
      });
      profileSaved = true;
    } catch {
      const { error: fallbackProfileError } = await supabase.from('profiles').upsert(
        {
          id: userId,
          full_name: payload.fullName,
          email: payload.email,
          preferred_language: payload.preferredLanguage,
          daily_notification_enabled: payload.remindersEnabled,
          notification_time: '08:00',
          onboarding_complete: true,
        },
        { onConflict: 'id' }
      );

      if (fallbackProfileError) {
        const { error: legacyFallbackProfileError } = await supabase.from('profiles').upsert(
          {
            id: userId,
            full_name: payload.fullName,
            email: payload.email,
            preferred_language: payload.preferredLanguage,
            daily_notification_enabled: payload.remindersEnabled,
            notification_time: '08:00',
            Onboarding_complete: true,
          },
          { onConflict: 'id' }
        );

        if (!legacyFallbackProfileError) {
          profileSaved = true;
        } else {
          console.warn('Fallback profile write failed', fallbackProfileError);
        }
      } else {
        profileSaved = true;
      }
    }

    if (!metadataSaved && !profileSaved) {
      throw new Error('All onboarding persistence channels failed.');
    }
  };

  const completeOnboarding = async (payload: OnboardingPayload) => {
    try {
      if (payload.authChoice !== 'email' || !payload.email || !payload.password) {
        Alert.alert('Authentication required', 'Please sign up or log in with email to continue.');
        return;
      }

      if (payload.authMode === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({
          email: payload.email,
          password: payload.password,
          options: {
            data: {
              full_name: payload.fullName,
            },
          },
        });

        if (signUpError) {
          Alert.alert('Sign up failed', signUpError.message);
          return;
        }

        const {
          data: { session: postSignUpSession },
        } = await supabase.auth.getSession();

        // Some projects require explicit sign-in after sign-up.
        if (!postSignUpSession?.user) {
          const { error: signInAfterSignUpError } = await supabase.auth.signInWithPassword({
            email: payload.email,
            password: payload.password,
          });

          if (signInAfterSignUpError) {
            Alert.alert(
              'Account created',
              'Your account was created. Please verify your email (if required), then log in.'
            );
            return;
          }
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: payload.email,
          password: payload.password,
        });

        if (signInError) {
          Alert.alert('Log in failed', signInError.message);
          return;
        }
      }

      const authenticatedUser = await getCurrentAuthUserWithRetry();

      if (!authenticatedUser) {
        Alert.alert('Authentication failed', 'Could not resolve the signed-in user. Please try again.');
        return;
      }

      let onboardingPersistWarning = false;
      try {
        await persistOnboardingToSupabase(authenticatedUser.id, {
          ...payload,
          email: authenticatedUser.email ?? payload.email,
        });
      } catch {
        onboardingPersistWarning = true;
      }

      void syncProfileFromAuthUser({
        ...authenticatedUser,
        user_metadata: {
          ...authenticatedUser.user_metadata,
          full_name: payload.fullName,
          preferred_language: payload.preferredLanguage,
          daily_notification_enabled: payload.remindersEnabled,
          notification_time: '08:00',
          onboarding_complete: true,
        },
      }).catch((error) => {
        console.warn('Non-blocking profile sync after onboarding failed', error);
      });

      await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
      await AsyncStorage.removeItem(ONBOARDING_PROFILE_KEY);
      DeviceEventEmitter.emit(PREFERRED_LANGUAGE_CHANGED_EVENT, payload.preferredLanguage);
      setShowOnboarding(false);

      if (onboardingPersistWarning) {
        Alert.alert(
          'Profile sync delayed',
          'Your account is ready. Some profile settings are still syncing and should update shortly.'
        );
      }
    } catch {
      Alert.alert('Something went wrong', 'Please try again.');
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {isBooting ? null : showOnboarding ? (
        <OnboardingFlow onComplete={completeOnboarding} onReminderPreferenceChange={persistReminderPreference} />
      ) : (
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          {Platform.OS === 'web' && <Toaster richColors position="top-center" />}
          <StatusBar style="light" />
        </ThemeProvider>
      )}
    </GestureHandlerRootView>
  );
}