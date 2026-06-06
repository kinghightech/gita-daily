import { useColorScheme as useSystemColorScheme } from 'react-native';
import { useAppearancePreference } from '@/lib/appearance';

/**
 * Effective color scheme: the user's appearance preference when set to a fixed
 * mode, otherwise the device's system scheme. Defaults to 'light' when the
 * system value is unavailable.
 */
export function useColorScheme(): 'light' | 'dark' {
  const system = useSystemColorScheme();
  const preference = useAppearancePreference();

  if (preference === 'system') {
    return system ?? 'light';
  }
  return preference;
}
