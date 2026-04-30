import {
    Zain_300Light,
    Zain_400Regular,
    Zain_700Bold,
    Zain_800ExtraBold,
    useFonts,
} from "@expo-google-fonts/zain";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter, useSegments } from "expo-router";
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
import { TutorialTargetProvider } from "../contexts/TutorialTargetContext";

import ProModal from "../components/ui/ProModal";
import AppTutorialOverlay from "../components/onboarding/AppTutorialOverlay";
import {
  APP_TUTORIAL_COMPLETED_KEY,
  APP_TUTORIAL_PENDING_KEY,
  userTutorialStorageKey,
} from "../constants/tutorial";
import { hasProEntitlement } from "../services/googlePlayBilling";

SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore errors if splash screen was already prevented.
});

function AppContent() {
  const { isLoading } = useI18n();
  const { user } = useAuth();
  const { theme, themeType } = useTheme();
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const [showProModal, setShowProModal] = React.useState(false);
  const [showTutorial, setShowTutorial] = React.useState(false);
  const previousUser = React.useRef(user);
  const [isProEntitled, setIsProEntitled] = React.useState(false);
  const routeSegments = segments as string[];
  const isAuthRoute = routeSegments[0] === "auth";
  const isGetStartedRoute = routeSegments[0] === "get-started";
  const isPlanBuildingRoute =
    isGetStartedRoute && routeSegments[1] === "ready";
  const shellBackgroundColor = isAuthRoute ? "#06101F" : theme.background.dark;

  useEffect(() => {
    if (isLoading || user) return;

    const firstSegment = segments[0];
    const isPublicRoute =
      firstSegment === undefined ||
      firstSegment === "OnBoarding" ||
      firstSegment === "onboarding" ||
      firstSegment === "auth" ||
      firstSegment === "get-started";

    if (!isPublicRoute) {
      router.replace("/get-started/language");
    }
  }, [isLoading, user, segments, router]);

  React.useEffect(() => {
    let active = true;

    const syncEntitlement = async () => {
      if (!user) {
        if (active) {
          setIsProEntitled(false);
          setShowProModal(false);
          previousUser.current = null;
        }
        return;
      }

      const entitled = await hasProEntitlement(user.id);
      if (!active) return;

      setIsProEntitled(entitled);
      const wasLoggedOut = !previousUser.current;
      previousUser.current = user;
      if (wasLoggedOut && !entitled) {
        const pendingTutorial = await AsyncStorage.getItem(
          userTutorialStorageKey(APP_TUTORIAL_PENDING_KEY, user.id),
        );
        setShowProModal(pendingTutorial !== "true");
      }
    };

    void syncEntitlement();

    return () => {
      active = false;
    };
  }, [user]);

  React.useEffect(() => {
    let active = true;

    const loadTutorialState = async () => {
      if (!user?.id) {
        if (active) setShowTutorial(false);
        return;
      }

      const pendingKey = userTutorialStorageKey(
        APP_TUTORIAL_PENDING_KEY,
        user.id,
      );
      const completedKey = userTutorialStorageKey(
        APP_TUTORIAL_COMPLETED_KEY,
        user.id,
      );
      const [pending, completed] = await Promise.all([
        AsyncStorage.getItem(pendingKey),
        AsyncStorage.getItem(completedKey),
      ]);

      if (active) {
        setShowTutorial(pending === "true" && completed !== "true");
      }
    };

    void loadTutorialState();

    return () => {
      active = false;
    };
  }, [user?.id]);

  const completeTutorial = React.useCallback(async () => {
    if (!user?.id) {
      setShowTutorial(false);
      return;
    }

    await Promise.all([
      AsyncStorage.setItem(
        userTutorialStorageKey(APP_TUTORIAL_COMPLETED_KEY, user.id),
        "true",
      ),
      AsyncStorage.removeItem(
        userTutorialStorageKey(APP_TUTORIAL_PENDING_KEY, user.id),
      ),
    ]);
    setShowTutorial(false);
  }, [user?.id]);

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
        style={
          isAuthRoute || isPlanBuildingRoute
            ? "light"
            : isGetStartedRoute || themeType !== "dark"
              ? "dark"
              : "light"
        }
        translucent
        backgroundColor="transparent"
      />

      <ProModal
        visible={showProModal && !isProEntitled}
        onClose={() => setShowProModal(false)}
      />

      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: isAuthRoute
              ? shellBackgroundColor
              : isGetStartedRoute
              ? isPlanBuildingRoute
                ? "#101011"
                : "#FFFFFF"
              : shellBackgroundColor,
            paddingTop: isAuthRoute ? 0 : insets.top,
            paddingBottom: isAuthRoute ? 0 : insets.bottom,
            paddingLeft: insets.left,
            paddingRight: insets.right,
          },
          statusBarStyle:
            isAuthRoute || isPlanBuildingRoute
              ? "light"
              : isGetStartedRoute || themeType !== "dark"
                ? "dark"
                : "light",
          statusBarTranslucent: true,
          navigationBarColor: isAuthRoute ? "#364152" : "transparent",
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="OnBoarding" options={{ animation: "none" }} />
        <Stack.Screen name="onboarding/index" options={{ animation: "none" }} />
        <Stack.Screen
          name="onboarding/second"
          options={{ animation: "none" }}
        />
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
        <Stack.Screen name="dev/routes" />
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
        <Stack.Screen
          name="get-started/results"
          options={{ animation: "slide_from_right" }}
        />
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
      <AppTutorialOverlay
        visible={showTutorial}
        onFinish={completeTutorial}
      />
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
                        <TutorialTargetProvider>
                          <View style={{ flex: 1, backgroundColor: "#0B0D11" }}>
                            <AppContent />
                          </View>
                        </TutorialTargetProvider>
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
