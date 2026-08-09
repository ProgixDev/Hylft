import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

// Credentials are injected at build time via Expo's `EXPO_PUBLIC_*` convention.
// See .env.example at the repo root for the required keys. The fallbacks
// preserve current behaviour if no .env is loaded (e.g. CI without secrets).
const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  "https://xysgrbeadtootpopydrj.supabase.co";

const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5c2dyYmVhZHRvb3Rwb3B5ZHJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5NDM2NDIsImV4cCI6MjEwMTUxOTY0Mn0.WaSMdk24zUjjC1UlmoCZDpLE2oTcV2oQf6U84ZI_TsA";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
