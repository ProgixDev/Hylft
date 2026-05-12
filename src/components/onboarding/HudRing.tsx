import React from "react";
import { View, type ViewStyle } from "react-native";
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  Text as SvgText,
  Filter,
  FeGaussianBlur,
} from "react-native-svg";
import { colors } from "../../theme/colors";
import { fontFamilies } from "../../theme/typography";

type Props = {
  size?: number;
  topLabel: string;
  value: string;
  goal: string;
  style?: ViewStyle;
};

const MID_R = 80;
const MID_C = 2 * Math.PI * MID_R; // ~502.65
const INNER_R = 56;
const INNER_C = 2 * Math.PI * INNER_R; // ~351.86

const MID_PROGRESS = 422 / 503;
const INNER_PROGRESS = 218 / 352;

export default function HudRing({
  size = 230,
  topLabel,
  value,
  goal,
  style,
}: Props) {
  const midDash = MID_C * MID_PROGRESS;
  const innerDash = INNER_C * INNER_PROGRESS;

  return (
    <View style={style}>
      <Svg viewBox="0 0 240 240" width={size} height={size}>
        <Defs>
          <Filter
            id="hudGlow"
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <FeGaussianBlur stdDeviation="3" />
          </Filter>
        </Defs>

        <Circle
          cx={120}
          cy={120}
          r={100}
          fill="none"
          stroke={colors.hudStroke}
          strokeWidth={1}
          strokeDasharray="2 6"
        />

        <Circle
          cx={120}
          cy={120}
          r={MID_R}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={8}
        />
        <Circle
          cx={120}
          cy={120}
          r={MID_R}
          fill="none"
          stroke={colors.blue}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={`${midDash} ${MID_C}`}
          transform="rotate(-90 120 120)"
          filter="url(#hudGlow)"
          opacity={0.7}
        />
        <Circle
          cx={120}
          cy={120}
          r={MID_R}
          fill="none"
          stroke={colors.blue}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={`${midDash} ${MID_C}`}
          transform="rotate(-90 120 120)"
        />

        <Circle
          cx={120}
          cy={120}
          r={INNER_R}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={4}
        />
        <Circle
          cx={120}
          cy={120}
          r={INNER_R}
          fill="none"
          stroke={colors.blueLight}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={`${innerDash} ${INNER_C}`}
          transform="rotate(-90 120 120)"
        />

        <G stroke="rgba(139,179,255,0.4)" strokeWidth={1}>
          <Line x1={120} y1={14} x2={120} y2={22} />
          <Line x1={120} y1={218} x2={120} y2={226} />
          <Line x1={14} y1={120} x2={22} y2={120} />
          <Line x1={218} y1={120} x2={226} y2={120} />
        </G>

        <SvgText
          x={120}
          y={115}
          textAnchor="middle"
          fontFamily={fontFamilies.mono700}
          fontSize={9}
          fill={colors.blueLight}
          letterSpacing={2}
        >
          {topLabel}
        </SvgText>
        <SvgText
          x={120}
          y={142}
          textAnchor="middle"
          fontFamily={fontFamilies.inter800}
          fontSize={28}
          fontWeight="800"
          fill={colors.white}
        >
          {value}
        </SvgText>
        <SvgText
          x={120}
          y={158}
          textAnchor="middle"
          fontFamily={fontFamilies.mono700}
          fontSize={8}
          fill="rgba(199,211,230,0.7)"
        >
          {goal}
        </SvgText>
      </Svg>
    </View>
  );
}
