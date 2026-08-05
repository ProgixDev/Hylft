import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

// Credentials are injected at build time via Expo's `EXPO_PUBLIC_*` convention.
// See .env.example at the repo root for the required keys. The fallbacks
// preserve current behaviour if no .env is loaded (e.g. CI without secrets).
const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  "https://xmezqfgmzdeybivelhtu.supabase.co";

const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtZXpxZmdtemRleWJpdmVsaHR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0ODgzOTAsImV4cCI6MjA4OTA2NDM5MH0.Rrv1n1_-ez8A6bFjyJh4ziS3_mksL9lPNq-omj2jkZs";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
