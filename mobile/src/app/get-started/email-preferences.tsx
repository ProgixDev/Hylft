import { Redirect, useLocalSearchParams } from "expo-router";

export default function EmailPreferences() {
  const params = useLocalSearchParams<{ flow?: string }>();

  return <Redirect href="/get-started/ready" />;
}
