import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { Text } from "./ScaledText";
import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";
import { useTheme } from "../../contexts/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../../services/api";
import { supabase } from "../../services/supabase";
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

const NUTRI_COLORS: Record<string, string> = {
  A: "#038141",
  B: "#85BB2F",
  C: "#FECB02",
  D: "#EE8100",
  E: "#E63E11",
};

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

const QTY_MIN = 0.1;
const QTY_MAX = 9999;

interface PortionUnit {
  label: string;
  grams: number; // grams represented by one unit of quantity
}

// Format a number with a French decimal comma when needed; round to max 2 decimals
// and trim trailing zeros (e.g. "37" not "37,00", "16,3" not "16,30").
const formatNum = (n: number, isFr: boolean, decimals = 2) => {
  const rounded = Math.round(n * 10 ** decimals) / 10 ** decimals;
  let s = Number.isInteger(rounded)
    ? String(rounded)
    : rounded.toFixed(decimals).replace(/\.?0+$/, "");
  return isFr ? s.replace(".", ",") : s;
};

const round2 = (val: number | null | undefined) =>
  val != null && !isNaN(val) ? Math.round(val * 100) / 100 : undefined;

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
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [quantity, setQuantity] = useState(1);
  const [quantityInput, setQuantityInput] = useState("1");
  const [unitIndex, setUnitIndex] = useState(0);
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [detail, setDetail] = useState<FoodItem | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState(false);
  const [hiResFailed, setHiResFailed] = useState(false);

  // Editable per-100g macro & micronutrient overrides
  const [editCalories, setEditCalories] = useState<number | null>(null);
  const [editProtein, setEditProtein] = useState<number | null>(null);
  const [editCarbs, setEditCarbs] = useState<number | null>(null);
  const [editFat, setEditFat] = useState<number | null>(null);
  const [editSugars, setEditSugars] = useState<number | null>(null);
  const [editSaturatedFat, setEditSaturatedFat] = useState<number | null>(null);
  const [editFiber, setEditFiber] = useState<number | null>(null);
  const [editSalt, setEditSalt] = useState<number | null>(null);
  const [editServingSize, setEditServingSize] = useState<number | null>(null);
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState<{
    visible: boolean;
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    message: string;
  } | null>(null);

  // Lazy-fetch full nutrition when the search result has no macros yet.
  // Also check food_custom_values for user-corrected values.
  useEffect(() => {
    if (!visible || !food) return;

    let cancelled = false;

    const applyCustomValues = async (base: FoodItem): Promise<FoodItem> => {
      try {
        const custom: any = await api.getFoodCustomValues(base.id);
        if (custom && (custom.calories > 0 || custom.protein > 0 || custom.carbs > 0 || custom.fat > 0)) {
          return { ...base, calories: custom.calories, protein: custom.protein, carbs: custom.carbs, fat: custom.fat };
        }
      } catch {}
      return base;
    };

    const hasMacros =
      food.calories > 0 ||
      food.protein > 0 ||
      food.carbs > 0 ||
      food.fat > 0;

    if (hasMacros) {
      applyCustomValues(food).then((enriched) => {
        if (!cancelled) {
          setDetail(enriched);
          setLoadingDetail(false);
          setDetailError(false);
        }
      });
      return;
    }

    setDetail(null);
    setLoadingDetail(true);
    setDetailError(false);
    api
      .getFoodDetails(food.id)
      .then(async (res: FoodItem | null) => {
        if (cancelled) return;
        if (!res) {
          setDetailError(true);
        } else {
          const base = {
            ...res,
            name: res.name || food.name,
            brand: res.brand || food.brand,
            imageUrl: res.imageUrl || food.imageUrl,
          };
          const enriched = await applyCustomValues(base);
          if (!cancelled) setDetail(enriched);
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

  // Sync editable overrides when detail changes
  useEffect(() => {
    if (detail) {
      setEditCalories(detail.calories);
      setEditProtein(detail.protein);
      setEditCarbs(detail.carbs);
      setEditFat(detail.fat);
      setEditSugars(detail.sugars ?? null);
      setEditSaturatedFat(detail.saturatedFat ?? null);
      setEditFiber(detail.fiber ?? null);
      setEditSalt(detail.salt ?? null);
      setEditServingSize(detail.servingSize ?? null);
    }
  }, [detail]);

  // Reset the controls each time the sheet opens.
  useEffect(() => {
    if (visible) {
      setQuantity(1);
      setQuantityInput("1");
      setUnitIndex(0);
      setShowUnitPicker(false);
      setFavorite(false);
      setHiResFailed(false);
      setEditCalories(null);
      setEditProtein(null);
      setEditCarbs(null);
      setEditFat(null);
      setEditSugars(null);
      setEditSaturatedFat(null);
      setEditFiber(null);
      setEditSalt(null);
      setEditServingSize(null);
      setShowEditSheet(false);
      setShowDetails(false);
      setShowOptionsMenu(false);
      setFeedbackModal(null);
    }
  }, [visible]);

  // Use fetched detail when available; fall back to the search-result food.
  const display = detail ?? food;

  // Portion units offered in the "Taille de la portion" picker. A known
  // serving size leads (and is selected first); 100 g and raw grams follow.
  const units = useMemo<PortionUnit[]>(() => {
    const list: PortionUnit[] = [];
    if (display?.servingSize && display.servingSize > 0) {
      const g = formatNum(display.servingSize, isFr, 0);
      list.push({
        label: isFr ? `portion (${g} g)` : `serving (${g} g)`,
        grams: display.servingSize,
      });
    }
    list.push({ label: isFr ? "100 g" : "100 g", grams: 100 });
    list.push({ label: isFr ? "grammes" : "grams", grams: 1 });
    return list;
  }, [display?.servingSize, isFr]);

  if (!food || !display) return null;

  const unit = units[Math.min(unitIndex, units.length - 1)] ?? units[0];
  const totalGrams = quantity * unit.grams;
  const servings = totalGrams / 100; // ×100g multiplier the parent expects

  const baseCal = display.calories;
  const basePro = display.protein;
  const baseCarb = display.carbs;
  const baseFat = display.fat;

  const formCal = editCalories ?? display.calories;
  const formPro = editProtein ?? display.protein;
  const formCarb = editCarbs ?? display.carbs;
  const formFat = editFat ?? display.fat;
  const formSugars = editSugars ?? display.sugars ?? null;
  const formSaturatedFat = editSaturatedFat ?? display.saturatedFat ?? null;
  const formFiber = editFiber ?? display.fiber ?? null;
  const formSalt = editSalt ?? display.salt ?? null;
  const formServingSize = editServingSize ?? display.servingSize ?? null;

  const calories = Math.round(baseCal * servings);
  const protein = basePro * servings;
  const carbs = baseCarb * servings;
  const fat = baseFat * servings;
  const canAdd = !loadingDetail && !!detail;

  const handleQuantityChange = (text: string) => {
    const cleaned = text.replace(",", ".").replace(/[^0-9.]/g, "");
    // keep only the first decimal point
    const parts = cleaned.split(".");
    const normalized =
      parts.length > 1 ? `${parts[0]}.${parts.slice(1).join("")}` : cleaned;
    setQuantityInput(normalized);
    const n = parseFloat(normalized);
    if (!Number.isNaN(n) && n > 0) {
      setQuantity(Math.min(QTY_MAX, n));
    }
  };
  const handleQuantityBlur = () => {
    const n = parseFloat(quantityInput);
    if (Number.isNaN(n) || n < QTY_MIN) {
      setQuantity(1);
      setQuantityInput("1");
    } else {
      const clamped = Math.min(QTY_MAX, n);
      setQuantity(clamped);
      setQuantityInput(formatNum(clamped, isFr));
    }
  };

  const selectUnit = (index: number) => {
    setUnitIndex(index);
    setShowUnitPicker(false);
  };

  const avatarColor = getAvatarColor(display.name || "?");
  const addLabel = isFr ? "Ajouter" : "Add";
  const addedLabel = isFr ? "Ajouté" : "Added";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />

        {showOptionsMenu && (
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setShowOptionsMenu(false)}
          />
        )}

        <View style={styles.sheet}>
          {/* Top app bar: close · meal name · favorite + overflow */}
          <View style={styles.appBar}>
            <Pressable
              style={styles.appBarBtn}
              onPress={onClose}
              hitSlop={8}
            >
              <Ionicons name="close" size={24} color={theme.foreground.white} />
            </Pressable>

            <View style={styles.appBarTitleWrap}>
              <Text style={styles.appBarTitle} numberOfLines={1}>
                {mealLabel}
              </Text>
              <Ionicons
                name="chevron-down"
                size={16}
                color={theme.foreground.white}
              />
            </View>

            <View style={styles.appBarActions}>
              <Pressable
                style={styles.appBarBtn}
                onPress={() => setFavorite((f) => !f)}
                hitSlop={8}
              >
                <Ionicons
                  name={favorite ? "star" : "star-outline"}
                  size={22}
                  color={favorite ? theme.primary.main : theme.foreground.white}
                />
              </Pressable>
              <Pressable
                style={styles.appBarBtn}
                hitSlop={8}
                onPress={() => setShowOptionsMenu((prev) => !prev)}
              >
                <Ionicons
                  name="ellipsis-vertical"
                  size={20}
                  color={theme.foreground.white}
                />
              </Pressable>
            </View>
          </View>

          {/* Options dropdown menu (anchored under the 3-dots button) */}
          {showOptionsMenu && (
            <View style={styles.optionsDropdown}>
              <Pressable
                style={({ pressed }) => [
                  styles.optionsMenuItem,
                  pressed && { backgroundColor: theme.background.accent },
                ]}
                onPress={() => {
                  setShowOptionsMenu(false);
                  setShowEditSheet(true);
                }}
              >
                <Ionicons
                  name="create-outline"
                  size={18}
                  color={theme.foreground.white}
                />
                <Text style={styles.optionsMenuText}>
                  {isFr ? "Modifier les valeurs" : "Edit values"}
                </Text>
              </Pressable>
            </View>
          )}

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Hero — product image */}
            <View style={styles.heroWrap}>
              {display.imageUrl ? (
                <>
                  <Image
                    source={{ uri: display.imageUrl }}
                    style={StyleSheet.absoluteFill}
                    resizeMode="cover"
                    blurRadius={30}
                  />
                  <View style={styles.heroDim} pointerEvents="none" />
                  <Image
                    source={{
                      uri: hiResFailed
                        ? display.imageUrl
                        : upgradeOFFImage(display.imageUrl, 400) ||
                          display.imageUrl,
                    }}
                    style={styles.heroThumb}
                    resizeMode="contain"
                    onError={() => setHiResFailed(true)}
                  />
                </>
              ) : (
                <View
                  style={[
                    StyleSheet.absoluteFill,
                    {
                      backgroundColor: avatarColor + "22",
                      alignItems: "center",
                      justifyContent: "center",
                    },
                  ]}
                >
                  <Ionicons
                    name="restaurant-outline"
                    size={48}
                    color={theme.foreground.gray}
                  />
                </View>
              )}
            </View>

            {/* Product name & brand */}
            <View style={styles.titleSection}>
              <Text style={styles.heroName} numberOfLines={2}>
                {display.name}
              </Text>
              {!!display.brand && (
                <Text style={styles.heroBrand} numberOfLines={1}>
                  {display.brand}
                </Text>
              )}
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
                {/* Macro summary row */}
                <View style={styles.macroRow}>
                  <MacroStat
                    value={`${calories}`}
                    unit="kcal"
                    label={isFr ? "Calories" : "Calories"}
                    styles={styles}
                  />
                  <MacroStat
                    value={formatNum(carbs, isFr)}
                    unit="g"
                    label={isFr ? "Glucides" : "Carbs"}
                    styles={styles}
                  />
                  <MacroStat
                    value={formatNum(protein, isFr)}
                    unit="g"
                    label={isFr ? "Protéines" : "Protein"}
                    styles={styles}
                  />
                  <MacroStat
                    value={formatNum(fat, isFr)}
                    unit="g"
                    label={isFr ? "Lipides" : "Fat"}
                    styles={styles}
                  />
                </View>

                {/* Quantity + portion size */}
                <View style={styles.portionRow}>
                  <View style={styles.qtyBox}>
                    <TextInput
                      style={styles.qtyInput}
                      value={quantityInput}
                      onChangeText={handleQuantityChange}
                      onBlur={handleQuantityBlur}
                      keyboardType="decimal-pad"
                      maxLength={5}
                      selectTextOnFocus
                      placeholder="1"
                      placeholderTextColor={theme.foreground.gray}
                    />
                  </View>

                  <Pressable
                    style={styles.portionSelect}
                    onPress={() => setShowUnitPicker(true)}
                  >
                    <View style={styles.portionSelectTextWrap}>
                      <Text style={styles.portionSelectLabel}>
                        {isFr ? "Taille de la portion" : "Serving size"}
                      </Text>
                      <Text style={styles.portionSelectValue} numberOfLines={1}>
                        {unit.label}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-down"
                      size={20}
                      color={theme.foreground.gray}
                    />
                  </Pressable>
                </View>

                <Text style={styles.totalHint}>
                  {`${isFr ? "Total" : "Total"} : ${formatNum(totalGrams, isFr, 0)} g`}
                </Text>

                {/* Expandable detailed nutrition & quality */}
                {detail != null && (detail.sugars != null || detail.fiber != null || detail.saturatedFat != null || detail.salt != null || !!detail.nutriScore || !!detail.novaGroup) && (
                  <View style={styles.detailsCard}>
                    <Pressable
                      style={styles.detailsHeader}
                      onPress={() => setShowDetails((prev) => !prev)}
                    >
                      <View style={styles.detailsHeaderLeft}>
                        <Ionicons
                          name="analytics-outline"
                          size={18}
                          color={theme.primary.main}
                        />
                        <Text style={styles.detailsHeaderTitle}>
                          {isFr
                            ? "Détails nutritionnels & Qualité"
                            : "Detailed Nutrition & Quality"}
                        </Text>
                      </View>
                      <View style={styles.detailsHeaderRight}>
                        {detail.nutriScore && (
                          <View
                            style={[
                              styles.miniNutriBadge,
                              {
                                backgroundColor:
                                  NUTRI_COLORS[
                                    detail.nutriScore.toUpperCase()
                                  ] || theme.primary.main,
                              },
                            ]}
                          >
                            <Text style={styles.miniNutriText}>
                              {detail.nutriScore.toUpperCase()}
                            </Text>
                          </View>
                        )}
                        <Ionicons
                          name={showDetails ? "chevron-up" : "chevron-down"}
                          size={18}
                          color={theme.foreground.gray}
                        />
                      </View>
                    </Pressable>

                    {showDetails && (
                      <View style={styles.detailsContent}>
                        {/* Nutri-Score and Nova Badges */}
                        {(detail.nutriScore || detail.novaGroup) && (
                          <View style={styles.scoresRow}>
                            {detail.nutriScore && (
                              <View style={styles.scorePill}>
                                <Text style={styles.scoreLabel}>Nutri-Score</Text>
                                <View
                                  style={[
                                    styles.scoreBadge,
                                    {
                                      backgroundColor:
                                        NUTRI_COLORS[
                                          detail.nutriScore.toUpperCase()
                                        ] || theme.primary.main,
                                    },
                                  ]}
                                >
                                  <Text style={styles.scoreBadgeText}>
                                    {detail.nutriScore.toUpperCase()}
                                  </Text>
                                </View>
                              </View>
                            )}

                            {detail.novaGroup && (
                              <View style={styles.scorePill}>
                                <Text style={styles.scoreLabel}>Groupe NOVA</Text>
                                <View style={styles.novaBadge}>
                                  <Text style={styles.novaBadgeText}>
                                    {detail.novaGroup}
                                  </Text>
                                </View>
                              </View>
                            )}
                          </View>
                        )}

                        {/* Micronutrients breakdown */}
                        <View style={styles.subMacrosTable}>
                          <View style={styles.subMacroHeaderRow}>
                            <Text style={styles.subMacroColHeader}>
                              {isFr ? "Nutriment" : "Nutrient"}
                            </Text>
                            <Text style={styles.subMacroColHeaderRight}>
                              {isFr ? "Portion" : "Serving"}
                            </Text>
                            <Text style={styles.subMacroColHeaderRight}>
                              100 g
                            </Text>
                          </View>

                          {detail.sugars != null && (
                            <View style={styles.subMacroRow}>
                              <Text style={styles.subMacroName}>
                                {isFr ? "· Dont sucres" : "· Of which sugars"}
                              </Text>
                              <Text style={styles.subMacroValue}>
                                {formatNum(detail.sugars * servings, isFr)} g
                              </Text>
                              <Text style={styles.subMacroValue100}>
                                {formatNum(detail.sugars, isFr)} g
                              </Text>
                            </View>
                          )}

                          {detail.saturatedFat != null && (
                            <View style={styles.subMacroRow}>
                              <Text style={styles.subMacroName}>
                                {isFr ? "· Dont acides gras saturés" : "· Saturated fat"}
                              </Text>
                              <Text style={styles.subMacroValue}>
                                {formatNum(detail.saturatedFat * servings, isFr)} g
                              </Text>
                              <Text style={styles.subMacroValue100}>
                                {formatNum(detail.saturatedFat, isFr)} g
                              </Text>
                            </View>
                          )}

                          {detail.fiber != null && (
                            <View style={styles.subMacroRow}>
                              <Text style={styles.subMacroName}>
                                {isFr ? "Fibres alimentaires" : "Dietary fiber"}
                              </Text>
                              <Text style={styles.subMacroValue}>
                                {formatNum(detail.fiber * servings, isFr)} g
                              </Text>
                              <Text style={styles.subMacroValue100}>
                                {formatNum(detail.fiber, isFr)} g
                              </Text>
                            </View>
                          )}

                          {detail.salt != null && (
                            <View style={styles.subMacroRow}>
                              <Text style={styles.subMacroName}>
                                {isFr ? "Sel / Sodium" : "Salt / Sodium"}
                              </Text>
                              <Text style={styles.subMacroValue}>
                                {formatNum(detail.salt * servings, isFr)} g
                              </Text>
                              <Text style={styles.subMacroValue100}>
                                {formatNum(detail.salt, isFr)} g
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    )}
                  </View>
                )}
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
                onAdd(
                  { ...detail, calories: baseCal, protein: basePro, carbs: baseCarb, fat: baseFat },
                  servings,
                );
              }}
              disabled={!canAdd}
            >
              {loadingDetail ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Ionicons
                  name={isAdded ? "checkmark-circle-outline" : "add-circle-outline"}
                  size={22}
                  color="#fff"
                />
              )}
              <Text style={styles.ctaText}>
                {isAdded ? addedLabel : addLabel}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Portion-size picker */}
        <Modal
          visible={showUnitPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowUnitPicker(false)}
        >
          <Pressable
            style={styles.pickerBackdrop}
            onPress={() => setShowUnitPicker(false)}
          >
            <Pressable style={styles.pickerCard}>
              <Text style={styles.pickerTitle}>
                {isFr ? "Taille de la portion" : "Serving size"}
              </Text>
              {units.map((u, i) => {
                const active = i === unitIndex;
                return (
                  <Pressable
                    key={u.label}
                    style={({ pressed }) => [
                      styles.pickerOption,
                      active && styles.pickerOptionActive,
                      pressed && { opacity: 0.7 },
                    ]}
                    onPress={() => selectUnit(i)}
                  >
                    <Text
                      style={[
                        styles.pickerOptionText,
                        active && styles.pickerOptionTextActive,
                      ]}
                    >
                      {u.label}
                    </Text>
                    {active && (
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color={theme.primary.main}
                      />
                    )}
                  </Pressable>
                );
              })}
            </Pressable>
          </Pressable>
        </Modal>

      </KeyboardAvoidingView>

      {/* Edit nutrition modal */}
      <Modal
        visible={showEditSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditSheet(false)}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.editBackdrop}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowEditSheet(false)} />
          <View style={styles.editModal}>
            <View style={styles.editHandle} />

            <View style={styles.editHeader}>
              <Text style={styles.editTitle}>
                {isFr ? "Modifier les valeurs" : "Edit values"}
              </Text>
              <Pressable
                style={({ pressed }) => [styles.editCloseBtn, pressed && { opacity: 0.7 }]}
                onPress={() => setShowEditSheet(false)}
                hitSlop={8}
              >
                <Ionicons name="close" size={20} color={theme.foreground.white} />
              </Pressable>
            </View>

            <ScrollView
              style={{ maxHeight: SCREEN_HEIGHT * 0.58 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.editSectionTitle}>
                {isFr ? "Macronutriments (pour 100 g)" : "Macronutrients (per 100 g)"}
              </Text>
              <EditField label={isFr ? "Calories" : "Calories"} unit="kcal" value={formCal} onChange={setEditCalories} theme={theme} isFr={isFr} />
              <EditField label={isFr ? "Glucides" : "Carbs"} unit="g" value={formCarb} onChange={setEditCarbs} theme={theme} isFr={isFr} />
              <EditField label={isFr ? "Protéines" : "Protein"} unit="g" value={formPro} onChange={setEditProtein} theme={theme} isFr={isFr} />
              <EditField label={isFr ? "Lipides" : "Fat"} unit="g" value={formFat} onChange={setEditFat} theme={theme} isFr={isFr} />

              <Text style={[styles.editSectionTitle, { marginTop: 14 }]}>
                {isFr ? "Détails & Micronutriments (pour 100 g)" : "Details & Micronutrients (per 100 g)"}
              </Text>
              <EditField label={isFr ? "· Dont sucres" : "· Of which sugars"} unit="g" value={formSugars} onChange={setEditSugars} theme={theme} isFr={isFr} />
              <EditField label={isFr ? "· Dont acides gras saturés" : "· Saturated fat"} unit="g" value={formSaturatedFat} onChange={setEditSaturatedFat} theme={theme} isFr={isFr} />
              <EditField label={isFr ? "Fibres alimentaires" : "Dietary fiber"} unit="g" value={formFiber} onChange={setEditFiber} theme={theme} isFr={isFr} />
              <EditField label={isFr ? "Sel / Sodium" : "Salt / Sodium"} unit="g" value={formSalt} onChange={setEditSalt} theme={theme} isFr={isFr} />

              <Text style={[styles.editSectionTitle, { marginTop: 14 }]}>
                {isFr ? "Portion" : "Serving"}
              </Text>
              <EditField label={isFr ? "Taille de la portion" : "Serving size"} unit="g" value={formServingSize} onChange={setEditServingSize} theme={theme} isFr={isFr} last />
            </ScrollView>

            <View style={styles.editButtons}>
              <Pressable
                style={({ pressed }) => [styles.editCancelBtn, pressed && { opacity: 0.7 }]}
                onPress={() => setShowEditSheet(false)}
              >
                <Text style={styles.editCancelText}>{isFr ? "Annuler" : "Cancel"}</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.editSaveBtn, pressed && { opacity: 0.85 }]}
                onPress={async () => {
                  if (display) {
                    // 1. Submit through backend API
                    api.submitFoodCorrection({
                      food_id: display.id,
                      food_name: display.name,
                      brand: display.brand,
                      image_url: display.imageUrl,
                      original_calories: round2(food?.calories) ?? 0,
                      original_protein: round2(food?.protein) ?? 0,
                      original_carbs: round2(food?.carbs) ?? 0,
                      original_fat: round2(food?.fat) ?? 0,
                      original_sugars: round2(food?.sugars),
                      original_saturated_fat: round2(food?.saturatedFat),
                      original_fiber: round2(food?.fiber),
                      original_salt: round2(food?.salt),
                      original_serving_size: round2(food?.servingSize),
                      calories: round2(formCal) ?? 0,
                      protein: round2(formPro) ?? 0,
                      carbs: round2(formCarb) ?? 0,
                      fat: round2(formFat) ?? 0,
                      sugars: round2(formSugars),
                      saturated_fat: round2(formSaturatedFat),
                      fiber: round2(formFiber),
                      salt: round2(formSalt),
                      serving_size: round2(formServingSize),
                    }).catch(() => {});

                    // 2. Also insert directly to Supabase with current user auth for real-time guarantee
                    try {
                      const { data: sessionData } = await supabase.auth.getSession();
                      if (sessionData?.session?.user) {
                        await supabase.from("food_corrections").insert({
                          user_id: sessionData.session.user.id,
                          food_id: display.id,
                          food_name: display.name,
                          brand: display.brand ?? null,
                          image_url: display.imageUrl ?? null,
                          original_calories: round2(food?.calories) ?? 0,
                          original_protein: round2(food?.protein) ?? 0,
                          original_carbs: round2(food?.carbs) ?? 0,
                          original_fat: round2(food?.fat) ?? 0,
                          original_sugars: round2(food?.sugars) ?? null,
                          original_saturated_fat: round2(food?.saturatedFat) ?? null,
                          original_fiber: round2(food?.fiber) ?? null,
                          original_salt: round2(food?.salt) ?? null,
                          original_serving_size: round2(food?.servingSize) ?? null,
                          calories: round2(formCal) ?? 0,
                          protein: round2(formPro) ?? 0,
                          carbs: round2(formCarb) ?? 0,
                          fat: round2(formFat) ?? 0,
                          sugars: round2(formSugars) ?? null,
                          saturated_fat: round2(formSaturatedFat) ?? null,
                          fiber: round2(formFiber) ?? null,
                          salt: round2(formSalt) ?? null,
                          serving_size: round2(formServingSize) ?? null,
                          status: "pending",
                        });
                      }
                    } catch {}
                  }
                  setShowEditSheet(false);
                  setFeedbackModal({
                    visible: true,
                    icon: "checkmark-circle",
                    title: isFr ? "Proposition envoyée !" : "Proposal submitted!",
                    message: isFr
                      ? "Votre proposition de modification a été transmise aux administrateurs. Elle sera visible sur l'application dès sa validation."
                      : "Your modification proposal has been submitted to administrators. It will be visible once approved.",
                  });
                }}
              >
                <Text style={styles.editSaveText}>{isFr ? "Envoyer pour validation" : "Submit for review"}</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Custom Branded Feedback Dialog */}
      {feedbackModal?.visible && (
        <Modal
          visible={feedbackModal.visible}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => setFeedbackModal(null)}
        >
          <View style={styles.dialogBackdrop}>
            <View style={styles.dialogCard}>
              <View style={styles.dialogIconWrap}>
                <Ionicons
                  name={feedbackModal.icon}
                  size={36}
                  color={theme.primary.main}
                />
              </View>
              <Text style={styles.dialogTitle}>{feedbackModal.title}</Text>
              <Text style={styles.dialogMessage}>{feedbackModal.message}</Text>
              <Pressable
                style={({ pressed }) => [
                  styles.dialogBtn,
                  pressed && { opacity: 0.85 },
                ]}
                onPress={() => setFeedbackModal(null)}
              >
                <Text style={styles.dialogBtnText}>
                  {isFr ? "Compris" : "OK"}
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}
    </Modal>
  );
};

interface MacroStatProps {
  value: string;
  unit: string;
  label: string;
  styles: ReturnType<typeof createStyles>;
}

const MacroStat: React.FC<MacroStatProps> = ({ value, unit, label, styles }) => (
  <View style={styles.macroStat}>
    <Text style={styles.macroStatValue} numberOfLines={1}>
      {value}
      <Text style={styles.macroStatUnit}> {unit}</Text>
    </Text>
    <Text style={styles.macroStatLabel} numberOfLines={1}>
      {label}
    </Text>
  </View>
);

interface EditFieldProps {
  label: string;
  unit: string;
  value?: number | null;
  onChange: (v: number | null) => void;
  theme: Theme;
  isFr: boolean;
  last?: boolean;
}

const EditField: React.FC<EditFieldProps> = ({ label, unit, value, onChange, theme, isFr, last }) => {
  const [text, setText] = useState(value != null ? formatNum(value, isFr) : "");

  useEffect(() => {
    setText(value != null ? formatNum(value, isFr) : "");
  }, [value, isFr]);

  return (
    <View style={{ marginBottom: last ? 0 : 10 }}>
      <Text style={{
        fontFamily: FONTS.semiBold,
        fontSize: 13,
        color: theme.foreground.gray,
        marginBottom: 5,
      }}>
        {label}
      </Text>
      <View style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: theme.background.accent,
        borderRadius: 12,
        paddingRight: 14,
      }}>
        <TextInput
          style={{
            flex: 1,
            borderRadius: 12,
            color: theme.foreground.white,
            fontFamily: FONTS.bold,
            fontSize: 18,
            padding: 11,
          }}
          value={text}
          onChangeText={(t) => {
            const cleaned = t.replace(",", ".").replace(/[^0-9.]/g, "");
            setText(cleaned);
            if (cleaned === "") {
              onChange(null);
            } else {
              const n = parseFloat(cleaned);
              if (!Number.isNaN(n) && n >= 0) onChange(n);
            }
          }}
          onBlur={() => {
            if (text === "") {
              onChange(null);
            } else {
              const n = parseFloat(text);
              if (Number.isNaN(n) || n < 0) {
                setText(value != null ? formatNum(value, isFr) : "");
              }
            }
          }}
          keyboardType="decimal-pad"
          selectTextOnFocus
          placeholder="0"
          placeholderTextColor={theme.foreground.gray}
          maxLength={7}
        />
        <Text style={{
          fontFamily: FONTS.semiBold,
          fontSize: 15,
          color: theme.foreground.gray,
        }}>
          {unit}
        </Text>
      </View>
    </View>
  );
};

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      ...StyleSheet.absoluteFill,
      justifyContent: "flex-end",
    },
    backdrop: {
      ...StyleSheet.absoluteFill,
      backgroundColor: "rgba(0,0,0,0.6)",
    },
    sheet: {
      maxHeight: SCREEN_HEIGHT * 0.94,
      backgroundColor: theme.background.dark,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      overflow: "hidden",
    },
    appBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 8,
      paddingVertical: 14,
      backgroundColor: theme.background.dark,
      zIndex: 2,
    },
    appBarBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    appBarTitleWrap: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
    },
    appBarTitle: {
      fontFamily: FONTS.bold,
      fontSize: 18,
      color: theme.foreground.white,
      fontWeight: "700",
    },
    appBarActions: {
      flexDirection: "row",
      alignItems: "center",
    },
    scrollContent: {
      paddingBottom: 16,
    },
    heroWrap: {
      width: "100%",
      height: 180,
      backgroundColor: theme.background.darker,
      position: "relative",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    heroThumb: {
      width: "80%",
      height: "80%",
    },
    heroDim: {
      ...StyleSheet.absoluteFill,
      backgroundColor: "rgba(0,0,0,0.06)",
    },
    titleSection: {
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 2,
    },
    heroName: {
      fontFamily: FONTS.bold,
      fontSize: 22,
      color: theme.foreground.white,
      fontWeight: "800",
      textAlign: "center",
      lineHeight: 28,
    },
    heroBrand: {
      fontFamily: FONTS.medium,
      fontSize: 14,
      color: theme.foreground.gray,
      textAlign: "center",
      marginTop: 4,
    },
    macroRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 22,
    },
    macroStat: {
      flex: 1,
      alignItems: "center",
      gap: 4,
    },
    macroStatValue: {
      fontFamily: FONTS.bold,
      fontSize: 18,
      color: theme.foreground.white,
      fontWeight: "800",
    },
    macroStatUnit: {
      fontFamily: FONTS.semiBold,
      fontSize: 13,
      color: theme.foreground.white,
      fontWeight: "600",
    },
    macroStatLabel: {
      fontFamily: FONTS.regular,
      fontSize: 12,
      color: theme.foreground.gray,
    },
    editBackdrop: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(0,0,0,0.55)",
    },
    editModal: {
      width: "100%",
      backgroundColor: theme.background.darker,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 22,
      paddingBottom: 34,
      paddingTop: 8,
    },
    editHandle: {
      alignSelf: "center",
      width: 42,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.foreground.gray,
      opacity: 0.4,
      marginBottom: 16,
    },
    editHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 4,
    },
    editCloseBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: theme.background.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    editTitle: {
      fontFamily: FONTS.bold,
      fontSize: 20,
      color: theme.foreground.white,
    },
    editSectionTitle: {
      fontFamily: FONTS.bold,
      fontSize: 12,
      color: theme.primary.main,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 10,
      marginTop: 8,
    },
    editHintText: {
      fontFamily: FONTS.regular,
      fontSize: 13,
      color: theme.foreground.gray,
      marginTop: 2,
      marginBottom: 16,
    },
    editButtons: {
      flexDirection: "row",
      gap: 12,
      marginTop: 18,
    },
    editCancelBtn: {
      flex: 1,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: "center",
      backgroundColor: theme.background.accent,
    },
    editCancelText: {
      fontFamily: FONTS.semiBold,
      fontSize: 16,
      color: theme.foreground.white,
    },
    editSaveBtn: {
      flex: 1,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: "center",
      backgroundColor: theme.primary.main,
    },
    editSaveText: {
      fontFamily: FONTS.bold,
      fontSize: 16,
      color: "#fff",
    },
    portionRow: {
      flexDirection: "row",
      alignItems: "stretch",
      gap: 12,
      paddingHorizontal: 16,
      paddingTop: 4,
    },
    qtyBox: {
      width: 76,
      borderWidth: 2,
      borderColor: theme.primary.main,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 10,
    },
    qtyInput: {
      fontFamily: FONTS.bold,
      fontSize: 22,
      color: theme.foreground.white,
      textAlign: "center",
      padding: 0,
      minWidth: 40,
    },
    portionSelect: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderWidth: 1,
      borderColor: theme.background.accent,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    portionSelectTextWrap: {
      flex: 1,
      marginRight: 8,
    },
    portionSelectLabel: {
      fontFamily: FONTS.regular,
      fontSize: 11,
      color: theme.foreground.gray,
      marginBottom: 2,
    },
    portionSelectValue: {
      fontFamily: FONTS.semiBold,
      fontSize: 18,
      color: theme.foreground.white,
    },
    totalHint: {
      fontFamily: FONTS.regular,
      fontSize: 12,
      color: theme.foreground.gray,
      textAlign: "center",
      paddingTop: 14,
    },
    detailsCard: {
      marginHorizontal: 16,
      marginTop: 14,
      borderRadius: 16,
      backgroundColor: theme.background.darker,
      borderWidth: 1,
      borderColor: theme.background.accent,
      overflow: "hidden",
    },
    detailsHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    detailsHeaderLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    detailsHeaderTitle: {
      fontFamily: FONTS.semiBold,
      fontSize: 14,
      color: theme.foreground.white,
    },
    detailsHeaderRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    miniNutriBadge: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 6,
    },
    miniNutriText: {
      fontFamily: FONTS.bold,
      fontSize: 11,
      color: "#fff",
    },
    detailsContent: {
      paddingHorizontal: 14,
      paddingBottom: 14,
      paddingTop: 4,
      borderTopWidth: 1,
      borderTopColor: theme.background.accent,
    },
    scoresRow: {
      flexDirection: "row",
      gap: 12,
      paddingVertical: 10,
    },
    scorePill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: theme.background.accent,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 10,
    },
    scoreLabel: {
      fontFamily: FONTS.medium,
      fontSize: 12,
      color: theme.foreground.gray,
    },
    scoreBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
    },
    scoreBadgeText: {
      fontFamily: FONTS.bold,
      fontSize: 12,
      color: "#fff",
    },
    novaBadge: {
      backgroundColor: "#45B7D1",
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
    },
    novaBadgeText: {
      fontFamily: FONTS.bold,
      fontSize: 12,
      color: "#fff",
    },
    subMacrosTable: {
      marginTop: 6,
      gap: 8,
    },
    subMacroHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingBottom: 4,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.background.accent,
    },
    subMacroColHeader: {
      flex: 1,
      fontFamily: FONTS.medium,
      fontSize: 11,
      color: theme.foreground.gray,
      textTransform: "uppercase",
    },
    subMacroColHeaderRight: {
      width: 70,
      fontFamily: FONTS.medium,
      fontSize: 11,
      color: theme.foreground.gray,
      textAlign: "right",
      textTransform: "uppercase",
    },
    subMacroRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 2,
    },
    subMacroName: {
      flex: 1,
      fontFamily: FONTS.regular,
      fontSize: 13,
      color: theme.foreground.white,
    },
    subMacroValue: {
      width: 70,
      fontFamily: FONTS.semiBold,
      fontSize: 13,
      color: theme.foreground.white,
      textAlign: "right",
    },
    subMacroValue100: {
      width: 70,
      fontFamily: FONTS.regular,
      fontSize: 12,
      color: theme.foreground.gray,
      textAlign: "right",
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
      paddingVertical: 16,
      borderRadius: 999,
    },
    ctaDone: {
      backgroundColor: "#34C759",
    },
    ctaDisabled: {
      opacity: 0.5,
    },
    ctaText: {
      fontFamily: FONTS.bold,
      fontSize: 16,
      color: "#fff",
      fontWeight: "700",
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
    pickerBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 32,
    },
    pickerCard: {
      width: "100%",
      backgroundColor: theme.background.darker,
      borderRadius: 18,
      paddingVertical: 8,
      paddingHorizontal: 8,
    },
    pickerTitle: {
      fontFamily: FONTS.semiBold,
      fontSize: 13,
      color: theme.foreground.gray,
      textTransform: "uppercase",
      letterSpacing: 0.6,
      paddingHorizontal: 12,
      paddingTop: 10,
      paddingBottom: 6,
    },
    pickerOption: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 14,
      paddingHorizontal: 12,
      borderRadius: 12,
    },
    pickerOptionActive: {
      backgroundColor: theme.background.accent,
    },
    pickerOptionText: {
      fontFamily: FONTS.semiBold,
      fontSize: 16,
      color: theme.foreground.white,
    },
    optionsDropdown: {
      position: "absolute",
      top: 50,
      right: 8,
      backgroundColor: theme.background.darker,
      borderRadius: 14,
      paddingVertical: 4,
      minWidth: 190,
      borderWidth: 1,
      borderColor: theme.background.accent,
      zIndex: 100,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 10,
    },
    optionsMenuItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 10,
      marginHorizontal: 4,
    },
    optionsMenuText: {
      fontFamily: FONTS.semiBold,
      fontSize: 14,
      color: theme.foreground.white,
    },
    dialogBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.55)",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 28,
      zIndex: 999,
    },
    dialogCard: {
      width: "100%",
      maxWidth: 360,
      backgroundColor: theme.background.dark,
      borderRadius: 24,
      padding: 26,
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.background.accent,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 16,
    },
    dialogIconWrap: {
      width: 68,
      height: 68,
      borderRadius: 20,
      backgroundColor: theme.background.accent,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    dialogTitle: {
      fontSize: 20,
      fontFamily: FONTS.extraBold,
      color: theme.foreground.white,
      textAlign: "center",
      marginBottom: 8,
    },
    dialogMessage: {
      fontSize: 14,
      fontFamily: FONTS.medium,
      color: theme.foreground.gray,
      textAlign: "center",
      lineHeight: 21,
      marginBottom: 22,
      paddingHorizontal: 4,
    },
    dialogBtn: {
      width: "100%",
      backgroundColor: theme.primary.main,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    dialogBtnText: {
      fontSize: 15,
      fontFamily: FONTS.bold,
      color: "#FFFFFF",
    },
  });
}

export default FoodDetailSheet;
