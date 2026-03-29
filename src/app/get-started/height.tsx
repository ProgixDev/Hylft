import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";
import ChipButton from "../../components/ui/ChipButton";
import { useTheme } from "../../contexts/ThemeContext";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const TICK_HEIGHT = 14;
const RULER_HEIGHT = SCREEN_HEIGHT * 0.45;
const MIN = 100;
const MAX = 250;

export default function HeightScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);
  const [value, setValue] = useState(175);
  const flatListRef = useRef<FlatList<number>>(null);
  const prevValueRef = useRef(175);
  const initializedRef = useRef(false);

  const ticks = useMemo(() => {
    const arr: number[] = [];
    for (let i = MAX; i >= MIN; i--) {
      arr.push(i);
    }
    return arr;
  }, []);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    const index = MAX - 175;
    setTimeout(() => {
      flatListRef.current?.scrollToOffset({
        offset: index * TICK_HEIGHT,
        animated: false,
      });
    }, 100);
  }, []);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      const index = Math.round(offsetY / TICK_HEIGHT);
      const clamped = Math.max(0, Math.min(index, ticks.length - 1));
      const newValue = ticks[clamped];
      if (newValue !== prevValueRef.current) {
        prevValueRef.current = newValue;
        setValue(newValue);
        Haptics.selectionAsync();
      }
    },
    [ticks],
  );

  const handleScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      const index = Math.round(offsetY / TICK_HEIGHT);
      const clamped = Math.max(0, Math.min(index, ticks.length - 1));
      setValue(ticks[clamped]);
      prevValueRef.current = ticks[clamped];
    },
    [ticks],
  );

  const handleContinue = async () => {
    await AsyncStorage.setItem("@hylift_height", value.toString());
    router.push("/get-started/weight");
  };

  // Fill percentage for the visual bar
  const fillPercent = ((value - MIN) / (MAX - MIN)) * 100;

  const renderTick = useCallback(
    ({ item }: { item: number }) => {
      const isFifth = item % 10 === 0;
      const isMid = item % 5 === 0 && !isFifth;

      return (
        <View style={styles.tickRow}>
          {isFifth && (
            <Text style={styles.tickLabel}>{item}</Text>
          )}
          {!isFifth && <View style={styles.tickLabelSpace} />}
          <View
            style={[
              styles.tickLine,
              isFifth
                ? styles.tickMajor
                : isMid
                  ? styles.tickMedium
                  : styles.tickMinor,
            ]}
          />
        </View>
      );
    },
    [styles],
  );

  return (
    <View style={styles.container}>
      <View style={{ flex: 1 }}>
        <View style={styles.stepRow}>
          <Text style={[styles.stepText, { color: theme.primary.main }]}>
            {t("onboarding.stepOf", { current: 6, total: 13 })}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: theme.primary.main,
                  width: `${(6 / 13) * 100}%`,
                },
              ]}
            />
          </View>
        </View>

        <Text style={styles.title}>{t("onboarding.height.title")}</Text>
        <Text style={styles.subtitle}>{t("onboarding.height.subtitle")}</Text>

        <View style={styles.mainArea}>
          {/* Left: Big number + visual bar */}
          <View style={styles.leftSection}>
            <Text style={[styles.bigValue, { color: theme.primary.main }]}>
              {value}
            </Text>
            <Text style={styles.unitLabel}>cm</Text>

            {/* Visual height bar */}
            <View style={styles.heightBarContainer}>
              <View style={styles.heightBarBg}>
                <View
                  style={[
                    styles.heightBarFill,
                    {
                      height: `${fillPercent}%`,
                      backgroundColor: theme.primary.main,
                    },
                  ]}
                />
              </View>
            </View>
          </View>

          {/* Right: Vertical ruler */}
          <View style={styles.rulerSection}>
            {/* Center indicator */}
            <View style={[styles.centerIndicator, { backgroundColor: theme.primary.main }]} />

            <FlatList
              ref={flatListRef}
              data={ticks}
              renderItem={renderTick}
              keyExtractor={(item) => item.toString()}
              showsVerticalScrollIndicator={false}
              decelerationRate="normal"
              contentContainerStyle={{
                paddingVertical: RULER_HEIGHT / 2,
              }}
              onScroll={handleScroll}
              scrollEventThrottle={32}
              onMomentumScrollEnd={handleScrollEnd}
              onScrollEndDrag={handleScrollEnd}
              getItemLayout={(_, index) => ({
                length: TICK_HEIGHT,
                offset: TICK_HEIGHT * index,
                index,
              })}
              style={{ height: RULER_HEIGHT }}
            />
          </View>
        </View>
      </View>

      <ChipButton
        title={t("common.next")}
        onPress={handleContinue}
        variant="primary"
        size="lg"
        fullWidth
      />
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background.dark,
      paddingHorizontal: 20,
      paddingBottom: 16,
    },
    stepRow: {
      marginBottom: 14,
      marginTop: 4,
    },
    stepText: {
      fontSize: 11,
      fontFamily: FONTS.bold,
      letterSpacing: 1.2,
      marginBottom: 6,
    },
    progressBar: {
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.background.accent,
    },
    progressFill: {
      height: "100%",
      borderRadius: 2,
    },
    title: {
      fontSize: 24,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
      marginBottom: 6,
    },
    subtitle: {
      fontSize: 13,
      color: theme.foreground.gray,
      marginBottom: 18,
      lineHeight: 20,
    },
    // Main layout
    mainArea: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
    },
    // Left section
    leftSection: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingRight: 10,
    },
    bigValue: {
      fontSize: 72,
      fontFamily: FONTS.extraBold,
      lineHeight: 80,
    },
    unitLabel: {
      fontSize: 20,
      fontFamily: FONTS.bold,
      color: theme.foreground.gray,
      marginBottom: 24,
    },
    // Visual bar
    heightBarContainer: {
      height: 140,
    },
    heightBarBg: {
      width: 28,
      height: "100%",
      borderRadius: 14,
      backgroundColor: theme.background.accent,
      overflow: "hidden",
      justifyContent: "flex-end",
    },
    heightBarFill: {
      width: "100%",
      borderRadius: 14,
    },
    heightBarLabels: {
      height: "100%",
      justifyContent: "space-between",
    },
    heightBarLabel: {
      fontSize: 10,
      fontFamily: FONTS.medium,
      color: theme.foreground.gray,
    },
    // Right ruler
    rulerSection: {
      width: 100,
      position: "relative",
    },
    centerIndicator: {
      position: "absolute",
      top: "50%",
      left: 0,
      right: 0,
      height: 2.5,
      borderRadius: 2,
      zIndex: 10,
      marginTop: -1,
    },
    tickRow: {
      height: TICK_HEIGHT,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
    },
    tickLabel: {
      fontSize: 11,
      fontFamily: FONTS.bold,
      color: theme.foreground.gray,
      marginRight: 8,
      width: 30,
      textAlign: "right",
    },
    tickLabelSpace: {
      width: 38,
    },
    tickLine: {
      backgroundColor: theme.foreground.gray,
    },
    tickMajor: {
      width: 30,
      height: 2,
      backgroundColor: theme.foreground.white,
    },
    tickMedium: {
      width: 18,
      height: 1.5,
    },
    tickMinor: {
      width: 10,
      height: 1,
      backgroundColor: theme.background.accent,
    },
  });
}
