import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";
import { api } from "../../services/api";
import { upgradeOFFImage } from "../../services/openFoodFactsApi";
import type { FoodItem } from "../../services/nutritionApi";

const SCREEN_HEIGHT = Dimensions.get("window").height;

const AVATAR_COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#F7DC6F",
  "#DDA0DD",
  "#FFB347",
  "#87CEEB",
];
const getAvatarColor = (name: string) =>
  AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];

interface FoodDetailSheetProps {
  visible: boolean;
  food: FoodItem | null;
  mealLabel: string;
  isFr: boolean;
  isAdded?: boolean;
  onClose: () => void;
  // Receives the food enriched with the macros that were fetched lazily,
  // so the parent can save the right values when the user adds.
  onAdd: (food: FoodItem, servings: number) => void;
}

const SERVING_MIN = 0.5;
const SERVING_MAX = 10;
const SERVING_STEP = 0.5;

const FoodDetailSheet: React.FC<FoodDetailSheetProps> = ({
  visible,
  food,
  mealLabel,
  isFr,
  isAdded,
  onClose,
  onAdd,
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [servings, setServings] = useState(1);
  const [gramsInput, setGramsInput] = useState("100");
  const [detail, setDetail] = useState<FoodItem | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState(false);
  const [hiResFailed, setHiResFailed] = useState(false);

  // Lazy-fetch full nutrition when the search result has no macros yet.
  useEffect(() => {
    if (!visible || !food) return;

    const hasMacros =
      food.calories > 0 ||
      food.protein > 0 ||
      food.carbs > 0 ||
      food.fat > 0;

    if (hasMacros) {
      setDetail(food);
      setLoadingDetail(false);
      setDetailError(false);
      return;
    }

    let cancelled = false;
    setDetail(null);
    setLoadingDetail(true);
    setDetailError(false);
    api
      .getFoodDetails(food.id)
      .then((res: FoodItem | null) => {
        if (cancelled) return;
        if (!res) {
          setDetailError(true);
        } else {
          // Fall back to the search result's name/image if the detail call
          // returns blanks (e.g. some products lack a title).
          setDetail({
            ...res,
            name: res.name || food.name,
            imageUrl: res.imageUrl || display.imageUrl,
          });
        }
      })
      .catch(() => {
        if (!cancelled) setDetailError(true);
      })
      .finally(() => {
        if (!cancelled) setLoadingDetail(false);
      });

    return () => {
      cancelled = true;
    };
  }, [visible, food]);

  // Reset the servings stepper and hi-res state each time the sheet opens.
  useEffect(() => {
    if (visible) {
      setServings(1);
      setGramsInput("100");
      setHiResFailed(false);
    }
  }, [visible]);

  if (!food) return null;

  // Use fetched detail when available; fall back to the search-result food.
  const display = detail ?? food;
  const calories = Math.round(display.calories * servings);
  const protein = display.protein * servings;
  const carbs = display.carbs * servings;
  const fat = display.fat * servings;
  const canAdd = !loadingDetail && !!detail;

  // Macro proportions for the bar widths (by gram weight, not calories).
  const macroTotal = Math.max(protein + carbs + fat, 0.0001);
  const pPct = (protein / macroTotal) * 100;
  const cPct = (carbs / macroTotal) * 100;
  const fPct = (fat / macroTotal) * 100;

  const updateServings = (next: number) => {
    const clamped = Math.max(SERVING_MIN, Math.min(SERVING_MAX, +next.toFixed(2)));
    setServings(clamped);
    setGramsInput(String(Math.round(clamped * 100)));
  };
  const handleDecrement = () => updateServings(servings - SERVING_STEP);
  const handleIncrement = () => updateServings(servings + SERVING_STEP);

  const handleGramsChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, "").slice(0, 5);
    setGramsInput(cleaned);
    const grams = parseInt(cleaned, 10);
    if (!Number.isNaN(grams) && grams > 0) {
      const next = Math.max(
        SERVING_MIN,
        Math.min(SERVING_MAX, +(grams / 100).toFixed(2))
      );
      setServings(next);
    }
  };
  const handleGramsBlur = () => {
    setGramsInput(String(Math.round(servings * 100)));
  };

  const avatarColor = getAvatarColor(display.name || "?");
  const addLabel = isFr ? `Ajouter à ${mealLabel}` : `Add to ${mealLabel}`;
  const addedLabel = isFr ? "Ajouté" : "Added";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={StyleSheet.absoluteFill}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.sheet}>
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Hero image — small thumbnail loads first, hi-res 400px
                  layered on top once it arrives. Falls back to small if
                  the upgraded URL 404s (e.g. non-OFF source). */}
              <View style={styles.heroWrap}>
                {display.imageUrl ? (
                  <>
                    {/* Blurred zoomed-in version as a background "frame"
                        so the hero never looks empty when the real image
                        is letterboxed. */}
                    <Image
                      source={{ uri: display.imageUrl }}
                      style={[styles.hero, StyleSheet.absoluteFillObject]}
                      resizeMode="cover"
                      blurRadius={18}
                    />
                    <View style={styles.heroDim} pointerEvents="none" />
                    <Image
                      source={{
                        uri: hiResFailed
                          ? display.imageUrl
                          : upgradeOFFImage(display.imageUrl, 400) ||
                            display.imageUrl,
                      }}
                      style={styles.hero}
                      resizeMode="contain"
                      onError={() => setHiResFailed(true)}
                    />
                  </>
                ) : (
                  <View
                    style={[
                      styles.hero,
                      { backgroundColor: avatarColor + "33" },
                    ]}
                  >
                    <Text
                      style={[styles.heroFallbackLetter, { color: avatarColor }]}
                    >
                      {(display.name || "?").charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <LinearGradient
                  colors={["transparent", "rgba(0,0,0,0.75)"]}
                  style={styles.heroOverlay}
                  pointerEvents="none"
                />
                <Pressable
                  style={styles.heroClose}
                  onPress={onClose}
                  hitSlop={8}
                >
                  <Ionicons name="close" size={20} color="#fff" />
                </Pressable>
                <View style={styles.heroTextWrap} pointerEvents="none">
                  <Text style={styles.heroName} numberOfLines={2}>
                    {display.name}
                  </Text>
                  <Text style={styles.heroSub}>
                    {isFr ? "pour 100g" : "per 100g"}
                  </Text>
                </View>
              </View>

              {loadingDetail && (
                <View style={styles.loadingBlock}>
                  <ActivityIndicator color={theme.primary.main} />
                  <Text style={styles.loadingText}>
                    {isFr
                      ? "Chargement des informations nutritionnelles..."
                      : "Loading nutrition info..."}
                  </Text>
                </View>
              )}

              {detailError && !loadingDetail && (
                <View style={styles.loadingBlock}>
                  <Ionicons
                    name="alert-circle"
                    size={32}
                    color={theme.foreground.gray}
                  />
                  <Text style={styles.loadingText}>
                    {isFr
                      ? "Impossible de charger les détails nutritionnels."
                      : "Couldn't load nutrition details."}
                  </Text>
                </View>
              )}

              {!loadingDetail && !detailError && (
                <>
              {/* Calories */}
              <View style={styles.calorieBlock}>
                <Text style={styles.calorieValue}>{calories}</Text>
                <Text style={styles.calorieUnit}>kcal</Text>
              </View>

              {/* Macros */}
              <View style={styles.macroSection}>
                <MacroBar
                  label={isFr ? "Protéines" : "Protein"}
                  value={protein}
                  pct={pPct}
                  color={theme.primary.main}
                  styles={styles}
                />
                <MacroBar
                  label={isFr ? "Glucides" : "Carbs"}
                  value={carbs}
                  pct={cPct}
                  color={theme.primary.main}
                  styles={styles}
                />
                <MacroBar
                  label={isFr ? "Lipides" : "Fat"}
                  value={fat}
                  pct={fPct}
                  color={theme.primary.main}
                  styles={styles}
                />
              </View>

              {/* Servings stepper */}
              <View style={styles.stepperSection}>
                <Text style={styles.stepperLabel}>
                  {isFr ? "Portions" : "Servings"}
                </Text>
                <View style={styles.stepper}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.stepBtn,
                      servings <= SERVING_MIN && styles.stepBtnDisabled,
                      pressed && { opacity: 0.7 },
                    ]}
                    onPress={handleDecrement}
                    disabled={servings <= SERVING_MIN}
                    hitSlop={8}
                  >
                    <Ionicons
                      name="remove"
                      size={20}
                      color={theme.foreground.white}
                    />
                  </Pressable>
                  <Text style={styles.stepValue}>{servings.toFixed(1)}</Text>
                  <Pressable
                    style={({ pressed }) => [
                      styles.stepBtn,
                      servings >= SERVING_MAX && styles.stepBtnDisabled,
                      pressed && { opacity: 0.7 },
                    ]}
                    onPress={handleIncrement}
                    disabled={servings >= SERVING_MAX}
                    hitSlop={8}
                  >
                    <Ionicons
                      name="add"
                      size={20}
                      color={theme.foreground.white}
                    />
                  </Pressable>
                </View>
                <Text style={styles.stepperHint}>
                  {`× 100g = ${Math.round(servings * 100)}g`}
                </Text>
              </View>

              {/* Grams (poids) input */}
              <View style={styles.gramsSection}>
                <Text style={styles.stepperLabel}>
                  {isFr ? "Poids" : "Weight"}
                </Text>
                <View style={styles.gramsInputWrap}>
                  <TextInput
                    style={styles.gramsInput}
                    value={gramsInput}
                    onChangeText={handleGramsChange}
                    onBlur={handleGramsBlur}
                    keyboardType="number-pad"
                    maxLength={5}
                    selectTextOnFocus
                    placeholder="100"
                    placeholderTextColor={theme.foreground.gray}
                  />
                  <Text style={styles.gramsUnit}>g</Text>
                </View>
              </View>
                </>
              )}
            </ScrollView>

            {/* Sticky CTA */}
            <View style={styles.ctaWrap}>
              <Pressable
                style={({ pressed }) => [
                  styles.cta,
                  isAdded && styles.ctaDone,
                  !canAdd && styles.ctaDisabled,
                  pressed && canAdd && { opacity: 0.85 },
                ]}
                onPress={() => {
                  if (!canAdd || !detail) return;
                  onAdd(detail, servings);
                }}
                disabled={!canAdd}
              >
                {loadingDetail ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Ionicons
                    name={isAdded ? "checkmark" : "add"}
                    size={20}
                    color="#fff"
                  />
                )}
                <Text style={styles.ctaText}>
                  {isAdded ? addedLabel : addLabel}
                </Text>
              </Pressable>
            </View>
        </View>
      </View>
    </Modal>
  );
};

interface MacroBarProps {
  label: string;
  value: number;
  pct: number;
  color: string;
  styles: ReturnType<typeof createStyles>;
}

const MacroBar: React.FC<MacroBarProps> = ({
  label,
  value,
  pct,
  color,
  styles,
}) => (
  <View style={styles.macroRow}>
    <View style={styles.macroHeader}>
      <View style={styles.macroLabelWrap}>
        <View style={[styles.macroDot, { backgroundColor: color }]} />
        <Text style={styles.macroLabel}>{label}</Text>
      </View>
      <Text style={styles.macroValue}>{value.toFixed(1)} g</Text>
    </View>
    <View style={styles.macroTrack}>
      <View
        style={[
          styles.macroFill,
          { width: `${Math.max(2, Math.min(100, pct))}%`, backgroundColor: color },
        ]}
      />
    </View>
  </View>
);

function createStyles(theme: Theme) {
  return StyleSheet.create({
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.6)",
    },
    sheet: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      maxHeight: SCREEN_HEIGHT * 0.92,
      backgroundColor: theme.background.dark,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      overflow: "hidden",
    },
    handleWrap: {
      alignItems: "center",
      paddingTop: 8,
      paddingBottom: 4,
      backgroundColor: theme.background.dark,
      zIndex: 2,
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.foreground.gray + "55",
    },
    scrollContent: {
      paddingBottom: 24,
    },
    heroWrap: {
      width: "100%",
      height: 220,
      backgroundColor: theme.background.darker,
      position: "relative",
    },
    hero: {
      width: "100%",
      height: "100%",
      alignItems: "center",
      justifyContent: "center",
    },
    heroFallbackLetter: {
      fontFamily: FONTS.bold,
      fontSize: 96,
      fontWeight: "700",
    },
    heroDim: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.35)",
    },
    heroOverlay: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: 120,
    },
    heroClose: {
      position: "absolute",
      top: 12,
      right: 12,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: "rgba(0,0,0,0.45)",
      alignItems: "center",
      justifyContent: "center",
    },
    heroTextWrap: {
      position: "absolute",
      left: 16,
      right: 16,
      bottom: 12,
    },
    heroName: {
      fontFamily: FONTS.bold,
      fontSize: 22,
      color: "#fff",
      fontWeight: "700",
      lineHeight: 26,
    },
    heroSub: {
      fontFamily: FONTS.regular,
      fontSize: 12,
      color: "rgba(255,255,255,0.85)",
      marginTop: 2,
    },
    calorieBlock: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "center",
      gap: 6,
      paddingTop: 18,
      paddingBottom: 6,
    },
    calorieValue: {
      fontFamily: FONTS.bold,
      fontSize: 40,
      color: theme.primary.main,
      fontWeight: "800",
    },
    calorieUnit: {
      fontFamily: FONTS.semiBold,
      fontSize: 14,
      color: theme.primary.main,
    },
    macroSection: {
      paddingHorizontal: 20,
      paddingTop: 14,
      gap: 14,
    },
    macroRow: {
      gap: 6,
    },
    macroHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    macroLabelWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    macroDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    macroLabel: {
      fontFamily: FONTS.semiBold,
      fontSize: 13,
      color: theme.foreground.white,
    },
    macroValue: {
      fontFamily: FONTS.bold,
      fontSize: 13,
      color: theme.foreground.white,
    },
    macroTrack: {
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.background.accent,
      overflow: "hidden",
    },
    macroFill: {
      height: "100%",
      borderRadius: 3,
    },
    stepperSection: {
      paddingHorizontal: 20,
      paddingTop: 22,
      alignItems: "center",
      gap: 10,
    },
    stepperLabel: {
      fontFamily: FONTS.regular,
      fontSize: 12,
      color: theme.foreground.gray,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    stepper: {
      flexDirection: "row",
      alignItems: "center",
      gap: 18,
      backgroundColor: theme.background.darker,
      borderWidth: 1,
      borderColor: theme.background.accent,
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 6,
    },
    stepBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.background.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    stepBtnDisabled: {
      opacity: 0.4,
    },
    stepValue: {
      fontFamily: FONTS.bold,
      fontSize: 20,
      color: theme.foreground.white,
      minWidth: 48,
      textAlign: "center",
    },
    stepperHint: {
      fontFamily: FONTS.regular,
      fontSize: 11,
      color: theme.foreground.gray,
    },
    gramsSection: {
      paddingHorizontal: 20,
      paddingTop: 18,
      alignItems: "center",
      gap: 10,
    },
    gramsInputWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: theme.background.darker,
      borderWidth: 1,
      borderColor: theme.background.accent,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 8,
      minWidth: 140,
      justifyContent: "center",
    },
    gramsInput: {
      fontFamily: FONTS.bold,
      fontSize: 20,
      color: theme.foreground.white,
      minWidth: 60,
      textAlign: "center",
      padding: 0,
    },
    gramsUnit: {
      fontFamily: FONTS.semiBold,
      fontSize: 14,
      color: theme.foreground.gray,
    },
    ctaWrap: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 24,
      borderTopWidth: 1,
      borderTopColor: theme.background.accent,
      backgroundColor: theme.background.dark,
    },
    cta: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: theme.primary.main,
      paddingVertical: 14,
      borderRadius: 14,
    },
    ctaDone: {
      backgroundColor: "#34C759",
    },
    ctaDisabled: {
      opacity: 0.5,
    },
    loadingBlock: {
      paddingVertical: 36,
      paddingHorizontal: 24,
      alignItems: "center",
      gap: 12,
    },
    loadingText: {
      fontFamily: FONTS.regular,
      fontSize: 13,
      color: theme.foreground.gray,
      textAlign: "center",
    },
    ctaText: {
      fontFamily: FONTS.bold,
      fontSize: 15,
      color: "#fff",
      fontWeight: "700",
    },
  });
}

export default FoodDetailSheet;
