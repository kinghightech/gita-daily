import { useColorScheme } from 'react-native';
import { darkTheme, lightTheme } from '@/theme/colors';

export function useTheme() {
  const colorScheme = useColorScheme();
  return colorScheme === 'dark' ? darkTheme : lightTheme;
}
