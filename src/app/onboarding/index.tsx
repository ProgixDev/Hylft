import OrbitOnboardingScreen from "../../components/onboarding/OrbitOnboardingScreen";

export default function FirstOnboardingRoute() {
  return <OrbitOnboardingScreen screenIndex={0} nextRoute="/onboarding/second" />;
}
