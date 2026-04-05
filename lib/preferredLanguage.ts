import { fetchProfileByUserId } from '@/lib/profile';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type PreferredLanguage = 'english' | 'hindi';
export const PREFERRED_LANGUAGE_CHANGED_EVENT = 'gitaDaily.preferredLanguageChanged';

const ONBOARDING_PROFILE_KEY = 'gitaDaily.onboardingProfile.v1';

const normalizePreferredLanguage = (value: unknown): PreferredLanguage | null => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'english' || normalized === 'hindi') {
    return normalized;
  }
  return null;
};

const updateOnboardingCacheLanguage = async (preferredLanguage: PreferredLanguage) => {
  try {
    const cached = await AsyncStorage.getItem(ONBOARDING_PROFILE_KEY);
    if (!cached) return;

    const parsed = JSON.parse(cached);
    if (!parsed || typeof parsed !== 'object') return;

    const updated = {
      ...parsed,
      preferredLanguage,
    };

    await AsyncStorage.setItem(ONBOARDING_PROFILE_KEY, JSON.stringify(updated));
  } catch {
    // ignore local cache update failures
  }
};

const readOnboardingCachedLanguage = async (): Promise<PreferredLanguage | null> => {
  try {
    const cached = await AsyncStorage.getItem(ONBOARDING_PROFILE_KEY);
    if (!cached) return null;
    const parsed = JSON.parse(cached);
    return normalizePreferredLanguage(parsed?.preferredLanguage);
  } catch {
    return null;
  }
};

export const mapPreferredLanguageToLabel = (language: PreferredLanguage) =>
  language === 'hindi' ? 'Hindi' : 'English';

export const mapLabelToPreferredLanguage = (label: string): PreferredLanguage | null => {
  const normalized = label.trim().toLowerCase();
  if (normalized === 'english') return 'english';
  if (normalized === 'hindi') return 'hindi';
  return null;
};

export const loadPreferredLanguageForCurrentUser = async (): Promise<PreferredLanguage> => {
  const cachedOnboardingLanguage = await readOnboardingCachedLanguage();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return cachedOnboardingLanguage ?? 'english';
    }

    try {
      const profile = await fetchProfileByUserId(user.id);
      const profileLanguage = normalizePreferredLanguage(profile?.preferred_language);
      if (profileLanguage) {
        return profileLanguage;
      }
    } catch {
      // ignore profile lookup failures and continue fallback chain
    }

    const metadataLanguage = normalizePreferredLanguage(user.user_metadata?.preferred_language);
    if (metadataLanguage) {
      return metadataLanguage;
    }

    return cachedOnboardingLanguage ?? 'english';
  } catch {
    return cachedOnboardingLanguage ?? 'english';
  }
};

export const savePreferredLanguageForCurrentUser = async (preferredLanguage: PreferredLanguage) => {
  const normalized = normalizePreferredLanguage(preferredLanguage) ?? 'english';

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let metadataError: Error | null = null;
  let profileError: Error | null = null;

  if (user?.id) {
    const { error: updateUserError } = await supabase.auth.updateUser({
      data: {
        preferred_language: normalized,
      },
    });

    if (updateUserError) {
      metadataError = updateUserError;
    }

    const { error: updateProfileLanguageError } = await supabase
      .from('profiles')
      .update({ preferred_language: normalized, onboarding_complete: true })
      .eq('id', user.id);

    if (!updateProfileLanguageError) {
      profileError = null;
    } else {
      const { error: legacyUpdateProfileError } = await supabase
        .from('profiles')
        .update({ preferred_language: normalized, Onboarding_complete: true })
        .eq('id', user.id);

      if (!legacyUpdateProfileError) {
        profileError = null;
      } else {
        const { error: upsertProfileError } = await supabase
          .from('profiles')
          .upsert(
            {
              id: user.id,
              preferred_language: normalized,
              onboarding_complete: true,
            },
            { onConflict: 'id' }
          );

        if (!upsertProfileError) {
          profileError = null;
        } else {
          const { error: legacyUpsertProfileError } = await supabase
            .from('profiles')
            .upsert(
              {
                id: user.id,
                preferred_language: normalized,
                Onboarding_complete: true,
              },
              { onConflict: 'id' }
            );

          profileError = legacyUpsertProfileError ?? upsertProfileError;
        }
      }
    }
  }

  await updateOnboardingCacheLanguage(normalized);

  if (metadataError && profileError) {
    throw profileError;
  }
};
