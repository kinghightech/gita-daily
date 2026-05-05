export type Theme = {
  background: string;
  surface: string;
  card: string;
  popup: string;
  text: string;
  textWarm: string;
  subtext: string;
  subtextMuted: string;
  border: string;
  primary: string;
  blurTint: 'dark' | 'light';
};

export const darkTheme: Theme = {
  background: '#121212',
  surface: 'rgba(255,255,255,0.04)',
  card: '#1E293B',
  popup: 'rgba(15,23,42,0.97)',
  text: '#FFFFFF',
  textWarm: '#FEF3C7',
  subtext: 'rgba(255,255,255,0.45)',
  subtextMuted: 'rgba(255,255,255,0.3)',
  border: 'rgba(255,255,255,0.06)',
  primary: '#FBBF24',
  blurTint: 'dark',
};

export const lightTheme: Theme = {
  background: '#FDFCF7',
  surface: 'rgba(0,0,0,0.03)',
  card: '#FFFBF0',
  popup: 'rgba(255,252,243,0.97)',
  text: '#1A1A1A',
  textWarm: '#3D2B1F',
  subtext: 'rgba(26,26,26,0.55)',
  subtextMuted: 'rgba(26,26,26,0.4)',
  border: 'rgba(0,0,0,0.1)',
  primary: '#FBBF24',
  blurTint: 'light',
};
