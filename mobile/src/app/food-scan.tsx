import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { Text } from "../components/ui/ScaledText";
import FoodDetailSheet from "../components/ui/FoodDetailSheet";
import { FONTS } from "../constants/fonts";
import { Theme } from "../constants/themes";
import { useNutrition } from "../contexts/NutritionContext";
import { useTheme } from "../contexts/ThemeContext";
import { getFoodByCodeOFF } from "../services/openFoodFactsApi";
import type { FoodItem } from "../services/nutritionApi";

const VALID_MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
type MealType = (typeof VALID_MEAL_TYPES)[number];

export default function FoodScanScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const { addMeal } = useNutrition();
  const params = useLocalSearchParams();
  const styles = createStyles(theme);

  const isFr = i18n.language?.startsWith("fr");
  const lang = isFr ? "fr" : "en";

  const selectedMealType: MealType = (() => {
    const raw = Array.isArray(params.mealType) ? params.mealType[0] : params.mealType;
    return VALID_MEAL_TYPES.includes(raw as MealType) ? (raw as MealType) : "breakfast";
  })();

  const targetDate = (() => {
    const raw = Array.isArray(params.date) ? params.date[0] : params.date;
    return raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : new Date().toISOString().split("T")[0];
  })();

  const mealLabels: Record<MealType, string> = isFr
    ? { breakfast: "Petit déjeuner", lunch: "Déjeuner", dinner: "Dîner", snack: "Collation" }
    : { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack" };

  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scannedFood, setScannedFood] = useState<FoodItem | null>(null);
  const [added, setAdded] = useState(false);
  const handledRef = useRef(false);

  const handleScan = useCallback(
    async ({ data }: { data: string }) => {
      if (handledRef.current || loading) return;
      handledRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const food = await getFoodByCodeOFF(data, lang as "fr" | "en");
        if (!food) {
          setError(isFr ? "Produit non trouvé pour ce code-barres." : "Product not found for this barcode.");
          handledRef.current = false;
          setLoading(false);
          return;
        }
        setScannedFood(food);
      } catch {
        setError(isFr ? "Erreur lors de la recherche." : "Search error.");
        handledRef.current = false;
      } finally {
        setLoading(false);
      }
    },
    [loading, lang, isFr],
  );

  const handleAdd = useCallback(
    async (food: FoodItem, servings: number) => {
      await addMeal({
        date: targetDate,
        mealType: selectedMealType,
        foodId: food.id,
        foodName: food.name,
        imageUrl: food.imageUrl,
        servings,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
      });
      setAdded(true);
      setTimeout(() => {
        setScannedFood(null);
        setAdded(false);
        handledRef.current = false;
      }, 600);
    },
    [addMeal, targetDate, selectedMealType],
  );

  if (!permission) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={theme.primary.main} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.center, { padding: 24 }]}>
        <Ionicons name="camera-outline" size={48} color={theme.foreground.gray} />
        <Text style={styles.permTitle}>
          {isFr ? "Accès caméra requis" : "Camera access required"}
        </Text>
        <Text style={styles.permHint}>
          {isFr
            ? "Nous avons besoin de votre caméra pour scanner les codes-barres."
            : "We need your camera to scan barcodes."}
        </Text>
        <Pressable style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>
            {isFr ? "Autoriser" : "Grant access"}
          </Text>
        </Pressable>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: theme.foreground.gray }}>
            {isFr ? "Annuler" : "Cancel"}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={scannedFood ? undefined : handleScan}
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e"],
        }}
      />

      <View style={styles.overlay} pointerEvents="box-none">
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#fff" />
          </Pressable>
          <Text style={styles.title}>
            {isFr ? "Scanner un aliment" : "Scan food"}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.frameWrap}>
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color="#fff" size="large" />
              <Text style={styles.hint}>
                {isFr ? "Recherche du produit..." : "Looking up product..."}
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.frame} />
              <Text style={styles.hint}>
                {isFr
                  ? "Alignez le code-barres dans le cadre"
                  : "Align the barcode inside the frame"}
              </Text>
            </>
          )}
          {error && (
            <Pressable
              onPress={() => {
                setError(null);
                handledRef.current = false;
              }}
              style={styles.errorBtn}
            >
              <Text style={styles.errorText}>
                {error} {isFr ? "Appuyez pour réessayer." : "Tap to retry."}
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      <FoodDetailSheet
        visible={!!scannedFood}
        food={scannedFood}
        mealLabel={mealLabels[selectedMealType]}
        isFr={!!isFr}
        isAdded={added}
        onClose={() => {
          setScannedFood(null);
          handledRef.current = false;
        }}
        onAdd={handleAdd}
      />
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: "#000" },
    center: { alignItems: "center", justifyContent: "center" },
    overlay: { flex: 1 },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingTop: 48,
      paddingBottom: 12,
    },
    closeBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "rgba(0,0,0,0.45)",
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      color: "#fff",
      fontFamily: FONTS.semiBold,
      fontSize: 16,
    },
    frameWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
    frame: {
      width: 280,
      height: 160,
      borderRadius: 16,
      borderWidth: 3,
      borderColor: theme.primary.main,
    },
    hint: {
      marginTop: 16,
      color: "rgba(255,255,255,0.85)",
      fontSize: 13,
      fontFamily: FONTS.medium,
    },
    loadingWrap: {
      alignItems: "center",
      gap: 16,
    },
    errorBtn: {
      marginTop: 16,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: "rgba(0,0,0,0.65)",
      maxWidth: 300,
    },
    errorText: {
      color: "#ffb4b4",
      fontSize: 12,
      textAlign: "center",
    },
    permTitle: {
      marginTop: 12,
      color: theme.foreground.white,
      fontFamily: FONTS.semiBold,
      fontSize: 16,
    },
    permHint: {
      marginTop: 6,
      color: theme.foreground.gray,
      fontSize: 13,
      textAlign: "center",
      maxWidth: 280,
    },
    permBtn: {
      marginTop: 20,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: theme.primary.main,
    },
    permBtnText: {
      color: theme.background.dark,
      fontFamily: FONTS.semiBold,
      fontSize: 14,
    },
  });
}
