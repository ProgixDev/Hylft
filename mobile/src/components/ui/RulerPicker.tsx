import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  LayoutChangeEvent,
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
const EPSILON = 0.0001;

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
  const [rulerWidth, setRulerWidth] = useState(SCREEN_WIDTH);
  const [displayValue, setDisplayValue] = useState(defaultValue);
  const prevValueRef = useRef(defaultValue);
  const initializedRef = useRef(false);

  const totalSteps = Math.round((max - min) / step);
  const halfRuler = rulerWidth / 2;
  const sidePadding = Math.max(0, halfRuler - TICK_SPACING / 2);
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

  const handleRulerLayout = useCallback((event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;
    if (nextWidth > 0 && Math.abs(nextWidth - rulerWidth) > 0.5) {
      setRulerWidth(nextWidth);
    }
  }, [rulerWidth]);

  const renderTick = useCallback(
    ({ item: i }: { item: number }) => {
      const val = min + i * step;
      const isMultipleOf = (target: number) =>
        Math.abs(val / target - Math.round(val / target)) < EPSILON;

      // For integer pickers like age, emphasize decades (10, 20, 30...).
      const isMajor = step >= 1 ? isMultipleOf(10) : isMultipleOf(5);
      const isMedium = step >= 1 ? isMultipleOf(5) : isMultipleOf(1);

      return (
        <View style={styles.tickContainer}>
          <View
            style={[
              styles.tick,
              isMajor
                ? styles.tickMajor
                : isMedium
                  ? styles.tickMedium
                  : styles.tickMinor,
            ]}
          />
          {isMajor && (
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
        <View style={styles.rulerLayout} onLayout={handleRulerLayout} />
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
            paddingHorizontal: sidePadding,
          }}
          snapToInterval={TICK_SPACING}
          snapToAlignment="start"
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
  rulerLayout: {
    ...StyleSheet.absoluteFillObject,
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
    position: "absolute",
    top: 38,
    width: 30,
    left: -9,
    textAlign: "center",
  },
});
