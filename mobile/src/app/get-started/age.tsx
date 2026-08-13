import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  View,
} from "react-native";
import { Text } from "../../components/ui/ScaledText";
import ChipButton from "../../components/ui/ChipButton";
import SignupProgress from "../../components/ui/SignupProgress";
import { FONTS } from "../../constants/fonts";

const ITEM_HEIGHT = 56;
const VISIBLE_ITEMS = 5;
const CURRENT_YEAR = new Date().getFullYear();
// Years from newest (youngest) to oldest — user scrolls down for older years
const YEARS = Array.from(
  { length: CURRENT_YEAR - 13 - (CURRENT_YEAR - 80) + 1 },
  (_, i) => CURRENT_YEAR - 13 - i,
); // e.g. 2013, 2012, ..., 1946

const DEFAULT_BIRTH_YEAR = CURRENT_YEAR - 30;

export default function AgeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ flow?: string }>();
  const { t } = useTranslation();
  const isSignupFlow = params.flow === "signup";

  const flatListRef = useRef<FlatList<number>>(null);
  const prevIndexRef = useRef(0);
  const scrollY = useRef(new Animated.Value(0)).current;

  const defaultIndex = useMemo(
    () => Math.max(0, YEARS.indexOf(DEFAULT_BIRTH_YEAR)),
    [],
  );

  const [centerIndex, setCenterIndex] = useState(defaultIndex);
  const birthYear = YEARS[centerIndex] ?? DEFAULT_BIRTH_YEAR;
  const age = CURRENT_YEAR - birthYear;

  useEffect(() => {
    prevIndexRef.current = defaultIndex;
    const timer = setTimeout(() => {
      flatListRef.current?.scrollToOffset({
        offset: defaultIndex * ITEM_HEIGHT,
        animated: false,
      });
    }, 50);
    return () => clearTimeout(timer);
  }, [defaultIndex]);

  const handleScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      const index = Math.round(offsetY / ITEM_HEIGHT);
      const clamped = Math.max(0, Math.min(index, YEARS.length - 1));
      if (clamped !== prevIndexRef.current) {
        prevIndexRef.current = clamped;
        Haptics.selectionAsync();
      }
      setCenterIndex(clamped);
    },
    [],
  );

  const onScroll = useMemo(
    () =>
      Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: true },
      ),
    [scrollY],
  );

  useEffect(() => {
    const id = scrollY.addListener(({ value }) => {
      const newCenter = Math.round(value / ITEM_HEIGHT);
      const clamped = Math.max(0, Math.min(newCenter, YEARS.length - 1));
      if (clamped !== prevIndexRef.current) {
        prevIndexRef.current = clamped;
        setCenterIndex(clamped);
        Haptics.selectionAsync();
      }
    });
    return () => scrollY.removeListener(id);
  }, [scrollY]);

  const renderItem = useCallback(
    ({ item, index }: { item: number; index: number }) => {
      const itemCenter = index * ITEM_HEIGHT;

      const opacity = scrollY.interpolate({
        inputRange: [
          itemCenter - 2 * ITEM_HEIGHT,
          itemCenter - ITEM_HEIGHT,
          itemCenter,
          itemCenter + ITEM_HEIGHT,
          itemCenter + 2 * ITEM_HEIGHT,
        ],
        outputRange: [0.2, 0.45, 1, 0.45, 0.2],
        extrapolate: "clamp",
      });

      const scale = scrollY.interpolate({
        inputRange: [
          itemCenter - ITEM_HEIGHT,
          itemCenter,
          itemCenter + ITEM_HEIGHT,
        ],
        outputRange: [0.85, 1, 0.85],
        extrapolate: "clamp",
      });

      const isCenter = index === centerIndex;

      return (
        <Animated.View
          style={[
            s.yearItem,
            isCenter && s.yearItemSelected,
            { opacity, transform: [{ scale }] },
          ]}
        >
          <Text style={[s.yearText, isCenter && s.yearTextSelected]}>
            {item}
          </Text>
        </Animated.View>
      );
    },
    [scrollY, centerIndex],
  );

  const handleContinue = async () => {
    await AsyncStorage.setItem("@hylift_age", age.toString());
    if (isSignupFlow) {
      router.push("/get-started/height?flow=signup");
    } else {
      router.push("/get-started/height");
    }
  };

  return (
    <View style={s.container}>
      <View style={{ flex: 1 }}>
        <SignupProgress current={isSignupFlow ? 7 : 5} total={13} />

        <Text style={s.title}>{t("onboarding.age.title")}</Text>

        <View style={s.card}>
          {/* Large age display */}
          <View style={s.ageDisplay}>
            <Text style={s.ageNumber}>{age}</Text>
            <Text style={s.ageUnit}>{t("onboarding.age.years", "ans")}</Text>
          </View>

          {/* Year scroll wheel */}
          <View style={s.pickerWrap}>
            {/* Center highlight */}
            <View pointerEvents="none" style={s.centerHighlight} />

            <Animated.FlatList
              ref={flatListRef as any}
              data={YEARS}
              renderItem={renderItem}
              keyExtractor={(item: number) => item.toString()}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              showsVerticalScrollIndicator={false}
              style={{ height: ITEM_HEIGHT * VISIBLE_ITEMS }}
              contentContainerStyle={{
                paddingVertical: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2),
              }}
              onScroll={onScroll}
              scrollEventThrottle={16}
              onMomentumScrollEnd={handleScrollEnd}
              onScrollEndDrag={handleScrollEnd}
              getItemLayout={(_: any, index: number) => ({
                length: ITEM_HEIGHT,
                offset: ITEM_HEIGHT * index,
                index,
              })}
            />
          </View>
        </View>
      </View>

      <ChipButton
        threeD
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
    backgroundColor: "#F8F9FC",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 26,
    fontFamily: FONTS.extraBold,
    color: "#102b4a",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingTop: 24,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  ageDisplay: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    marginBottom: 8,
  },
  ageNumber: {
    fontSize: 64,
    fontFamily: FONTS.extraBold,
    color: "#102b4a",
    lineHeight: 72,
  },
  ageUnit: {
    fontSize: 20,
    fontFamily: FONTS.semiBold,
    color: "#6B7280",
    marginLeft: 8,
    marginBottom: 10,
  },
  pickerWrap: {
    position: "relative",
  },
  centerHighlight: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    marginTop: -ITEM_HEIGHT / 2,
    backgroundColor: "#F3F4F8",
    borderRadius: 12,
    zIndex: 0,
  },
  yearItem: {
    height: ITEM_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  yearItemSelected: {},
  yearText: {
    fontSize: 20,
    fontFamily: FONTS.semiBold,
    color: "#9CA3AF",
  },
  yearTextSelected: {
    fontSize: 24,
    fontFamily: FONTS.extraBold,
    color: "#102b4a",
  },
});
