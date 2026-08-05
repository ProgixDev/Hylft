import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

// Credentials are injected at build time via Expo's `EXPO_PUBLIC_*` convention.
// See .env.example at the repo root for the required keys. The fallbacks
// preserve current behaviour if no .env is loaded (e.g. CI without secrets).
const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  "https://atzrzphdeqettocwygxf.supabase.co";

const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0enJ6cGhkZXFldHRvY3d5Z3hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5NTkzMjYsImV4cCI6MjEwMTUzNTMyNn0.EthcQaWzUW6FLO0Japd1BHaA1_XcEXx67f_kfEaDfjc";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
