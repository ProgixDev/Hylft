import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import SplashScreen from "../components/ui/SplashScreen";
import { useAuth } from "../contexts/AuthContext";

export default function Index() {
  const router = useRouter();
  const { user, isLoading, hasCompletedOnboarding } = useAuth();
  const [splashDone, setSplashDone] = useState(false);
  const [destination, setDestination] = useState<string | null>(null);
  const hasNavigated = useRef(false);

  // Start auth checks immediately — runs in parallel with the splash animation
  useEffect(() => {
    if (isLoading) return;

    (async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem("@hylift_language");
        if (!savedLanguage) {
          setDestination("/get-started/language");
          return;
        }

        const hasSeenOnboarding = await hasCompletedOnboarding();
        if (!user) {
          setDestination(hasSeenOnboarding ? "/auth" : "/OnBoarding");
          return;
        }

        setDestination("/(tabs)/home");
      } catch (error) {
        console.error("Error checking auth status:", error);
        setDestination("/OnBoarding");
      }
    })();
  }, [isLoading, user, hasCompletedOnboarding]);

  // Navigate only when BOTH the splash animation is done AND the auth check is resolved
  useEffect(() => {
    if (!splashDone || !destination || hasNavigated.current) return;
    hasNavigated.current = true;
    router.replace(destination as any);
  }, [router, splashDone, destination]);

  // Always keep the splash visible — after its animation it's just a dark background,
  // so there's no blank screen while waiting for navigation to complete
  const handleAnimationComplete = useCallback(() => setSplashDone(true), []);
  return <SplashScreen onAnimationComplete={handleAnimationComplete} />;
}
