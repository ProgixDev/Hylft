import React from "react";
import {
  Text as RNText,
  type TextProps,
  StyleSheet,
} from "react-native";
import { useFontSize } from "../../contexts/FontSizeContext";

/**
 * Drop-in replacement for React Native's Text that applies
 * the user's font-size preference from FontSizeContext.
 *
 * Import as `Text` so existing JSX stays unchanged:
 *   import { Text } from "../../components/ui/ScaledText";
 */
export function Text(props: TextProps) {
  const { fontScale } = useFontSize();

  if (fontScale === 1) {
    return <RNText {...props} />;
  }

  const flat = props.style
    ? (StyleSheet.flatten(props.style) as Record<string, any>)
    : null;

  if (flat && typeof flat.fontSize === "number") {
    return (
      <RNText
        {...props}
        style={[
          props.style,
          { fontSize: Math.round(flat.fontSize * fontScale) },
        ]}
      />
    );
  }

  return <RNText {...props} />;
}

export default Text;
