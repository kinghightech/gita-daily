
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY!;

const isSSR = Platform.OS === 'web' && typeof window === 'undefined';

const noopStorage = {
  getItem: async () => null,
  setItem: async () => {},
  removeItem: async () => {},
};

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: isSSR ? noopStorage : AsyncStorage,
    autoRefreshToken: true,
    persistSession: !isSSR,
    detectSessionInUrl: false,
  },
});