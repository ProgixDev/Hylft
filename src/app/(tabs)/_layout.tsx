import BottomSheet from "@gorhom/bottom-sheet";
import { Tabs } from "expo-router";
import React, { useRef } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { CustomTabBar } from "../../components/layout/CustomTabBar";
import ActiveWorkoutSheet from "../../components/ui/ActiveWorkoutSheet";
import { MiniWorkoutPlayer } from "../../components/ui/MiniWorkoutPlayer";
import { useActiveWorkout } from "../../contexts/ActiveWorkoutContext";

function TabsLayoutContent() {
  const { t } = useTranslation();
  const { activeWorkout, setIsExpanded, isExpanded } = useActiveWorkout();
  const activeWorkoutSheetRef = useRef<BottomSheet>(null);

  const handleExpandWorkout = () => {
    setIsExpanded(true);
  };

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        tabBar={(props) => (
          <View>
            {activeWorkout && !isExpanded && (
              <MiniWorkoutPlayer onExpand={handleExpandWorkout} />
            )}
            <CustomTabBar {...props} />
          </View>
        )}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: t("tabs.home"),
          }}
        />
        <Tabs.Screen
          name="workout"
          options={{
            title: t("tabs.workout"),
          }}
        />
        <Tabs.Screen
          name="alimentation"
          options={{
            title: t("tabs.alimentation"),
          }}
        />
        <Tabs.Screen
          name="feed"
          options={{
            title: t("tabs.feed"),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t("tabs.profile"),
          }}
        />
      </Tabs>

      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 999,
          pointerEvents: "box-none",
        }}
      >
        <ActiveWorkoutSheet
          ref={activeWorkoutSheetRef}
          isExpanded={activeWorkout ? isExpanded : false}
        />
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return <TabsLayoutContent />;
}
