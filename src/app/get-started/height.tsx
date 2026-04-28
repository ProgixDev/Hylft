import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import ChipButton from "../../components/ui/ChipButton";
import SignupProgress from "../../components/ui/SignupProgress";
import { FONTS } from "../../constants/fonts";
import { useTheme } from "../../contexts/ThemeContext";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const TICK_HEIGHT = 14;
const RULER_HEIGHT = SCREEN_HEIGHT * 0.7;
const MIN = 100;
const MAX = 250;
const DEFAULT_HEIGHT_CM = 175;

export default function HeightScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ flow?: string }>();
  const isSignupFlow = params.flow === "signup";
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [value, setValue] = useState(DEFAULT_HEIGHT_CM);
  const flatListRef = useRef<FlatList<number>>(null);
  const prevValueRef = useRef(DEFAULT_HEIGHT_CM);
  const initializedRef = useRef(false);

  const ticks = useMemo(() => {
    const arr: number[] = [];
    for (let i = MAX; i >= MIN; i--) {
      arr.push(i);
    }
    return arr;
  }, []);
  const defaultIndex = MAX - DEFAULT_HEIGHT_CM;

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    setTimeout(() => {
      flatListRef.current?.scrollToOffset({
        offset: defaultIndex * TICK_HEIGHT,
        animated: false,
      });
    }, 100);
  }, [defaultIndex]);

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
    if (isSignupFlow) {
      router.push("/get-started/weight?flow=signup");
    } else {
      router.push("/get-started/weight");
    }
  };

  const fillPercent = ((value - MIN) / (MAX - MIN)) * 100;

  const renderTick = useCallback(({ item }: { item: number }) => {
    const isFifth = item % 10 === 0;
    const isMid = item % 5 === 0 && !isFifth;
    return (
      <View style={s.tickRow}>
        {isFifth ? (
          <Text style={s.tickLabel}>{item}</Text>
        ) : (
          <View style={s.tickLabelSpace} />
        )}
        <View
          style={[
            s.tickLine,
            isFifth ? s.tickMajor : isMid ? s.tickMedium : s.tickMinor,
          ]}
        />
      </View>
    );
  }, []);

  return (
    <View style={s.container}>
      <View style={{ flex: 1 }}>
        <SignupProgress current={isSignupFlow ? 8 : 6} total={13} />

        <Text style={s.title}>{t("onboarding.height.title")}</Text>
        <Text style={s.subtitle}>{t("onboarding.height.subtitle")}</Text>

        <View style={s.mainArea}>
          <View style={s.leftSection}>
            <Text style={[s.bigValue, { color: theme.primary.main }]}>
              {value}
            </Text>
            <Text style={s.unitLabel}>cm</Text>

            <View style={s.heightBarContainer}>
              <View style={s.heightBarBg}>
                <View
                  style={[
                    s.heightBarFill,
                    {
                      height: `${fillPercent}%`,
                      backgroundColor: theme.primary.main,
                    },
                  ]}
                />
              </View>
            </View>
          </View>

          <View style={s.rulerSection}>
            <View
              style={[
                s.centerIndicator,
                { backgroundColor: theme.primary.main },
              ]}
            />
            <FlatList
              ref={flatListRef}
              data={ticks}
              renderItem={renderTick}
              keyExtractor={(item) => item.toString()}
              initialScrollIndex={defaultIndex}
              showsVerticalScrollIndicator={false}
              decelerationRate="normal"
              contentContainerStyle={{
                paddingVertical: RULER_HEIGHT / 2 - TICK_HEIGHT / 2,
              }}
              snapToInterval={TICK_HEIGHT}
              snapToAlignment="start"
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

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 26,
    fontFamily: FONTS.extraBold,
    color: "#111827",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 18,
    lineHeight: 20,
  },
  mainArea: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
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
    color: "#64748B",
    marginBottom: 24,
  },
  heightBarContainer: {
    height: 140,
  },
  heightBarBg: {
    width: 28,
    height: "100%",
    borderRadius: 14,
    backgroundColor: "#DDE3EA",
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  heightBarFill: {
    width: "100%",
    borderRadius: 14,
  },
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
    color: "#64748B",
    marginRight: 8,
    width: 30,
    textAlign: "right",
  },
  tickLabelSpace: {
    width: 38,
  },
  tickLine: {
    backgroundColor: "#64748B",
  },
  tickMajor: {
    width: 30,
    height: 2,
    backgroundColor: "#111827",
  },
  tickMedium: {
    width: 18,
    height: 1.5,
  },
  tickMinor: {
    width: 10,
    height: 1,
    backgroundColor: "#DDE3EA",
  },
});
