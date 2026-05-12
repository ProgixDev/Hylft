import React from "react";
import Svg, {
  Circle,
  Defs,
  FeGaussianBlur,
  Filter,
  G,
  Line,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import { colors } from "../../theme/colors";
import { fontFamilies } from "../../theme/typography";

type Props = {
  badgeLabel: string;
  peakLabel: string;
  width?: number;
  height?: number;
};

const LINE_PATH = "M 30 175 L 65 162 L 100 148 L 135 125 L 170 100 L 215 70";
const AREA_PATH =
  "M 30 175 L 65 162 L 100 148 L 135 125 L 170 100 L 215 70 L 215 200 L 30 200 Z";

export default function TrajectoryChart({
  badgeLabel,
  peakLabel,
  width = 240,
  height = 220,
}: Props) {
  return (
    <Svg
      viewBox="0 0 240 220"
      width={width}
      height={height}
      preserveAspectRatio="xMidYMid meet"
    >
      <Defs>
        <LinearGradient id="trajFill" x1="0" x2="0" y1="0" y2="1">
          <Stop offset="0%" stopColor={colors.blue} stopOpacity="0.55" />
          <Stop offset="100%" stopColor={colors.blue} stopOpacity="0" />
        </LinearGradient>
        <Filter
          id="trajGlow"
          x="-30%"
          y="-30%"
          width="160%"
          height="160%"
        >
          <FeGaussianBlur stdDeviation="4" />
        </Filter>
      </Defs>

      <G transform="translate(45 16)">
        <Rect
          width={150}
          height={30}
          rx={6}
          fill="rgba(45,127,249,0.12)"
          stroke="rgba(139,179,255,0.35)"
        />
        <Circle cx={16} cy={15} r={7} fill="rgba(45,127,249,0.25)" />
        <Path
          d="M11 15 L14 18 L20 11"
          stroke={colors.blueLight}
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <SvgText
          x={32}
          y={20}
          fontFamily={fontFamilies.inter700}
          fontSize={11}
          fontWeight="700"
          fill={colors.white}
          letterSpacing={0.6}
        >
          {badgeLabel}
        </SvgText>
      </G>

      <G stroke="rgba(139,179,255,0.08)" strokeWidth={1}>
        <Line x1={20} y1={180} x2={220} y2={180} />
        <Line x1={20} y1={140} x2={220} y2={140} />
        <Line x1={20} y1={100} x2={220} y2={100} />
        <Line
          x1={20}
          y1={60}
          x2={220}
          y2={60}
          strokeDasharray="2 4"
        />
      </G>

      <Line
        x1={170}
        y1={55}
        x2={170}
        y2={200}
        stroke="rgba(139,179,255,0.25)"
        strokeDasharray="2 3"
      />

      <Path d={AREA_PATH} fill="url(#trajFill)" />

      <Path
        d={LINE_PATH}
        stroke={colors.blue}
        strokeWidth={8}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.55}
        filter="url(#trajGlow)"
      />
      <Path
        d={LINE_PATH}
        stroke={colors.blueLight}
        strokeWidth={2.5}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <G>
        <Circle cx={65} cy={162} r={3} fill={colors.white} />
        <Circle cx={100} cy={148} r={3} fill={colors.white} />
        <Circle cx={135} cy={125} r={3} fill={colors.white} />
        <Circle cx={170} cy={100} r={4} fill={colors.white} />
        <Circle
          cx={170}
          cy={100}
          r={8}
          fill="none"
          stroke={colors.white}
          strokeOpacity={0.4}
        />
        <Circle cx={215} cy={70} r={6} fill={colors.blue} filter="url(#trajGlow)" />
        <Circle cx={215} cy={70} r={4} fill={colors.white} />
      </G>

      <G transform="translate(176 80)">
        <Rect width={38} height={16} rx={3} fill={colors.blue} />
        <SvgText
          x={19}
          y={11}
          textAnchor="middle"
          fontFamily={fontFamilies.mono700}
          fontSize={8}
          fontWeight="700"
          fill={colors.white}
        >
          {peakLabel}
        </SvgText>
      </G>
    </Svg>
  );
}
