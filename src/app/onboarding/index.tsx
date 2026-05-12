import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import OnboardingScreen from "../../screens/Onboarding";
import { setHasSeenOnboarding } from "../../storage/onboarding";

export default function OnboardingRoute() {
  const router = useRouter();

  const onComplete = useCallback(async () => {
    await setHasSeenOnboarding(true);
    router.replace("/auth");
  }, [router]);

  return <OnboardingScreen onComplete={onComplete} />;
}
