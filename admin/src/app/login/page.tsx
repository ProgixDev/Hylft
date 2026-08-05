"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const success = await login(email, password);
    if (!success) {
      setError("Invalid email or password");
    }
    setIsLoading(false);
  };

  if (authLoading) return null;

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background">
      {/* Background glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-125 w-175 -translate-x-1/2 rounded-full bg-lime/5 blur-[120px]" />

      <div className="relative z-10 w-full max-w-md px-8">
        {/* Logo + title */}
        <div className="mb-12 flex flex-col items-center">
          <Image
            src="/Logo.png"
            alt="Hylift"
            width={96}
            height={96}
            className="mb-6"
            priority
          />
          <h1 className="text-4xl font-bold tracking-tight text-white">
            Hylift Admin
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            Sign in to continue
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm text-muted-foreground">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@admin.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 text-base border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-lime/40"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm text-muted-foreground">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 text-base border-white/10 bg-white/5 pr-12 text-white placeholder:text-white/30 focus-visible:ring-lime/40"
              />
              <button
                type="button"
                className="absolute top-1/2 right-4 -translate-y-1/2 text-white/40 transition-colors hover:text-white/70"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-center text-base text-danger">{error}</p>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="h-12 w-full text-base bg-lime font-semibold text-primary-foreground hover:bg-lime-light"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-white/30">
          Demo &mdash; admin@admin.com / admin123
        </p>
      </div>
    </div>
  );
}
