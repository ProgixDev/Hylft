import React from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "./ScaledText";
import Svg, { Circle, Line, Path } from "react-native-svg";
import { useTranslation } from "react-i18next";
import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";

/* ── BMI scale ── */
const BMI_MIN = 14;
const BMI_MAX = 44;
const BMI_RANGE = BMI_MAX - BMI_MIN;

/* ── SVG layout ── */
const W = 260;
const H = 148;
const CX = W / 2;
const CY = H - 8;
const R = 108;
const ARC_W = 14;
const GAP = (1.8 * Math.PI) / 180; // 1.8° between segments

const SEGMENTS = [
  { min: 14, max: 18.5, color: "#60A5FA", key: "underweight" },
  { min: 18.5, max: 25, color: "#34D399", key: "normal" },
  { min: 25, max: 30, color: "#FBBF24", key: "overweight" },
  { min: 30, max: 40, color: "#FB923C", key: "obese" },
  { min: 40, max: 44, color: "#F87171", key: "severelyObese" },
] as const;

type Segment = (typeof SEGMENTS)[number];

function bmiToAngle(bmi: number): number {
  const c = Math.max(BMI_MIN, Math.min(BMI_MAX, bmi));
  return Math.PI * (1 - (c - BMI_MIN) / BMI_RANGE);
}

function pt(angle: number, r: number) {
  return { x: CX + r * Math.cos(angle), y: CY - r * Math.sin(angle) };
}

function getCategory(bmi: number): Segment {
  if (bmi < 18.5) return SEGMENTS[0];
  if (bmi < 25) return SEGMENTS[1];
  if (bmi < 30) return SEGMENTS[2];
  if (bmi < 40) return SEGMENTS[3];
  return SEGMENTS[4];
}

interface Props {
  bmi: number;
  theme: Theme;
}

export default function BmiGauge({ bmi, theme }: Props) {
  const { t } = useTranslation();
  const cat = getCategory(bmi);
  const needleAngle = bmiToAngle(bmi);
  const tip = pt(needleAngle, R - ARC_W / 2 - 4);

  return (
    <View style={s.wrap}>
      <Svg width={W} height={H}>
        {/* Colored arc segments */}
        {SEGMENTS.map((seg, i) => {
          const a1 = bmiToAngle(seg.min) - (i > 0 ? GAP / 2 : 0);
          const a2 =
            bmiToAngle(seg.max) +
            (i < SEGMENTS.length - 1 ? GAP / 2 : 0);
          const p1 = pt(a1, R);
          const p2 = pt(a2, R);
          return (
            <Path
              key={seg.key}
              d={`M${p1.x} ${p1.y} A${R} ${R} 0 0 1 ${p2.x} ${p2.y}`}
              stroke={seg.color}
              strokeWidth={ARC_W}
              strokeLinecap="butt"
              fill="none"
            />
          );
        })}

        {/* Needle line */}
        <Line
          x1={CX}
          y1={CY}
          x2={tip.x}
          y2={tip.y}
          stroke={theme.foreground.white}
          strokeWidth={2.5}
          strokeLinecap="round"
        />

        {/* Center dot ring */}
        <Circle cx={CX} cy={CY} r={7} fill={theme.foreground.white} />
        <Circle cx={CX} cy={CY} r={3} fill={cat.color} />
      </Svg>

      {/* Labels */}
      <Text style={[s.imcLabel, { color: theme.foreground.gray }]}>
        {t("onboarding.weight.bmi.label")}
      </Text>
      <Text style={[s.bmiValue, { color: theme.foreground.white }]}>
        {bmi.toFixed(1)}
      </Text>
      <View style={[s.badge, { backgroundColor: cat.color + "1A" }]}>
        <Text style={[s.badgeText, { color: cat.color }]}>
          {t(`onboarding.weight.bmi.${cat.key}`)}
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    alignItems: "center",
    marginTop: 16,
  },
  imcLabel: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginTop: 2,
  },
  bmiValue: {
    fontSize: 22,
    fontFamily: FONTS.extraBold,
    marginTop: -1,
  },
  badge: {
    marginTop: 6,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 100,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
});
