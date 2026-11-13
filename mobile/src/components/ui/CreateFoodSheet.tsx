import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
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
import {
  FoodItem,
  UserFoodNutrientKey,
  UserFoodRow,
  userFoodToFoodItem,
} from "../../services/nutritionApi";

interface CreateFoodSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Called with the saved food, already mapped to a FoodItem. */
  onCreated: (food: FoodItem) => void;
  /** Pre-fills the name field (e.g. with the search query). */
  initialName?: string;
  /** Barcode of a scanned product that was not found. */
  barcode?: string;
}

interface NutrientField {
  key: UserFoodNutrientKey;
  fr: string;
  en: string;
  unit: "g" | "mg" | "µg";
}

// Same sections, labels and units as the "Edit values" sheet in FoodDetailSheet.
const DETAIL_SECTIONS: { fr: string; en: string; fields: NutrientField[] }[] = [
  {
    fr: "Glucides & Fibres",
    en: "Carbs & Fiber",
    fields: [
      { key: "sugars", fr: "· Dont sucres", en: "· Of which sugars", unit: "g" },
      { key: "fiber", fr: "Fibres alimentaires", en: "Dietary fiber", unit: "g" },
      { key: "polyols", fr: "Polyols", en: "Polyols", unit: "g" },
      { key: "starch", fr: "Amidon", en: "Starch", unit: "g" },
    ],
  },
  {
    fr: "Lipides spécifiques",
    en: "Specific Lipids",
    fields: [
      { key: "saturatedFat", fr: "· Dont acides gras saturés", en: "· Saturated fat", unit: "g" },
      { key: "monounsaturatedFat", fr: "Acides gras mono-insaturés", en: "Monounsaturated fat", unit: "g" },
      { key: "polyunsaturatedFat", fr: "Acides gras poly-insaturés", en: "Polyunsaturated fat", unit: "g" },
      { key: "transFat", fr: "Acides gras trans", en: "Trans fat", unit: "g" },
      { key: "cholesterol", fr: "Cholestérol", en: "Cholesterol", unit: "mg" },
    ],
  },
  {
    fr: "Minéraux & Électrolytes",
    en: "Minerals & Electrolytes",
    fields: [
      { key: "salt", fr: "Sel / Sodium", en: "Salt / Sodium", unit: "g" },
      { key: "potassium", fr: "Potassium", en: "Potassium", unit: "mg" },
      { key: "calcium", fr: "Calcium", en: "Calcium", unit: "mg" },
      { key: "magnesium", fr: "Magnésium", en: "Magnesium", unit: "mg" },
      { key: "iron", fr: "Fer", en: "Iron", unit: "mg" },
      { key: "zinc", fr: "Zinc", en: "Zinc", unit: "mg" },
      { key: "phosphorus", fr: "Phosphore", en: "Phosphorus", unit: "mg" },
    ],
  },
  {
    fr: "Vitamines",
    en: "Vitamins",
    fields: [
      { key: "vitaminA", fr: "Vitamine A", en: "Vitamin A", unit: "µg" },
      { key: "vitaminB1", fr: "Vitamine B1 (Thiamine)", en: "Vitamin B1 (Thiamin)", unit: "mg" },
      { key: "vitaminB2", fr: "Vitamine B2 (Riboflavine)", en: "Vitamin B2 (Riboflavin)", unit: "mg" },
      { key: "vitaminB3", fr: "Vitamine B3 (Niacine / PP)", en: "Vitamin B3 (Niacin)", unit: "mg" },
      { key: "vitaminB5", fr: "Vitamine B5 (Acide pantothénique)", en: "Vitamin B5", unit: "mg" },
      { key: "vitaminB6", fr: "Vitamine B6 (Pyridoxine)", en: "Vitamin B6", unit: "mg" },
      { key: "vitaminB7", fr: "Vitamine B7 (Biotine)", en: "Vitamin B7 (Biotin)", unit: "µg" },
      { key: "vitaminB9", fr: "Vitamine B9 (Folates)", en: "Vitamin B9 (Folates)", unit: "µg" },
      { key: "vitaminB12", fr: "Vitamine B12 (Cobalamine)", en: "Vitamin B12", unit: "µg" },
      { key: "vitaminC", fr: "Vitamine C", en: "Vitamin C", unit: "mg" },
      { key: "vitaminD", fr: "Vitamine D", en: "Vitamin D", unit: "µg" },
      { key: "vitaminE", fr: "Vitamine E", en: "Vitamin E", unit: "mg" },
      { key: "vitaminK", fr: "Vitamine K", en: "Vitamin K", unit: "µg" },
    ],
  },
  {
    fr: "Autres & Liquides",
    en: "Other & Fluids",
    fields: [
      { key: "water", fr: "Eau", en: "Water", unit: "g" },
      { key: "alcohol", fr: "Alcool", en: "Alcohol", unit: "g" },
      { key: "caffeine", fr: "Caféine", en: "Caffeine", unit: "mg" },
    ],
  },
];

const parseNum = (text: string): number | null => {
  const cleaned = text.replace(",", ".").trim();
  if (cleaned === "") return null;
  const n = parseFloat(cleaned);
  return Number.isNaN(n) || n < 0 ? null : n;
};

const sanitizeNum = (text: string) =>
  text.replace(",", ".").replace(/[^0-9.]/g, "");

/**
 * Form to create a private food (visible only to its creator) when a product
 * can't be found in OpenFoodFacts. Values are entered per 100 g.
 */
const CreateFoodSheet: React.FC<CreateFoodSheetProps> = ({
  visible,
  onClose,
  onCreated,
  initialName,
  barcode,
}) => {
  const { theme } = useTheme();
  const { i18n } = useTranslation();
  const isFr = i18n.language?.startsWith("fr");
  const styles = createStyles(theme);

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [servingSize, setServingSize] = useState("");
  // Optional detailed nutrients, raw text per key.
  const [details, setDetails] = useState<
    Partial<Record<UserFoodNutrientKey, string>>
  >({});
  const [showDetails, setShowDetails] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset the form every time the sheet opens (adjusting state during render,
  // per https://react.dev/learn/you-might-not-need-an-effect).
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setName(initialName?.trim() ?? "");
      setBrand("");
      setCalories("");
      setProtein("");
      setCarbs("");
      setFat("");
      setServingSize("");
      setDetails({});
      setShowDetails(false);
      setError(null);
      setSaving(false);
    }
  }

  const handleSave = async () => {
    if (saving) return;
    const trimmedName = name.trim();
    const cal = parseNum(calories);
    if (!trimmedName) {
      setError(isFr ? "Entrez le nom de l'aliment." : "Enter the food name.");
      return;
    }
    if (cal === null) {
      setError(
        isFr ? "Entrez les calories pour 100 g." : "Enter calories per 100 g.",
      );
      return;
    }

    const nutrients: Record<string, number> = {};
    for (const [key, text] of Object.entries(details)) {
      const n = parseNum(text ?? "");
      if (n !== null) nutrients[key] = n;
    }

    setSaving(true);
    setError(null);
    try {
      const row: UserFoodRow = await api.createUserFood({
        name: trimmedName,
        brand: brand.trim() || undefined,
        barcode: barcode || undefined,
        serving_size_g: parseNum(servingSize) ?? undefined,
        calories: cal,
        protein: parseNum(protein) ?? 0,
        carbs: parseNum(carbs) ?? 0,
        fat: parseNum(fat) ?? 0,
        nutrients,
      });
      onCreated(userFoodToFoodItem(row));
    } catch (e) {
      console.error("[CreateFoodSheet] Failed to create food:", e);
      setError(
        isFr
          ? "Impossible d'enregistrer l'aliment. Réessayez."
          : "Couldn't save the food. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const numField = (
    label: string,
    unit: string,
    value: string,
    onChange: (v: string) => void,
    required = false,
  ) => (
    <View style={styles.fieldHalf}>
      <Text style={styles.label}>
        {label}
        {required ? " *" : ""}
      </Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={(t) => onChange(sanitizeNum(t))}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={theme.foreground.gray}
        />
        <Text style={styles.unit}>{unit}</Text>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.backdrop}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>
              {isFr ? "Créer un aliment" : "Create a food"}
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.closeBtn,
                pressed && { opacity: 0.7 },
              ]}
              onPress={onClose}
              hitSlop={8}
            >
              <Ionicons name="close" size={20} color={theme.foreground.white} />
            </Pressable>
          </View>
          <Text style={styles.subtitle}>
            {isFr
              ? "Visible uniquement par vous. Copiez les valeurs de l'étiquette."
              : "Only visible to you. Copy the values from the label."}
          </Text>

          <ScrollView
            style={{ maxHeight: 520 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.sectionTitle}>
              {isFr ? "Produit" : "Product"}
            </Text>
            <Text style={styles.label}>{isFr ? "Nom *" : "Name *"}</Text>
            <TextInput
              style={[styles.input, styles.textInput]}
              value={name}
              onChangeText={setName}
              placeholder={isFr ? "ex. Msemen maison" : "e.g. Homemade granola"}
              placeholderTextColor={theme.foreground.gray}
              maxLength={120}
            />
            <Text style={[styles.label, { marginTop: 10 }]}>
              {isFr ? "Marque (optionnel)" : "Brand (optional)"}
            </Text>
            <TextInput
              style={[styles.input, styles.textInput]}
              value={brand}
              onChangeText={setBrand}
              placeholder={isFr ? "ex. Centrale Danone" : "e.g. Nature Valley"}
              placeholderTextColor={theme.foreground.gray}
              maxLength={120}
            />
            {!!barcode && (
              <View style={styles.barcodeRow}>
                <Ionicons
                  name="barcode-outline"
                  size={16}
                  color={theme.foreground.gray}
                />
                <Text style={styles.barcodeText}>{barcode}</Text>
              </View>
            )}

            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
              {isFr ? "Valeurs nutritionnelles (pour 100 g)" : "Nutrition (per 100 g)"}
            </Text>
            <View style={styles.grid}>
              {numField("Calories", "kcal", calories, setCalories, true)}
              {numField(isFr ? "Protéines" : "Protein", "g", protein, setProtein)}
              {numField(isFr ? "Glucides" : "Carbs", "g", carbs, setCarbs)}
              {numField(isFr ? "Lipides" : "Fat", "g", fat, setFat)}
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
              {isFr ? "Portion (optionnel)" : "Serving (optional)"}
            </Text>
            <View style={styles.grid}>
              {numField(
                isFr ? "Taille de la portion" : "Serving size",
                "g",
                servingSize,
                setServingSize,
              )}
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.detailsToggle,
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => setShowDetails((v) => !v)}
            >
              <Text style={styles.detailsToggleText}>
                {isFr
                  ? "Plus de détails (optionnel)"
                  : "More details (optional)"}
              </Text>
              <Ionicons
                name={showDetails ? "chevron-up" : "chevron-down"}
                size={18}
                color={theme.primary.main}
              />
            </Pressable>

            {showDetails &&
              DETAIL_SECTIONS.map((section) => (
                <View key={section.en}>
                  <Text style={[styles.sectionTitle, { marginTop: 14 }]}>
                    {isFr
                      ? `${section.fr} (pour 100 g)`
                      : `${section.en} (per 100 g)`}
                  </Text>
                  {section.fields.map((field) => (
                    <View key={field.key} style={styles.detailRow}>
                      <Text style={styles.detailLabel} numberOfLines={2}>
                        {isFr ? field.fr : field.en}
                      </Text>
                      <View style={styles.detailInputWrap}>
                        <TextInput
                          style={styles.detailInput}
                          value={details[field.key] ?? ""}
                          onChangeText={(t) =>
                            setDetails((prev) => ({
                              ...prev,
                              [field.key]: sanitizeNum(t),
                            }))
                          }
                          keyboardType="decimal-pad"
                          placeholder="—"
                          placeholderTextColor={theme.foreground.gray}
                        />
                        <Text style={styles.unit}>{field.unit}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ))}
          </ScrollView>

          {!!error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.buttons}>
            <Pressable
              style={({ pressed }) => [
                styles.cancelBtn,
                pressed && { opacity: 0.7 },
              ]}
              onPress={onClose}
            >
              <Text style={styles.cancelText}>
                {isFr ? "Annuler" : "Cancel"}
              </Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.saveBtn,
                (pressed || saving) && { opacity: 0.85 },
              ]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveText}>
                  {isFr ? "Enregistrer" : "Save"}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default CreateFoodSheet;

function createStyles(theme: Theme) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(0,0,0,0.55)",
    },
    sheet: {
      width: "100%",
      backgroundColor: theme.background.darker,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 22,
      paddingBottom: 34,
      paddingTop: 8,
    },
    handle: {
      alignSelf: "center",
      width: 42,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.foreground.gray,
      opacity: 0.4,
      marginBottom: 16,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 4,
    },
    title: {
      fontFamily: FONTS.bold,
      fontSize: 20,
      color: theme.foreground.white,
    },
    subtitle: {
      fontFamily: FONTS.regular,
      fontSize: 13,
      color: theme.foreground.gray,
      marginBottom: 14,
    },
    closeBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: theme.background.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    sectionTitle: {
      fontFamily: FONTS.bold,
      fontSize: 12,
      color: theme.primary.main,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 10,
      marginTop: 8,
    },
    label: {
      fontFamily: FONTS.semiBold,
      fontSize: 13,
      color: theme.foreground.gray,
      marginBottom: 5,
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.background.accent,
      borderRadius: 12,
      paddingRight: 14,
    },
    input: {
      flex: 1,
      borderRadius: 12,
      color: theme.foreground.white,
      fontFamily: FONTS.bold,
      fontSize: 18,
      padding: 11,
    },
    textInput: {
      flex: 0,
      backgroundColor: theme.background.accent,
      fontFamily: FONTS.semiBold,
      fontSize: 16,
    },
    unit: {
      fontFamily: FONTS.semiBold,
      fontSize: 14,
      color: theme.foreground.gray,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      rowGap: 10,
    },
    fieldHalf: {
      width: "48%",
    },
    detailsToggle: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 18,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 12,
      backgroundColor: theme.background.accent,
    },
    detailsToggleText: {
      fontFamily: FONTS.semiBold,
      fontSize: 14,
      color: theme.primary.main,
    },
    detailRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      marginBottom: 8,
    },
    detailLabel: {
      flex: 1,
      fontFamily: FONTS.medium,
      fontSize: 14,
      color: theme.foreground.white,
    },
    detailInputWrap: {
      width: 120,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.background.accent,
      borderRadius: 10,
      paddingRight: 12,
    },
    detailInput: {
      flex: 1,
      color: theme.foreground.white,
      fontFamily: FONTS.semiBold,
      fontSize: 16,
      paddingVertical: 8,
      paddingHorizontal: 10,
    },
    barcodeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 10,
    },
    barcodeText: {
      fontFamily: FONTS.medium,
      fontSize: 13,
      color: theme.foreground.gray,
    },
    error: {
      fontFamily: FONTS.semiBold,
      fontSize: 13,
      color: "#EF4444",
      marginTop: 12,
    },
    buttons: {
      flexDirection: "row",
      gap: 12,
      marginTop: 18,
    },
    cancelBtn: {
      flex: 1,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: "center",
      backgroundColor: theme.background.accent,
    },
    cancelText: {
      fontFamily: FONTS.semiBold,
      fontSize: 16,
      color: theme.foreground.white,
    },
    saveBtn: {
      flex: 1,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: "center",
      backgroundColor: theme.primary.main,
    },
    saveText: {
      fontFamily: FONTS.bold,
      fontSize: 16,
      color: "#fff",
    },
  });
}
