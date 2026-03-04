// User Preferences entity
// NOTE: Needs base44 API
export interface UserPreferences {
  id: string;
  userId: string;
  theme: 'light' | 'dark';
  language: string;
  preferences: Record<string, any>;
}
