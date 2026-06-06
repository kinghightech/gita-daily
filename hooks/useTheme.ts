import { useColorScheme } from '@/hooks/use-color-scheme';
import { darkTheme, lightTheme } from '@/theme/colors';

export function useTheme() {
  const colorScheme = useColorScheme();
  return colorScheme === 'dark' ? darkTheme : lightTheme;
}
