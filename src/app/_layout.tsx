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
import {
    SafeAreaProvider,
    useSafeAreaInsets,
} from "react-native-safe-area-context";
import { ActiveWorkoutProvider } from "../contexts/ActiveWorkoutContext";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { CreateRoutineProvider } from "../contexts/CreateRoutineContext";
import { HealthProvider } from "../contexts/HealthContext";
import { I18nProvider, useI18n } from "../contexts/I18nContext";
import { NutritionProvider } from "../contexts/NutritionContext";
import { ThemeProvider, useTheme } from "../contexts/ThemeContext";

import ProModal from "../components/ui/ProModal";

SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore errors if splash screen was already prevented.
});

function AppContent() {
  const { isLoading } = useI18n();
  const { user } = useAuth();
  const { theme, themeType } = useTheme();
  const insets = useSafeAreaInsets();
  const [showProModal, setShowProModal] = React.useState(false);
  const previousUser = React.useRef(user);

  React.useEffect(() => {
    // Show ProModal when user transitions from null to logged in
    if (!previousUser.current && user) {
      // In a real app we'd check if user.isPro here
      // const isPro = false;
      // if (!isPro) {
      setShowProModal(true);
      // }
    }
    previousUser.current = user;
  }, [user]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.background.dark,
        }}
      >
        <ActivityIndicator size="large" color={theme.primary.main} />
      </View>
    );
  }

  return (
    <>
      <StatusBar
        style={themeType === "dark" ? "light" : "dark"}
        translucent
        backgroundColor="transparent"
      />

      <ProModal visible={showProModal} onClose={() => setShowProModal(false)} />

      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: theme.background.dark,
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
            paddingLeft: insets.left,
            paddingRight: insets.right,
          },
          statusBarStyle: themeType === "dark" ? "light" : "dark",
          statusBarTranslucent: true,
          navigationBarColor: "transparent",
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="OnBoarding" options={{ animation: "none" }} />
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
        <Stack.Screen
          name="get-started/username"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="get-started/goal"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="get-started/goal-congrats"
          options={{ animation: "fade" }}
        />
        <Stack.Screen
          name="get-started/habits"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="get-started/habits-congrats"
          options={{ animation: "fade" }}
        />
        <Stack.Screen
          name="get-started/meal-planning"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="get-started/meal-congrats"
          options={{ animation: "fade" }}
        />
        <Stack.Screen
          name="get-started/activity-level"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="get-started/weekly-goal"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="get-started/account"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen name="objective/index" />
        <Stack.Screen name="food-search" />
        <Stack.Screen name="share-workout/index" />
        <Stack.Screen
          name="workout-player/index"
          options={{ gestureEnabled: false, animation: "slide_from_bottom" }}
        />
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
                        <View style={{ flex: 1, backgroundColor: "#0B0D11" }}>
                          <AppContent />
                        </View>
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
