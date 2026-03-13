import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Theme } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";

import { FONTS } from "../../constants/fonts";

export default function Ready() {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = createStyles(theme);

  useEffect(() => {
    const timer = setTimeout(() => {
      router.navigate("/(tabs)/schedule");
    }, 1500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name="check-circle"
            size={120}
            color={theme.primary.main}
          />
        </View>

        <Text style={styles.title}>You&apos;re Ready!</Text>
        <Text style={styles.subtitle}>
          Let&apos;s start your fitness journey together
        </Text>
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background.dark,
      paddingHorizontal: 32,
      paddingBottom: 20,
      justifyContent: "center",
      alignItems: "center",
    },
    content: {
      alignItems: "center",
    },
    iconContainer: {
      marginBottom: 40,
    },
    title: {
      fontSize: 40,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
      textAlign: "center",
      marginBottom: 16,
    },
    subtitle: {
      fontSize: 18,
      color: theme.foreground.gray,
      textAlign: "center",
      lineHeight: 28,
    },
  });
