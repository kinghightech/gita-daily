import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

/**
 * App-wide appearance preference. The app's theme normally follows the device's
 * system setting; this lets the user override it to always-dark or always-light.
 *
 * Stored locally (device-level, like most appearance settings) — not synced to
 * the profile/DB. `'system'` is the default and preserves the original behavior.
 */
export type ColorSchemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'gitaDaily.appearancePreference.v1';

let current: ColorSchemePreference = 'system';
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());

const isValid = (value: unknown): value is ColorSchemePreference =>
  value === 'light' || value === 'dark' || value === 'system';

/** Hydrate the preference from storage. Call once at app startup (before the
 * themed tree renders) so there is no flash of the wrong theme. */
export async function loadAppearancePreference(): Promise<ColorSchemePreference> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (isValid(stored)) {
      current = stored;
      emit();
    }
  } catch (error) {
    console.warn('Failed to load appearance preference', error);
  }
  return current;
}

/** Update the preference, notify subscribers immediately, and persist it. */
export function setAppearancePreference(preference: ColorSchemePreference): void {
  current = preference;
  emit();
  AsyncStorage.setItem(STORAGE_KEY, preference).catch((error) => {
    console.warn('Failed to persist appearance preference', error);
  });
}

export function getAppearancePreference(): ColorSchemePreference {
  return current;
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = () => current;

/** Reactive hook — re-renders consumers when the preference changes. */
export function useAppearancePreference(): ColorSchemePreference {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
