import { Redirect, useLocalSearchParams } from "expo-router";

export default function HealthConnect() {
  const params = useLocalSearchParams<{ flow?: string }>();

  return <Redirect href="/get-started/ready" />;
}
