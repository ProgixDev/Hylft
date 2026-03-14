import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://xmezqfgmzdeybivelhtu.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtZXpxZmdtemRleWJpdmVsaHR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0ODgzOTAsImV4cCI6MjA4OTA2NDM5MH0.Rrv1n1_-ez8A6bFjyJh4ziS3_mksL9lPNq-omj2jkZs";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
