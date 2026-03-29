import {
  Zain_300Light,
  Zain_400Regular,
  Zain_700Bold,
  Zain_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/zain";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { ActiveWorkoutProvider } from "../contexts/ActiveWorkoutContext";
import { AuthProvider } from "../contexts/AuthContext";
import { CreateRoutineProvider } from "../contexts/CreateRoutineContext";
import { HealthProvider } from "../contexts/HealthContext";
import { I18nProvider, useI18n } from "../contexts/I18nContext";
import { NutritionProvider } from "../contexts/NutritionContext";
import { ThemeProvider } from "../contexts/ThemeContext";

SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore errors if splash screen was already prevented.
});

function AppContent() {
  const { isLoading } = useI18n();

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#FFFFFF",
        }}
      >
        <ActivityIndicator size="large" color="#004BFF" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" translucent backgroundColor="transparent" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#FFFFFF" },
          statusBarStyle: "dark",
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="OnBoarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="exercise-picker/index" />
        <Stack.Screen name="create-routine/index" />
        <Stack.Screen name="settings/index" />
        <Stack.Screen name="settings/edit-profile" />
        <Stack.Screen name="settings/change-password" />
        <Stack.Screen name="settings/help-center" />
        <Stack.Screen name="settings/about" />
        <Stack.Screen name="settings/terms" />
        <Stack.Screen name="settings/privacy" />
        <Stack.Screen name="user/follows/[id]" />
        <Stack.Screen name="schedule/[date]" />
        <Stack.Screen name="get-started/language" />
        <Stack.Screen name="get-started/gender" />
        <Stack.Screen name="get-started/units" />
        <Stack.Screen name="get-started/age" />
        <Stack.Screen name="get-started/height" />
        <Stack.Screen name="get-started/weight" />
        <Stack.Screen name="get-started/target-weight" />
        <Stack.Screen name="get-started/fitness-goal" />
        <Stack.Screen name="get-started/experience-level" />
        <Stack.Screen name="get-started/workout-frequency" />
        <Stack.Screen name="get-started/focus-areas" />
        <Stack.Screen name="get-started/health-connect" />
        <Stack.Screen name="get-started/ready" />
        <Stack.Screen name="get-started/email-preferences" />
        <Stack.Screen name="share-workout/index" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Zain_300Light,
    Zain_400Regular,
    Zain_700Bold,
    Zain_800ExtraBold,
  });

  useEffect(() => {
    if (fontError) {
      throw fontError;
    }
  }, [fontError]);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {
        // Ignore errors if splash screen was already hidden.
      });
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={{ flex: 1 }}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <I18nProvider>
          <ThemeProvider>
            <AuthProvider>
              <HealthProvider>
              <NutritionProvider>
              <ActiveWorkoutProvider>
                <CreateRoutineProvider>
                <SafeAreaProvider>
                  <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
                    <AppContent />
                  </SafeAreaView>
                </SafeAreaProvider>
                </CreateRoutineProvider>
              </ActiveWorkoutProvider>
              </NutritionProvider>
              </HealthProvider>
            </AuthProvider>
          </ThemeProvider>
        </I18nProvider>
      </GestureHandlerRootView>
    </View>
  );
}
