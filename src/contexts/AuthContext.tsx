import AsyncStorage from "@react-native-async-storage/async-storage";
import { Session, User } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../services/supabase";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signUp: (
    email: string,
    password: string,
    username: string,
  ) => Promise<User | null>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  hasCompletedOnboarding: () => Promise<boolean>;
  setOnboardingCompleted: () => Promise<void>;
  hasCompletedGetStarted: (userId?: string) => Promise<boolean>;
  setGetStartedCompleted: (userId?: string) => Promise<void>;
}

const ONBOARDING_KEY = "@hylift_onboarding_completed";
const GET_STARTED_COMPLETED_KEY = "@hylift_get_started_completed";

const getStartedCompletedKey = (userId: string) =>
  `${GET_STARTED_COMPLETED_KEY}:${userId}`;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearLocalAuthState = async () => {
    // Keep this scoped to Supabase auth keys so we do not wipe unrelated app data.
    const keys = await AsyncStorage.getAllKeys();
    const supabaseAuthKeys = keys.filter(
      (key) => key.startsWith("sb-") && key.includes("-auth-token"),
    );
    if (supabaseAuthKeys.length > 0) {
      await AsyncStorage.multiRemove(supabaseAuthKeys);
    }
  };

  useEffect(() => {
    const bootstrapSession = async () => {
      try {
        const {
          data: { session: s },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          const message = error.message.toLowerCase();
          const isInvalidRefreshToken =
            message.includes("invalid refresh token") ||
            message.includes("refresh token not found");

          if (isInvalidRefreshToken) {
            await clearLocalAuthState();
            await supabase.auth.signOut({ scope: "local" });
            setSession(null);
          } else {
            throw error;
          }
        } else {
          setSession(s);
        }
      } catch (err) {
        console.error("[Auth] Failed to restore session", err);
        setSession(null);
      } finally {
        setIsLoading(false);
      }
    };

    void bootstrapSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, username: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    if (error) throw error;
    return data.user ?? null;
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signInWithGoogle = async (): Promise<void> => {
    const redirectUrl = Linking.createURL("/");
    console.log("[OAuth] redirectUrl =", redirectUrl);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
      },
    });

    if (error) throw error;
    if (!data.url) return;

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
    await WebBrowser.dismissBrowser();

    // iOS: WebBrowser intercepts the redirect directly — set session from URL here
    // Android/Expo Go: Chrome Custom Tabs can't redirect to exp://, so the deep link
    // is handled in auth/index.tsx via Linking.useURL()
    if (result.type === "success") {
      const url = new URL(result.url);
      const params = new URLSearchParams(url.hash.substring(1));
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");

      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (sessionError) throw sessionError;
      }
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const hasCompletedOnboarding = async () => {
    const val = await AsyncStorage.getItem(ONBOARDING_KEY);
    return val === "true";
  };

  const setOnboardingCompleted = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
  };

  const hasCompletedGetStarted = async (userId?: string) => {
    const id = userId ?? session?.user?.id;
    if (!id) return false;

    const localFlag = await AsyncStorage.getItem(getStartedCompletedKey(id));
    if (localFlag === "true") return true;

    const { data, error } = await supabase
      .from("user_profiles")
      .select("onboarding_completed")
      .eq("id", id)
      .maybeSingle();
    if (error) {
      console.error("[Auth] Failed to read onboarding status", error);
      return false;
    }
    const completed = data?.onboarding_completed === true;
    if (completed) {
      await AsyncStorage.setItem(getStartedCompletedKey(id), "true");
    }

    return completed;
  };

  const setGetStartedCompleted = async (userId?: string) => {
    const id = userId ?? session?.user?.id;
    if (!id) return;

    await AsyncStorage.setItem(getStartedCompletedKey(id), "true");

    const { error } = await supabase
      .from("user_profiles")
      .update({ onboarding_completed: true })
      .eq("id", id);
    if (error) {
      console.error("[Auth] Failed to mark onboarding complete", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        isLoading,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        hasCompletedOnboarding,
        setOnboardingCompleted,
        hasCompletedGetStarted,
        setGetStartedCompleted,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (ctx) return ctx;

  return {
    session: null,
    user: null,
    isLoading: true,
    signUp: async () => null,
    signIn: async () => {},
    signInWithGoogle: async () => {},
    signOut: async () => {},
    hasCompletedOnboarding: async () => false,
    setOnboardingCompleted: async () => {},
    hasCompletedGetStarted: async () => false,
    setGetStartedCompleted: async () => {},
  };
};
