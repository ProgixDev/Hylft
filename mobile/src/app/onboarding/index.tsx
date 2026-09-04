import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import NewOnboarding from "../../screens/Onboarding/NewOnboarding";
import { setHasSeenOnboarding } from "../../storage/onboarding";

export default function OnboardingRoute() {
  const router = useRouter();

  const onComplete = useCallback(async () => {
    await setHasSeenOnboarding(true);
    router.replace("/auth");
  }, [router]);

  return <NewOnboarding onComplete={onComplete} />;
}
