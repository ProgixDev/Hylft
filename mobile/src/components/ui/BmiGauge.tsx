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
const GAP = (1.8 * Math.PI) / 180;

const SEGMENTS = [
  { min: 14, max: 18.5, color: "#60A5FA", key: "underweight", range: "< 18,5" },
  { min: 18.5, max: 25, color: "#34D399", key: "normal", range: "18,5 – 25" },
  { min: 25, max: 30, color: "#FBBF24", key: "overweight", range: "25 – 30" },
  { min: 30, max: 40, color: "#FB923C", key: "obese", range: "30 – 35" },
  { min: 40, max: 44, color: "#F87171", key: "severelyObese", range: "> 35" },
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
      {/* Header row: IMC | value | badge */}
      <View style={s.header}>
        <Text style={s.imcLabel}>{t("onboarding.weight.bmi.label")}</Text>
        <View style={s.headerCenter}>
          <Text style={s.bmiValue}>{bmi.toFixed(1)}</Text>
          <View style={[s.badge, { backgroundColor: cat.color + "22" }]}>
            <Text style={[s.badgeText, { color: cat.color }]}>
              {t(`onboarding.weight.bmi.${cat.key}`)}
            </Text>
          </View>
        </View>
      </View>

      {/* Arc gauge */}
      <View style={s.gaugeWrap}>
      <Svg width={W} height={H}>
        {SEGMENTS.map((seg, i) => {
          const a1 = bmiToAngle(seg.min) - (i > 0 ? GAP / 2 : 0);
          const a2 = bmiToAngle(seg.max) + (i < SEGMENTS.length - 1 ? GAP / 2 : 0);
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
        <Line
          x1={CX}
          y1={CY}
          x2={tip.x}
          y2={tip.y}
          stroke="#102b4a"
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        <Circle cx={CX} cy={CY} r={7} fill="#102b4a" />
        <Circle cx={CX} cy={CY} r={3} fill={cat.color} />
      </Svg>
      </View>

      {/* Description */}
      <Text style={s.desc}>
        {t(`onboarding.weight.bmi.${cat.key}Desc`)}
      </Text>

      {/* Legend */}
      <View style={s.legend}>
        {SEGMENTS.map((seg) => (
          <View key={seg.key} style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: seg.color }]} />
            <Text style={s.legendText}>
              {t(`onboarding.weight.bmi.${seg.key}`)}{" "}
              <Text style={s.legendRange}>{seg.range}</Text>
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    alignItems: "stretch",
    paddingHorizontal: 4,
  },
  gaugeWrap: {
    alignItems: "center",
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  imcLabel: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "#9CA3AF",
    marginRight: 10,
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  bmiValue: {
    fontSize: 28,
    fontFamily: FONTS.extraBold,
    color: "#102b4a",
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 100,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  desc: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: "#6B7280",
    lineHeight: 18,
    textAlign: "center",
    marginTop: 2,
    marginBottom: 14,
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    rowGap: 8,
    justifyContent: "center",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    width: "45%",
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  legendText: {
    fontSize: 11,
    fontFamily: FONTS.semiBold,
    color: "#374151",
  },
  legendRange: {
    fontFamily: FONTS.regular,
    color: "#9CA3AF",
  },
});
