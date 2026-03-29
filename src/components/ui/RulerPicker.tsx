import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { useTheme } from "../../contexts/ThemeContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const TICK_SPACING = 12;

interface RulerPickerProps {
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  unit?: string;
  onChange: (value: number) => void;
}

export default function RulerPicker({
  min,
  max,
  step,
  defaultValue,
  unit = "kg",
  onChange,
}: RulerPickerProps) {
  const { theme } = useTheme();
  const flatListRef = useRef<FlatList<number>>(null);
  const [displayValue, setDisplayValue] = useState(defaultValue);
  const prevValueRef = useRef(defaultValue);
  const initializedRef = useRef(false);

  const totalSteps = Math.round((max - min) / step);
  const halfScreen = SCREEN_WIDTH / 2;
  const hasDecimal = step % 1 !== 0;

  const ticks = useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i <= totalSteps; i++) {
      arr.push(i);
    }
    return arr;
  }, [totalSteps]);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    const initialOffset = ((defaultValue - min) / step) * TICK_SPACING;
    setTimeout(() => {
      flatListRef.current?.scrollToOffset({
        offset: initialOffset,
        animated: false,
      });
    }, 100);
  }, [defaultValue, min, step]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const rawValue = min + (offsetX / TICK_SPACING) * step;
      const snapped = Math.round(rawValue / step) * step;
      const clamped = Math.max(min, Math.min(max, snapped));
      const rounded = Math.round(clamped * 10) / 10;
      if (rounded !== prevValueRef.current) {
        prevValueRef.current = rounded;
        setDisplayValue(rounded);
        Haptics.selectionAsync();
      }
    },
    [min, max, step],
  );

  const handleScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const rawValue = min + (offsetX / TICK_SPACING) * step;
      const snapped = Math.round(rawValue / step) * step;
      const clamped = Math.max(min, Math.min(max, snapped));
      const rounded = Math.round(clamped * 10) / 10;
      setDisplayValue(rounded);
      prevValueRef.current = rounded;
      onChange(rounded);
    },
    [min, max, step, onChange],
  );

  const renderTick = useCallback(
    ({ item: i }: { item: number }) => {
      const val = min + i * step;
      const isWhole = val % 1 === 0;
      const isFifth = val % 5 === 0;

      return (
        <View style={styles.tickContainer}>
          <View
            style={[
              styles.tick,
              isFifth
                ? styles.tickMajor
                : isWhole
                  ? styles.tickMedium
                  : styles.tickMinor,
            ]}
          />
          {isFifth && (
            <Text style={[styles.tickLabel, { color: theme.foreground.gray }]}>
              {val}
            </Text>
          )}
        </View>
      );
    },
    [min, step, theme.foreground.gray],
  );

  const valueText = hasDecimal ? displayValue.toFixed(1) : displayValue.toString();

  return (
    <View style={styles.container}>
      <Text style={[styles.valueText, { color: theme.foreground.white }]}>
        {valueText}
      </Text>
      <Text style={[styles.unitText, { color: theme.primary.main }]}>{unit}</Text>

      <View style={styles.rulerWrapper}>
        <View style={[styles.centerIndicator, { backgroundColor: theme.primary.main }]} />

        <FlatList
          ref={flatListRef}
          data={ticks}
          renderItem={renderTick}
          keyExtractor={(item) => item.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="normal"
          contentContainerStyle={{
            paddingHorizontal: halfScreen,
          }}
          onScroll={handleScroll}
          scrollEventThrottle={32}
          onMomentumScrollEnd={handleScrollEnd}
          onScrollEndDrag={handleScrollEnd}
          getItemLayout={(_, index) => ({
            length: TICK_SPACING,
            offset: TICK_SPACING * index,
            index,
          })}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    width: "100%",
  },
  valueText: {
    fontSize: 56,
    fontFamily: FONTS.extraBold,
    marginBottom: 4,
  },
  unitText: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    marginBottom: 30,
  },
  rulerWrapper: {
    height: 80,
    width: "100%",
    position: "relative",
  },
  centerIndicator: {
    position: "absolute",
    top: 0,
    left: "50%",
    marginLeft: -1.5,
    width: 3,
    height: 45,
    borderRadius: 2,
    zIndex: 10,
  },
  tickContainer: {
    width: TICK_SPACING,
    alignItems: "center",
  },
  tick: {
    width: 1,
    backgroundColor: "#9CA3AF",
  },
  tickMajor: {
    height: 35,
    width: 1.5,
    backgroundColor: "#6B7280",
  },
  tickMedium: {
    height: 22,
    backgroundColor: "#9CA3AF",
  },
  tickMinor: {
    height: 14,
    backgroundColor: "#D1D5DB",
  },
  tickLabel: {
    fontSize: 11,
    fontFamily: FONTS.semiBold,
    marginTop: 4,
  },
});
