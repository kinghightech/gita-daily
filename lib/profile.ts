import { PREFERRED_LANGUAGE_CHANGED_EVENT } from '@/lib/preferredLanguage';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import { DeviceEventEmitter } from 'react-native';

export const STREAK_UPDATED_EVENT = 'gitaDaily.streakUpdated.v1';

export type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  preferred_language: 'english' | 'hindi' | null;
  daily_notification_enabled: boolean | null;
  notification_time: string | null;
  onboarding_complete: boolean | null;
  profile_picture: string | null;
  streak_count: number;
  longest_streak: number;
  last_opened_at: string | null;
  created_at: string | null;
  current_login_date: string | null;
  previous_login_date: string | null;
  onboarding_complete_legacy: boolean | null;
  current_lotus_level: number;
  shares_count: number;
  bookmark_chapter: number | null;
  bookmark_verse: number | null;
};

type RawProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  preferred_language?: string | null;
  daily_notification_enabled?: boolean | null;
  notification_time?: string | null;
  onboarding_complete?: boolean | null;
  Onboarding_complete?: boolean | null;
  profile_picture?: string | null;
  streak_count?: number;
  longest_streak?: number;
  last_opened_at?: string | null;
  created_at?: string | null;
  current_login_date?: string | null;
  previous_login_date?: string | null;
  current_lotus_level?: number;
  shares_count?: number;
  bookmark_chapter?: number | null;
  bookmark_verse?: number | null;
};

const isBlank = (value: string | null | undefined) => !value || value.trim().length === 0;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const isGenericName = (value: string | null | undefined) => {
  if (!value) return true;
  const normalized = value.trim().toLowerCase();
  return normalized.length === 0 || normalized === 'user' || normalized === 'your name';
};

const getReadableNameFromEmail = (email: string | null | undefined) => {
  if (!email) return '';
  const local = email.split('@')[0]?.trim();
  if (!local) return '';
  const normalized = local.replace(/[._-]+/g, ' ').trim();
  if (!normalized) return '';
  return normalized
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

export const getCurrentAuthUserWithRetry = async (): Promise<User | null> => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (!error && user) {
      return user;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
      return session.user;
    }

    await wait(180);
  }

  return null;
};

export const syncProfileFromAuthUser = async (user: User) => {
  const metadataName =
    typeof user.user_metadata?.full_name === 'string'
      ? user.user_metadata.full_name.trim()
      : typeof user.user_metadata?.name === 'string'
        ? user.user_metadata.name.trim()
        : '';

  const metadataLanguageRaw =
    typeof user.user_metadata?.preferred_language === 'string'
      ? user.user_metadata.preferred_language.toLowerCase().trim()
      : '';
  const metadataLanguage = metadataLanguageRaw === 'hindi' || metadataLanguageRaw === 'english'
    ? metadataLanguageRaw
    : null;

  const metadataOnboardingComplete = user.user_metadata?.onboarding_complete === true;
  const metadataDailyNotificationEnabled =
    typeof user.user_metadata?.daily_notification_enabled === 'boolean'
      ? user.user_metadata.daily_notification_enabled
      : null;
  const metadataNotificationTime =
    typeof user.user_metadata?.notification_time === 'string' && user.user_metadata.notification_time.trim().length > 0
      ? user.user_metadata.notification_time.trim()
      : null;

  const payload: {
    id: string;
    email: string | null;
    full_name?: string;
    preferred_language?: 'english' | 'hindi';
    daily_notification_enabled?: boolean;
    notification_time?: string;
    onboarding_complete?: boolean;
    Onboarding_complete?: boolean;
  } = {
    id: user.id,
    email: user.email ?? null,
  };

  if (metadataName && !isGenericName(metadataName)) {
    payload.full_name = metadataName;
  }

  if (metadataLanguage) {
    payload.preferred_language = metadataLanguage;
  }

  if (typeof metadataDailyNotificationEnabled === 'boolean') {
    payload.daily_notification_enabled = metadataDailyNotificationEnabled;
  }

  if (metadataNotificationTime) {
    payload.notification_time = metadataNotificationTime;
  }

  if (metadataOnboardingComplete) {
    payload.onboarding_complete = true;
    payload.Onboarding_complete = true;
  }

  const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
  if (!error) {
    return;
  }

  const { error: legacyError } = await supabase.from('profiles').upsert(
    {
      id: user.id,
      email: user.email ?? null,
      ...(metadataName && !isGenericName(metadataName) ? { full_name: metadataName } : {}),
      ...(metadataLanguage ? { preferred_language: metadataLanguage } : {}),
      ...(typeof metadataDailyNotificationEnabled === 'boolean'
        ? { daily_notification_enabled: metadataDailyNotificationEnabled }
        : {}),
      ...(metadataNotificationTime ? { notification_time: metadataNotificationTime } : {}),
      ...(metadataOnboardingComplete ? { Onboarding_complete: true } : {}),
    },
    { onConflict: 'id' }
  );

  if (legacyError) {
    throw error;
  }
};

export const fetchProfileByUserId = async (userId: string): Promise<ProfileRow | null> => {
  const normalize = (row: RawProfileRow | null): ProfileRow | null => {
    if (!row) return null;

    const normalizedLanguage =
      typeof row.preferred_language === 'string' ? row.preferred_language.trim().toLowerCase() : '';

    return {
      id: row.id,
      full_name: row.full_name ?? null,
      email: row.email ?? null,
      preferred_language:
        normalizedLanguage === 'english' || normalizedLanguage === 'hindi'
          ? (normalizedLanguage as 'english' | 'hindi')
          : null,
      daily_notification_enabled:
        typeof row.daily_notification_enabled === 'boolean' ? row.daily_notification_enabled : null,
      notification_time: typeof row.notification_time === 'string' ? row.notification_time : null,
      onboarding_complete:
        typeof row.onboarding_complete === 'boolean'
          ? row.onboarding_complete
          : typeof row.Onboarding_complete === 'boolean'
            ? row.Onboarding_complete
            : null,
      profile_picture: row.profile_picture ?? null,
      streak_count: row.streak_count ?? 0,
      longest_streak: row.longest_streak ?? 0,
      last_opened_at: row.last_opened_at ?? null,
      created_at: row.created_at ?? null,
      current_login_date: row.current_login_date ?? null,
      previous_login_date: row.previous_login_date ?? null,
      onboarding_complete_legacy: row.Onboarding_complete ?? null,
      current_lotus_level: row.current_lotus_level ?? 1,
      shares_count: row.shares_count ?? 0,
      bookmark_chapter: row.bookmark_chapter ?? null,
      bookmark_verse: row.bookmark_verse ?? null,
    };
  };

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, preferred_language, daily_notification_enabled, notification_time, onboarding_complete, Onboarding_complete, profile_picture, streak_count, longest_streak, last_opened_at, created_at, current_login_date, previous_login_date, current_lotus_level, shares_count, bookmark_chapter, bookmark_verse')
    .eq('id', userId)
    .maybeSingle();

  if (!error) {
    return normalize(data as RawProfileRow | null);
  }

  const { data: legacyData, error: legacyError } = await supabase
    .from('profiles')
    .select('id, full_name, email, preferred_language, daily_notification_enabled, notification_time, Onboarding_complete, profile_picture')
    .eq('id', userId)
    .maybeSingle();

  if (!legacyError) {
    return normalize(legacyData as RawProfileRow | null);
  }

  // Fallback if schema cache is behind for newer optional columns.
  const { data: fallbackData, error: fallbackError } = await supabase
    .from('profiles')
    .select('id, full_name, email, profile_picture')
    .eq('id', userId)
    .maybeSingle();

  if (fallbackError) {
    throw error;
  }

  return normalize(fallbackData as RawProfileRow | null);
};

export const fetchCurrentUserAndProfile = async (): Promise<{
  user: { id: string; email: string | null; auth_name: string | null } | null;
  profile: ProfileRow | null;
}> => {
  const user = await getCurrentAuthUserWithRetry();

  if (!user) {
    return { user: null, profile: null };
  }

  const authName =
    typeof user.user_metadata?.full_name === 'string'
      ? user.user_metadata.full_name
      : typeof user.user_metadata?.name === 'string'
        ? user.user_metadata.name
        : null;

  let profile: ProfileRow | null = null;
  try {
    profile = await fetchProfileByUserId(user.id);
  } catch (error) {
    // Keep app usable even if profiles query fails due RLS/schema drift.
    console.warn('Failed to fetch profile row', error);
  }

  return {
    user: {
      id: user.id,
      email: user.email ?? null,
      auth_name: authName,
    },
    profile,
  };
};

export const incrementSharesCount = async (userId: string) => {
  if (!userId) return;
  const { error } = await supabase.rpc('increment_shares_count', { user_id: userId });
  if (error) {
    console.error('Error incrementing shares count:', error);
  }
};

export const completeOnboardingProfile = async (params: {
  userId: string;
  email: string | null;
  fullName: string;
  preferredLanguage: 'english' | 'hindi';
  remindersEnabled: boolean;
  notificationTime?: string;
}) => {
  const trimmedName = params.fullName.trim();
  const existingProfile = await fetchProfileByUserId(params.userId);
  const normalizedNotificationTime = params.notificationTime ?? '08:00';

  if (!existingProfile) {
    const insertPayload = {
      id: params.userId,
      full_name: trimmedName.length > 0 ? trimmedName : null,
      email: params.email,
      preferred_language: params.preferredLanguage,
      daily_notification_enabled: params.remindersEnabled,
      notification_time: normalizedNotificationTime,
      onboarding_complete: true,
    };

    const { error } = await supabase.from('profiles').insert(insertPayload);

    if (!error) {
      return;
    }

    const { error: legacyInsertError } = await supabase.from('profiles').insert({
      id: params.userId,
      full_name: trimmedName.length > 0 ? trimmedName : null,
      email: params.email,
      preferred_language: params.preferredLanguage,
      daily_notification_enabled: params.remindersEnabled,
      notification_time: normalizedNotificationTime,
      Onboarding_complete: true,
    });

    if (legacyInsertError) {
      throw error;
    }

    return;
  }

  const updatePayload: {
    full_name?: string;
    email?: string;
    preferred_language: 'english' | 'hindi';
    daily_notification_enabled: boolean;
    notification_time: string;
    onboarding_complete: boolean;
  } = {
    preferred_language: params.preferredLanguage,
    daily_notification_enabled: params.remindersEnabled,
    notification_time: normalizedNotificationTime,
    onboarding_complete: true,
  };

  if ((isBlank(existingProfile.full_name) || isGenericName(existingProfile.full_name)) && trimmedName.length > 0) {
    updatePayload.full_name = trimmedName;
  }

  if (isBlank(existingProfile.email) && params.email) {
    updatePayload.email = params.email;
  }

  const { error } = await supabase
    .from('profiles')
    .update(updatePayload)
    .eq('id', params.userId);

  if (!error) {
    return;
  }

  const legacyUpdatePayload: {
    full_name?: string;
    email?: string;
    preferred_language: 'english' | 'hindi';
    daily_notification_enabled: boolean;
    notification_time: string;
    Onboarding_complete: boolean;
  } = {
    preferred_language: params.preferredLanguage,
    daily_notification_enabled: params.remindersEnabled,
    notification_time: normalizedNotificationTime,
    Onboarding_complete: true,
  };

  if ((isBlank(existingProfile.full_name) || isGenericName(existingProfile.full_name)) && trimmedName.length > 0) {
    legacyUpdatePayload.full_name = trimmedName;
  }

  if (isBlank(existingProfile.email) && params.email) {
    legacyUpdatePayload.email = params.email;
  }

  const { error: legacyUpdateError } = await supabase
    .from('profiles')
    .update(legacyUpdatePayload)
    .eq('id', params.userId);

  if (legacyUpdateError) {
    throw error;
  }
};

export const getProfileDisplayName = (
  profile: ProfileRow | null,
  user?: { auth_name: string | null; email?: string | null } | null
) => {
  const profileName = typeof profile?.full_name === 'string' ? profile.full_name.trim() : '';
  if (!isGenericName(profileName)) return profileName;

  const authName = typeof user?.auth_name === 'string' ? user.auth_name.trim() : '';
  if (!isGenericName(authName)) return authName;

  const emailName = getReadableNameFromEmail(user?.email);
  if (!isGenericName(emailName)) return emailName;

  return 'Your Name';
};

export const updateUserStreak = async (): Promise<number> => {
  // Pass the user's actual timezone string (e.g., 'America/New_York')
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const { data, error } = await supabase.rpc('handle_daily_streak', { user_timezone: timeZone });

  if (error) {
    console.error('Failed to update user streak:', error);
    return 0;
  }

  const streak = typeof data === 'number' ? data : 0;
  DeviceEventEmitter.emit(STREAK_UPDATED_EVENT, streak);
  return streak;
};

export const updateBookmark = async (userId: string, chapter: number | null, verse: number | null) => {
  if (!userId) return false;
  const { error } = await supabase
    .from('profiles')
    .update({ 
      bookmark_chapter: chapter, 
      bookmark_verse: verse 
    })
    .eq('id', userId);
  
  if (error) {
    console.error('Error saving bookmark:', error);
    return false;
  }
  return true;
};
