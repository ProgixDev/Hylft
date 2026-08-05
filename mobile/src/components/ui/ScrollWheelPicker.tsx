import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, forwardRef } from "react";
import {
  Animated,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";

const ITEM_HEIGHT = 60;
const VISIBLE_ITEMS = 5;

interface ScrollWheelPickerProps {
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  onChange: (value: number) => void;
}

export interface ScrollWheelPickerRef {
  scrollToValue: (value: number) => void;
}

const ScrollWheelPicker = forwardRef<ScrollWheelPickerRef, ScrollWheelPickerProps>(({
  min,
  max,
  step,
  defaultValue,
  onChange,
}, ref) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const flatListRef = useRef<FlatList<number>>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [centerIndex, setCenterIndex] = useState(0);
  const prevCenterRef = useRef(0);

  const values = useMemo(() => {
    const result: number[] = [];
    for (let v = min; v <= max; v = Math.round((v + step) * 100) / 100) {
      result.push(v);
    }
    return result;
  }, [min, max, step]);

  const defaultIndex = useMemo(() => {
    const idx = values.findIndex((v) => v === defaultValue);
    return idx >= 0 ? idx : 0;
  }, [values, defaultValue]);

  const hasDecimal = step % 1 !== 0;

  useImperativeHandle(ref, () => ({
    scrollToValue: (val: number) => {
      const idx = values.findIndex((v) => v === val);
      if (idx >= 0) {
        flatListRef.current?.scrollToOffset({
          offset: idx * ITEM_HEIGHT,
          animated: false,
        });
        setCenterIndex(idx);
        prevCenterRef.current = idx;
        Haptics.selectionAsync();
      }
    },
  }));

  useEffect(() => {
    setCenterIndex(defaultIndex);
    prevCenterRef.current = defaultIndex;
    const timer = setTimeout(() => {
      flatListRef.current?.scrollToOffset({
        offset: defaultIndex * ITEM_HEIGHT,
        animated: false,
      });
    }, 50);
    return () => clearTimeout(timer);
  }, [defaultIndex]);

  useEffect(() => {
    const listenerId = scrollY.addListener(({ value }) => {
      const newCenter = Math.round(value / ITEM_HEIGHT);
      const clamped = Math.max(0, Math.min(newCenter, values.length - 1));
      if (clamped !== prevCenterRef.current) {
        prevCenterRef.current = clamped;
        setCenterIndex(clamped);
        Haptics.selectionAsync();
      }
    });
    return () => scrollY.removeListener(listenerId);
  }, [scrollY, values.length]);

  const handleScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      const index = Math.round(offsetY / ITEM_HEIGHT);
      const clamped = Math.max(0, Math.min(index, values.length - 1));
      setCenterIndex(clamped);
      prevCenterRef.current = clamped;
      onChange(values[clamped]);
    },
    [values, onChange],
  );

  const paddingCount = Math.floor(VISIBLE_ITEMS / 2);

  const renderItem = useCallback(
    ({ item, index }: { item: number; index: number }) => {
      const itemCenter = index * ITEM_HEIGHT;

      const scale = scrollY.interpolate({
        inputRange: [
          itemCenter - 3 * ITEM_HEIGHT,
          itemCenter - 2 * ITEM_HEIGHT,
          itemCenter - ITEM_HEIGHT,
          itemCenter,
          itemCenter + ITEM_HEIGHT,
          itemCenter + 2 * ITEM_HEIGHT,
          itemCenter + 3 * ITEM_HEIGHT,
        ],
        outputRange: [0.4, 0.46, 0.58, 1.0, 0.58, 0.46, 0.4],
        extrapolate: "clamp",
      });

      const opacity = scrollY.interpolate({
        inputRange: [
          itemCenter - 3 * ITEM_HEIGHT,
          itemCenter - 2 * ITEM_HEIGHT,
          itemCenter - ITEM_HEIGHT,
          itemCenter,
          itemCenter + ITEM_HEIGHT,
          itemCenter + 2 * ITEM_HEIGHT,
          itemCenter + 3 * ITEM_HEIGHT,
        ],
        outputRange: [0, 0.15, 0.4, 1, 0.4, 0.15, 0],
        extrapolate: "clamp",
      });

      const isCenter = index === centerIndex;
      const displayValue = hasDecimal ? item.toFixed(1) : item.toString();

      return (
        <Animated.View
          style={[styles.item, { transform: [{ scale }], opacity }]}
        >
          <Text
            style={[
              styles.itemText,
              { color: isCenter ? theme.primary.main : "#FFFFFF" },
            ]}
          >
            {displayValue}
          </Text>
        </Animated.View>
      );
    },
    [scrollY, centerIndex, theme.primary.main, hasDecimal, styles],
  );

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
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

  return (
    <View style={styles.container}>
      <Animated.FlatList
        ref={flatListRef as any}
        data={values}
        renderItem={renderItem}
        keyExtractor={(_: any, index: number) => index.toString()}
        getItemLayout={getItemLayout}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        style={styles.list}
        contentContainerStyle={{
          paddingVertical: ITEM_HEIGHT * paddingCount,
        }}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
      />
    </View>
  );
});

ScrollWheelPicker.displayName = "ScrollWheelPicker";

export default ScrollWheelPicker;

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      alignItems: "center",
      width: "100%",
    },
    list: {
      height: ITEM_HEIGHT * VISIBLE_ITEMS,
      width: "100%",
    },
    item: {
      height: ITEM_HEIGHT,
      justifyContent: "center",
      alignItems: "center",
      width: "100%",
    },
    itemText: {
      fontSize: 48,
      fontFamily: FONTS.extraBold,
      textAlign: "center",
    },
  });
}
