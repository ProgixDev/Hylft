import { Redirect } from "expo-router";

export default function OnBoardingRedirect() {
  return <Redirect href={"/onboarding" as any} />;
}
