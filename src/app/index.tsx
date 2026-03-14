import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import SplashScreen from "../components/ui/SplashScreen";
import { useAuth } from "../contexts/AuthContext";

export default function Index() {
  const router = useRouter();
  const { user, isLoading, hasCompletedOnboarding, hasCompletedGetStarted } = useAuth();
  const [splashDone, setSplashDone] = useState(false);
  const hasNavigated = useRef(false);

  useEffect(() => {
    if (!splashDone || isLoading || hasNavigated.current) return;

    hasNavigated.current = true;

    (async () => {
      try {
        const hasSeenOnboarding = await hasCompletedOnboarding();

        if (!hasSeenOnboarding) {
          router.navigate("/OnBoarding");
        } else if (!user) {
          router.navigate("/auth");
        } else {
          const doneGetStarted = await hasCompletedGetStarted();
          if (!doneGetStarted) {
            router.navigate("/get-started/units");
          } else {
            router.navigate("/(tabs)/schedule");
          }
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
        router.navigate("/OnBoarding");
      }
    })();
  }, [splashDone, isLoading]);

  if (!splashDone) {
    return <SplashScreen onAnimationComplete={() => setSplashDone(true)} />;
  }

  return null;
}
