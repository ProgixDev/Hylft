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

const QTY_MIN = 0.1;
const QTY_MAX = 9999;

interface PortionUnit {
  label: string;
  grams: number; // grams represented by one unit of quantity
}

// Format a number with a French decimal comma when needed; trim a trailing
// ".0" so whole numbers read cleanly (e.g. "37" not "37,0").
const formatNum = (n: number, isFr: boolean, decimals = 1) => {
  const rounded = Math.round(n * 10 ** decimals) / 10 ** decimals;
  let s = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(decimals);
  return isFr ? s.replace(".", ",") : s;
};

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

  const [quantity, setQuantity] = useState(1);
  const [quantityInput, setQuantityInput] = useState("1");
  const [unitIndex, setUnitIndex] = useState(0);
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [detail, setDetail] = useState<FoodItem | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState(false);
  const [hiResFailed, setHiResFailed] = useState(false);

  // Editable per-100g macro overrides
  const [editCalories, setEditCalories] = useState<number | null>(null);
  const [editProtein, setEditProtein] = useState<number | null>(null);
  const [editCarbs, setEditCarbs] = useState<number | null>(null);
  const [editFat, setEditFat] = useState<number | null>(null);
  const [showEditSheet, setShowEditSheet] = useState(false);

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
      setShowEditSheet(false);
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

  const baseCal = editCalories ?? display.calories;
  const basePro = editProtein ?? display.protein;
  const baseCarb = editCarbs ?? display.carbs;
  const baseFat = editFat ?? display.fat;

  const calories = Math.round(baseCal * servings);
  const protein = basePro * servings;
  const carbs = baseCarb * servings;
  const fat = baseFat * servings;
  const canAdd = !loadingDetail && !!detail;

  const hasEdits = detail != null && (
    baseCal !== detail.calories ||
    basePro !== detail.protein ||
    baseCarb !== detail.carbs ||
    baseFat !== detail.fat
  );

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
              <Pressable style={styles.appBarBtn} hitSlop={8}>
                <Ionicons
                  name="ellipsis-vertical"
                  size={20}
                  color={theme.foreground.white}
                />
              </Pressable>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Hero — product name + brand centered over a soft image/gradient */}
            <View style={styles.heroWrap}>
              {display.imageUrl ? (
                <>
                  <Image
                    source={{ uri: display.imageUrl }}
                    style={StyleSheet.absoluteFillObject}
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
                    StyleSheet.absoluteFillObject,
                    { backgroundColor: avatarColor + "22" },
                  ]}
                />
              )}
              <LinearGradient
                colors={["rgba(0,0,0,0.15)", "rgba(0,0,0,0.55)"]}
                style={StyleSheet.absoluteFillObject}
                pointerEvents="none"
              />
              <View style={styles.heroTextWrap} pointerEvents="none">
                <Text style={styles.heroName} numberOfLines={2}>
                  {display.name}
                </Text>
                {!!display.brand && (
                  <Text style={styles.heroBrand} numberOfLines={1}>
                    {display.brand}
                  </Text>
                )}
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
                <Pressable style={styles.editLink} onPress={() => setShowEditSheet(true)}>
                  <Ionicons name="create-outline" size={16} color={theme.primary.main} />
                  <Text style={styles.editLinkText}>
                    {hasEdits
                      ? (isFr ? "Valeurs modifiées · Modifier" : "Values edited · Edit")
                      : (isFr ? "Modifier les valeurs" : "Edit values")}
                  </Text>
                </Pressable>

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
        <Pressable style={styles.editBackdrop} onPress={() => setShowEditSheet(false)}>
          <Pressable style={styles.editModal} onPress={() => {}}>
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

            <Text style={styles.editHintText}>
              {isFr ? "Valeurs pour 100 g" : "Values per 100 g"}
            </Text>

            <EditField label={isFr ? "Calories" : "Calories"} unit="kcal" value={baseCal} onChange={setEditCalories} theme={theme} isFr={isFr} />
            <EditField label={isFr ? "Glucides" : "Carbs"} unit="g" value={baseCarb} onChange={setEditCarbs} theme={theme} isFr={isFr} />
            <EditField label={isFr ? "Protéines" : "Protein"} unit="g" value={basePro} onChange={setEditProtein} theme={theme} isFr={isFr} />
            <EditField label={isFr ? "Lipides" : "Fat"} unit="g" value={baseFat} onChange={setEditFat} theme={theme} isFr={isFr} last />

            <View style={styles.editButtons}>
              <Pressable
                style={({ pressed }) => [styles.editCancelBtn, pressed && { opacity: 0.7 }]}
                onPress={() => setShowEditSheet(false)}
              >
                <Text style={styles.editCancelText}>{isFr ? "Annuler" : "Cancel"}</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.editSaveBtn, pressed && { opacity: 0.85 }]}
                onPress={() => {
                  if (display) {
                    api.upsertFoodCustomValues({
                      food_id: display.id,
                      food_name: display.name,
                      calories: baseCal,
                      protein: basePro,
                      carbs: baseCarb,
                      fat: baseFat,
                    }).catch(() => {});
                  }
                  setShowEditSheet(false);
                }}
              >
                <Text style={styles.editSaveText}>{isFr ? "Sauvegarder" : "Save"}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  value: number;
  onChange: (v: number) => void;
  theme: Theme;
  isFr: boolean;
  last?: boolean;
}

const EditField: React.FC<EditFieldProps> = ({ label, unit, value, onChange, theme, isFr, last }) => {
  const [text, setText] = useState(formatNum(value, isFr));

  useEffect(() => {
    setText(formatNum(value, isFr));
  }, [value, isFr]);

  return (
    <View style={{ marginBottom: last ? 0 : 12 }}>
      <Text style={{
        fontFamily: FONTS.semiBold,
        fontSize: 14,
        color: theme.foreground.gray,
        marginBottom: 6,
      }}>
        {label}
      </Text>
      <View style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: theme.background.accent,
        borderRadius: 14,
        paddingRight: 16,
      }}>
        <TextInput
          style={{
            flex: 1,
            borderRadius: 14,
            color: theme.foreground.white,
            fontFamily: FONTS.bold,
            fontSize: 22,
            padding: 14,
          }}
          value={text}
          onChangeText={(t) => {
            const cleaned = t.replace(",", ".").replace(/[^0-9.]/g, "");
            setText(cleaned);
            const n = parseFloat(cleaned);
            if (!Number.isNaN(n) && n >= 0) onChange(n);
          }}
          onBlur={() => {
            const n = parseFloat(text);
            if (Number.isNaN(n) || n < 0) {
              setText(formatNum(value, isFr));
            }
          }}
          keyboardType="decimal-pad"
          selectTextOnFocus
          maxLength={7}
        />
        <Text style={{
          fontFamily: FONTS.semiBold,
          fontSize: 18,
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
      ...StyleSheet.absoluteFillObject,
      justifyContent: "flex-end",
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
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
      height: 56,
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
      height: 200,
      backgroundColor: theme.background.darker,
      position: "relative",
      alignItems: "center",
      justifyContent: "center",
    },
    heroThumb: {
      width: "70%",
      height: "70%",
    },
    heroDim: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.30)",
    },
    heroTextWrap: {
      ...StyleSheet.absoluteFillObject,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
    },
    heroName: {
      fontFamily: FONTS.bold,
      fontSize: 26,
      color: "#fff",
      fontWeight: "800",
      textAlign: "center",
      lineHeight: 30,
    },
    heroBrand: {
      fontFamily: FONTS.semiBold,
      fontSize: 16,
      color: "rgba(255,255,255,0.85)",
      textAlign: "center",
      marginTop: 6,
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
    editLink: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingBottom: 12,
    },
    editLinkText: {
      fontFamily: FONTS.medium,
      fontSize: 13,
      color: theme.primary.main,
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
    pickerOptionTextActive: {
      color: theme.primary.main,
    },
  });
}

export default FoodDetailSheet;
