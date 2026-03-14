import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { Session, User } from "@supabase/supabase-js";
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../services/supabase";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  hasCompletedOnboarding: () => Promise<boolean>;
  setOnboardingCompleted: () => Promise<void>;
  hasCompletedGetStarted: () => Promise<boolean>;
  setGetStartedCompleted: () => Promise<void>;
}

const ONBOARDING_KEY = "@hylift_onboarding_completed";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, username: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    if (error) throw error;
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signInWithGoogle = async () => {
    const redirectUrl = Linking.createURL("/");

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
      },
    });

    if (error) throw error;

    if (data.url) {
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectUrl,
      );

      // Always dismiss the browser to avoid "site can't be reached" screen
      await WebBrowser.dismissBrowser();

      if (result.type === "success") {
        const url = new URL(result.url);
        const params = new URLSearchParams(url.hash.substring(1));
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        if (accessToken && refreshToken) {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
        }
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
    const { data } = await supabase
      .from("user_profiles")
      .select("onboarding_completed")
      .eq("id", id)
      .single();
    return data?.onboarding_completed === true;
  };

  const setGetStartedCompleted = async () => {
    const id = session?.user?.id;
    if (!id) return;
    await supabase
      .from("user_profiles")
      .update({ onboarding_completed: true })
      .eq("id", id);
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
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
