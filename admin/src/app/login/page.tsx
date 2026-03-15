"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { Dumbbell, Eye, EyeOff, Loader2 } from "lucide-react";
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
    <div className="flex min-h-svh">
      {/* Left branding panel */}
      <div className="hidden flex-1 flex-col items-center justify-center gap-6 bg-[#121417] lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#c8f14a]">
            <Dumbbell className="h-8 w-8 text-[#0b0d0e]" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white">Hylift</h1>
            <p className="text-sm text-[#bfc3c7]">Administration Panel</p>
          </div>
        </div>
        <div className="mt-4 max-w-md text-center">
          <p className="text-lg text-[#bfc3c7]">
            Manage users, workouts, routines, and content from your admin
            dashboard.
          </p>
        </div>
        <div className="mt-8 grid grid-cols-3 gap-6 text-center">
          <div>
            <p className="text-3xl font-bold text-[#c8f14a]">2.8K+</p>
            <p className="text-sm text-[#bfc3c7]">Users</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-[#c8f14a]">18K+</p>
            <p className="text-sm text-[#bfc3c7]">Workouts</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-[#c8f14a]">950+</p>
            <p className="text-sm text-[#bfc3c7]">Routines</p>
          </div>
        </div>
      </div>

      {/* Right login form */}
      <div className="flex flex-1 items-center justify-center p-6">
        <Card className="w-full max-w-md border-border/50">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#c8f14a] lg:hidden">
              <Dumbbell className="h-6 w-6 text-[#0b0d0e]" />
            </div>
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <p className="text-sm text-muted-foreground">
              Sign in to your admin account
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@hylift.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-0 right-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Sign In
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Demo: admin@hylift.com / admin123
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
