import { Platform } from 'react-native';

// Gita Daily app theme — dark blue + gold/amber
const tintColorLight = '#FBBF24';
const tintColorDark = '#FBBF24';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#FEF3C7',
    background: '#0F172A',
    tint: tintColorDark,
    icon: '#94A3B8',
    tabIconDefault: '#94A3B8',
    tabIconSelected: tintColorDark,
  },
};

// Gita Daily specific palette
export const GitaColors = {
  bg: '#0F172A',
  bgCard: '#1E293B',
  bgCardAlt: 'rgba(15,23,42,0.95)',
  gold: '#FBBF24',
  goldMuted: 'rgba(251,191,36,0.7)',
  goldBorder: 'rgba(251,191,36,0.3)',
  text: '#FEF3C7',
  textMuted: 'rgba(254,243,199,0.7)',
  red: '#F87171',
  orange: '#F97316',
  green: '#22C55E',
  teal: '#14B8A6',
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'Georgia',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "sans-serif",
    mono: "monospace",
  },
});
