import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://xysgrbeadtootpopydrj.supabase.co";

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5c2dyYmVhZHRvb3Rwb3B5ZHJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5NDM2NDIsImV4cCI6MjEwMTUxOTY0Mn0.WaSMdk24zUjjC1UlmoCZDpLE2oTcV2oQf6U84ZI_TsA";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
