"use client";

import { supabase } from "@/lib/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
}

interface AuthResponse {
  success: boolean;
  error?: string;
}

interface AuthContextType {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

async function mapSupabaseUserToAdmin(
  sbUser: SupabaseUser,
): Promise<AdminUser> {
  const email = sbUser.email ?? "admin@hylift.app";
  let name = email.split("@")[0];
  let avatar = "AD";

  try {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("display_name, first_name, last_name, avatar_url")
      .eq("id", sbUser.id)
      .maybeSingle();

    if (profile) {
      if (profile.display_name) {
        name = profile.display_name;
      } else if (profile.first_name) {
        name = `${profile.first_name} ${profile.last_name ?? ""}`.trim();
      }
    }
  } catch {
    // If profile fetch fails, fallback gracefully to email
  }

  avatar = getInitials(name);
  const role = (sbUser.user_metadata?.role as string) ?? "Super Admin";

  return {
    id: sbUser.id,
    name,
    email,
    role,
    avatar,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    // 1. Check existing active session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user && isMounted) {
        const adminUser = await mapSupabaseUserToAdmin(session.user);
        if (isMounted) {
          setUser(adminUser);
        }
      }
      if (isMounted) {
        setIsLoading(false);
      }
    });

    // 2. Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const adminUser = await mapSupabaseUserToAdmin(session.user);
        if (isMounted) {
          setUser(adminUser);
        }
      } else if (event === "SIGNED_OUT") {
        if (isMounted) {
          setUser(null);
        }
      }
      if (isMounted) {
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<AuthResponse> => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          return {
            success: false,
            error: error.message || "Invalid email or password",
          };
        }

        if (!data.user) {
          return { success: false, error: "User not found" };
        }

        const adminUser = await mapSupabaseUserToAdmin(data.user);
        setUser(adminUser);
        router.push("/dashboard");
        return { success: true };
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "An unexpected error occurred";
        return { success: false, error: message };
      }
    },
    [router],
  );

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore sign-out errors
    } finally {
      setUser(null);
      router.push("/login");
    }
  }, [router]);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
