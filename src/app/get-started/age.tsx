import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Circle, G, Line, Text as SvgText } from "react-native-svg";
import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";
import ChipButton from "../../components/ui/ChipButton";
import { useTheme } from "../../contexts/ThemeContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SIZE = SCREEN_WIDTH - 60;
const CENTER = SIZE / 2;
const RADIUS = SIZE / 2 - 30;
const STROKE_WIDTH = 10;
const MIN_AGE = 13;
const MAX_AGE = 80;
const ARC_START = 135; // degrees
const ARC_END = 405; // degrees (135 + 270)
const ARC_RANGE = ARC_END - ARC_START; // 270 degrees

function degToRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function polarToCartesian(angle: number) {
  const rad = degToRad(angle);
  return {
    x: CENTER + RADIUS * Math.cos(rad),
    y: CENTER + RADIUS * Math.sin(rad),
  };
}

function angleToAge(angle: number) {
  // Normalize angle to 0-360
  let norm = ((angle % 360) + 360) % 360;
  // Map from our arc range
  let arcAngle = norm - ARC_START;
  if (arcAngle < 0) arcAngle += 360;
  const clamped = Math.max(0, Math.min(ARC_RANGE, arcAngle));
  return Math.round(MIN_AGE + (clamped / ARC_RANGE) * (MAX_AGE - MIN_AGE));
}

function ageToAngle(age: number) {
  return ARC_START + ((age - MIN_AGE) / (MAX_AGE - MIN_AGE)) * ARC_RANGE;
}

export default function AgeScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);
  const [value, setValue] = useState(25);
  const prevValueRef = useRef(25);
  const containerRef = useRef<View>(null);
  const layoutRef = useRef({ x: 0, y: 0 });

  const handleContinue = async () => {
    await AsyncStorage.setItem("@hylift_age", value.toString());
    router.push("/get-started/height");
  };

  const updateFromTouch = useCallback(
    (pageX: number, pageY: number) => {
      const dx = pageX - layoutRef.current.x - CENTER;
      const dy = pageY - layoutRef.current.y - CENTER;
      let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      if (angle < 0) angle += 360;
      const age = angleToAge(angle);
      const clamped = Math.max(MIN_AGE, Math.min(MAX_AGE, age));
      if (clamped !== prevValueRef.current) {
        prevValueRef.current = clamped;
        setValue(clamped);
        Haptics.selectionAsync();
      }
    },
    [],
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        updateFromTouch(evt.nativeEvent.pageX, evt.nativeEvent.pageY);
      },
      onPanResponderMove: (evt) => {
        updateFromTouch(evt.nativeEvent.pageX, evt.nativeEvent.pageY);
      },
    }),
  ).current;

  const handleLayout = useCallback(() => {
    containerRef.current?.measureInWindow((x, y) => {
      layoutRef.current = { x, y };
    });
  }, []);

  // Arc path calculations
  const currentAngle = ageToAngle(value);
  const arcLength = 2 * Math.PI * RADIUS;
  const totalArcFraction = ARC_RANGE / 360;
  const filledFraction = ((currentAngle - ARC_START) / 360);
  const emptyFraction = totalArcFraction - filledFraction;

  // Thumb position
  const thumb = polarToCartesian(currentAngle);

  // Generate tick marks
  const tickMarks = [];
  for (let age = MIN_AGE; age <= MAX_AGE; age += 1) {
    const angle = ageToAngle(age);
    const isMajor = age % 10 === 0;
    const isMid = age % 5 === 0;
    if (isMajor || isMid) {
      const innerR = RADIUS - (isMajor ? 18 : 12);
      const outerR = RADIUS - 6;
      const rad = degToRad(angle);
      tickMarks.push({
        age,
        isMajor,
        x1: CENTER + innerR * Math.cos(rad),
        y1: CENTER + innerR * Math.sin(rad),
        x2: CENTER + outerR * Math.cos(rad),
        y2: CENTER + outerR * Math.sin(rad),
        labelX: CENTER + (RADIUS - 28) * Math.cos(rad),
        labelY: CENTER + (RADIUS - 28) * Math.sin(rad),
      });
    }
  }

  return (
    <View style={styles.container}>
      <View style={{ flex: 1 }}>
        <View style={styles.stepRow}>
          <Text style={[styles.stepText, { color: theme.primary.main }]}>
            {t("onboarding.stepOf", { current: 5, total: 13 })}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: theme.primary.main,
                  width: `${(5 / 13) * 100}%`,
                },
              ]}
            />
          </View>
        </View>

        <Text style={styles.title}>{t("onboarding.age.title")}</Text>
        <Text style={styles.subtitle}>{t("onboarding.age.subtitle")}</Text>

        <View style={styles.arcContainer}>
          <View
            ref={containerRef}
            onLayout={handleLayout}
            {...panResponder.panHandlers}
          >
            <Svg width={SIZE} height={SIZE}>
              {/* Background arc */}
              <Circle
                cx={CENTER}
                cy={CENTER}
                r={RADIUS}
                stroke={theme.background.accent}
                strokeWidth={STROKE_WIDTH}
                fill="none"
                strokeDasharray={`${totalArcFraction * arcLength} ${(1 - totalArcFraction) * arcLength}`}
                strokeDashoffset={-ARC_START / 360 * arcLength}
                strokeLinecap="round"
                rotation={0}
                origin={`${CENTER}, ${CENTER}`}
              />
              {/* Filled arc */}
              <Circle
                cx={CENTER}
                cy={CENTER}
                r={RADIUS}
                stroke={theme.primary.main}
                strokeWidth={STROKE_WIDTH}
                fill="none"
                strokeDasharray={`${filledFraction * arcLength} ${(1 - filledFraction) * arcLength}`}
                strokeDashoffset={-ARC_START / 360 * arcLength}
                strokeLinecap="round"
                rotation={0}
                origin={`${CENTER}, ${CENTER}`}
              />
              {/* Tick marks */}
              <G>
                {tickMarks.map((tick) => (
                  <React.Fragment key={tick.age}>
                    <Line
                      x1={tick.x1}
                      y1={tick.y1}
                      x2={tick.x2}
                      y2={tick.y2}
                      stroke={tick.isMajor ? theme.foreground.gray : theme.background.accent}
                      strokeWidth={tick.isMajor ? 1.5 : 1}
                    />
                    {tick.isMajor && (
                      <SvgText
                        x={tick.labelX}
                        y={tick.labelY}
                        fontSize={10}
                        fontFamily={FONTS.bold}
                        fill={theme.foreground.gray}
                        textAnchor="middle"
                        alignmentBaseline="central"
                      >
                        {tick.age}
                      </SvgText>
                    )}
                  </React.Fragment>
                ))}
              </G>
              {/* Thumb */}
              <Circle
                cx={thumb.x}
                cy={thumb.y}
                r={14}
                fill={theme.primary.main}
              />
              <Circle
                cx={thumb.x}
                cy={thumb.y}
                r={6}
                fill="#FFFFFF"
              />
            </Svg>

            {/* Center value */}
            <View style={styles.centerLabel}>
              <Text style={[styles.centerValue, { color: theme.primary.main }]}>
                {value}
              </Text>
              <Text style={styles.centerUnit}>
                {t("onboarding.age.years", "ans")}
              </Text>
            </View>
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
    arcContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    centerLabel: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: "center",
      alignItems: "center",
    },
    centerValue: {
      fontSize: 64,
      fontFamily: FONTS.extraBold,
      lineHeight: 72,
    },
    centerUnit: {
      fontSize: 18,
      fontFamily: FONTS.semiBold,
      color: theme.foreground.gray,
      marginTop: -4,
    },
  });
}
