import React, { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  View,
  ViewToken,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, Path } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "../../components/ui/ScaledText";
import { FONTS } from "../../constants/fonts";
import { useI18n } from "../../contexts/I18nContext";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

const NAVY = "#0E2038";
const NAVY_MUTED = "#8FA3BC";
const TEXT_MUTED = "#64748B";
const CARD_LIGHT_BG = "#F2F5F9";
const ACCENT_GREEN = "#34D399";

type SlideData = {
  id: string;
  mockup: React.ReactNode;
  title: string;
  subtitle: string;
};

type Props = {
  onComplete: () => void;
};

// ─── Brain SVG Icon for Slide 2 ─────────────────────────────────────────────
function BrainIcon({ size = 26, color = NAVY }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9.5 3a2.5 2.5 0 0 1 2.5 2.5v13a2.5 2.5 0 0 1-5 .02A2.5 2.5 0 0 1 4 15.5a3 3 0 0 1-.3-5.58A2.5 2.5 0 0 1 5.02 5.7 2.5 2.5 0 0 1 9.5 3z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14.5 3a2.5 2.5 0 0 0-2.5 2.5v13a2.5 2.5 0 0 0 5 .02 2.5 2.5 0 0 0 3-3.02 3 3 0 0 0 .3-5.58 2.5 2.5 0 0 0-1.32-4.22A2.5 2.5 0 0 0 14.5 3z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 8.5a2 2 0 0 0-2 2"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <Path
        d="M12 13.5a2 2 0 0 0-2 2"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <Path
        d="M12 8.5a2 2 0 0 1 2 2"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <Path
        d="M12 13.5a2 2 0 0 1 2 2"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export default function NewOnboarding({ onComplete }: Props) {
  const { language } = useI18n();
  const isFr = language.startsWith("fr");
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const slides: SlideData[] = [
    {
      id: "1",
      mockup: <Slide1Mockup isFr={isFr} />,
      title: isFr ? "Suit tous vos exercices" : "Track all your exercises",
      subtitle: isFr
        ? "Le suivi va bien au-delà de la course et du vélo : plus de 30 exercices, et 100 autres à venir."
        : "Tracking goes beyond running and cycling: 30+ exercises, and 100 more coming.",
    },
    {
      id: "2",
      mockup: <Slide2Mockup isFr={isFr} />,
      title: isFr ? "Personnalise votre plan" : "Personalize your plan",
      subtitle: isFr
        ? "Hylift apprend vos capacités au fil du temps et recommande les séances et programmes qui vous conviennent."
        : "Hylift learns your capabilities over time and recommends the sessions and programs that fit you.",
    },
    {
      id: "3",
      mockup: <Slide3Mockup isFr={isFr} />,
      title: isFr ? "Mesure vos progrès" : "Measure your progress",
      subtitle: isFr
        ? "Des repères clairs, séance après séance, pour voir exactement où vous progressez."
        : "Clear benchmarks, session after session, to see exactly where you're progressing.",
    },
  ];

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
  ).current;

  const handleNext = () => {
    if (activeIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    } else {
      onComplete();
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 4 }]}>
      <FlatList
        ref={flatListRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <View style={styles.mockupArea}>{item.mockup}</View>
            <View style={styles.textArea}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>{item.subtitle}</Text>
            </View>
          </View>
        )}
      />

      {/* Bottom bar: equal-width indicators + circular next button */}
      <View
        style={[
          styles.bottomBar,
          { bottom: insets.bottom > 0 ? insets.bottom + 8 : 22 },
        ]}
      >
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === activeIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>
        <Pressable
          style={({ pressed }) => [styles.nextBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] }]}
          onPress={handleNext}
        >
          <Ionicons name="chevron-forward" size={26} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

// ─── Slide 1: Exercise Tracking Mockup ───────────────────────────────────────

function Slide1Mockup({ isFr }: { isFr: boolean }) {
  return (
    <View style={slide1Styles.container}>
      {/* Hero Image Container using the pushup athlete image */}
      <View style={slide1Styles.heroCard}>
        <Image
          source={require("../../../assets/images/2150989809.jpg")}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
        {/* Dark gradient overlay matching the mockup */}
        <LinearGradient
          colors={["transparent", "rgba(14, 32, 56, 0.15)", "rgba(14, 32, 56, 0.92)"]}
          style={StyleSheet.absoluteFill}
        />

        {/* Bottom overlay inside the card */}
        <View style={slide1Styles.heroOverlay}>
          <View style={slide1Styles.repRow}>
            <Text style={slide1Styles.repNumber}>23</Text>
            <Text style={slide1Styles.repLabel}>reps</Text>
          </View>

          <View style={slide1Styles.autoBadge}>
            <View style={slide1Styles.greenDot} />
            <Text style={slide1Styles.autoBadgeText}>
              {isFr ? "COMPTAGE AUTO" : "AUTO COUNT"}
            </Text>
          </View>
        </View>
      </View>

      {/* 2 Stat Cards below */}
      <View style={slide1Styles.statsRow}>
        <View style={slide1Styles.statCard}>
          <Text style={slide1Styles.statNumber}>30+</Text>
          <Text style={slide1Styles.statLabel}>
            {isFr ? "exercices suivis" : "exercises tracked"}
          </Text>
        </View>

        <View style={slide1Styles.statCard}>
          <Text style={slide1Styles.statNumber}>100+</Text>
          <Text style={slide1Styles.statLabel}>
            {isFr ? "à venir" : "coming soon"}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─── Slide 2: Personalize Plan Mockup ───────────────────────────────────────

const GRID_ITEMS = [
  {
    image: require("../../../assets/images/AuthPage/OneKneeOnTheGround.jpg"),
    nameFr: "Fente",
    nameEn: "Lunge",
    catFr: "BAS DU CORPS",
    catEn: "LOWER BODY",
    focusFr: "TONUS",
    focusEn: "TONE",
  },
  {
    image: require("../../../assets/images/2736.jpg"),
    nameFr: "Course",
    nameEn: "Running",
    catFr: "MÉTABOLISME",
    catEn: "METABOLISM",
    focusFr: "CARDIO",
    focusEn: "CARDIO",
  },
  {
    image: require("../../../assets/images/2150989931.jpg"),
    nameFr: "Corde à sauter",
    nameEn: "Jump rope",
    catFr: "ENDURANCE",
    catEn: "ENDURANCE",
    focusFr: "BRÛLE",
    focusEn: "BURN",
  },
  {
    image: require("../../../assets/images/2413.jpg"),
    nameFr: "Saut plyo",
    nameEn: "Plyo jump",
    catFr: "EXPLOSIVITÉ",
    catEn: "EXPLOSIVENESS",
    focusFr: "BOOST",
    focusEn: "BOOST",
  },
  {
    image: require("../../../assets/images/2150989809.jpg"),
    nameFr: "Planche",
    nameEn: "Plank",
    catFr: "COMPLET",
    catEn: "FULL BODY",
    focusFr: "GAINAGE",
    focusEn: "CORE",
  },
  {
    image: require("../../../assets/images/AuthPage/HoldingTwoWeights.jpg"),
    nameFr: "Haltères",
    nameEn: "Dumbbells",
    catFr: "HAUT DU CORPS",
    catEn: "UPPER BODY",
    focusFr: "FORCE",
    focusEn: "STRENGTH",
  },
];

function Slide2Mockup({ isFr }: { isFr: boolean }) {
  return (
    <View style={slide2Styles.container}>
      <View style={slide2Styles.grid}>
        {GRID_ITEMS.map((item, idx) => (
          <View key={idx} style={slide2Styles.card}>
            {/* Upper portion with photo & exercise name */}
            <View style={slide2Styles.cardUpper}>
              <Image source={item.image} style={StyleSheet.absoluteFill} contentFit="cover" />
              <LinearGradient
                colors={["rgba(14, 32, 56, 0.15)", "rgba(14, 32, 56, 0.72)"]}
                style={StyleSheet.absoluteFill}
              />
              <Text style={slide2Styles.exerciseName} numberOfLines={1}>
                {isFr ? item.nameFr : item.nameEn}
              </Text>
            </View>

            {/* Dark Navy bottom banner */}
            <View style={slide2Styles.cardBottom}>
              <Text style={slide2Styles.cardCategory}>
                {isFr ? item.catFr : item.catEn}
              </Text>
              <Text style={slide2Styles.cardFocus}>
                {isFr ? item.focusFr : item.focusEn}
              </Text>
            </View>
          </View>
        ))}

        {/* Center Floating AI Brain Badge */}
        <View style={slide2Styles.brainBadge}>
          <BrainIcon size={26} color={NAVY} />
        </View>
      </View>
    </View>
  );
}

// ─── Slide 3: Progress Mockup ───────────────────────────────────────────────

const DAYS = [
  { fr: "L", en: "M" },
  { fr: "M", en: "T" },
  { fr: "M", en: "W" },
  { fr: "J", en: "T" },
  { fr: "V", en: "F" },
  { fr: "S", en: "S" },
  { fr: "D", en: "S" },
];

const BAR_HEIGHTS = [42, 60, 52, 78, 92, 72, 108];

function Slide3Mockup({ isFr }: { isFr: boolean }) {
  return (
    <View style={slide3Styles.container}>
      {/* Soft ambient background shape in top-right */}
      <View style={slide3Styles.bgCircle} />

      {/* Top Dark Navy Dashboard Card */}
      <View style={slide3Styles.dashCard}>
        <View style={slide3Styles.dashHeader}>
          <View>
            <Text style={slide3Styles.dashCategory}>
              {isFr ? "VOLUME SOULEVÉ" : "VOLUME LIFTED"}
            </Text>
            <View style={slide3Styles.dashValueRow}>
              <Text style={slide3Styles.dashValue}>12 480</Text>
              <Text style={slide3Styles.dashUnit}>kg</Text>
            </View>
          </View>

          <View style={slide3Styles.percentBadge}>
            <Ionicons name="chevron-up" size={13} color={ACCENT_GREEN} />
            <Text style={slide3Styles.percentText}>18 %</Text>
          </View>
        </View>

        {/* 7-day Bar Chart */}
        <View style={slide3Styles.chartRow}>
          {DAYS.map((d, i) => {
            const isLast = i === 6;
            return (
              <View key={i} style={slide3Styles.chartCol}>
                <View
                  style={[
                    slide3Styles.chartBar,
                    {
                      height: BAR_HEIGHTS[i],
                      backgroundColor: isLast ? "#4ADE80" : "#4E637B",
                    },
                  ]}
                />
                <Text
                  style={[
                    slide3Styles.chartLabel,
                    isLast && { color: "#4ADE80", fontFamily: FONTS.extraBold },
                  ]}
                >
                  {isFr ? d.fr : d.en}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Row of 2 cards below */}
      <View style={slide3Styles.bottomCardsRow}>
        {/* Left: Circular gauge card */}
        <View style={slide3Styles.gaugeCard}>
          <View style={slide3Styles.gaugeWrap}>
            <Svg width={80} height={80} viewBox="0 0 80 80">
              <Circle cx={40} cy={40} r={34} stroke="#EEF2F6" strokeWidth={6.5} fill="none" />
              <Circle
                cx={40}
                cy={40}
                r={34}
                stroke={NAVY}
                strokeWidth={6.5}
                fill="none"
                strokeDasharray={`${2 * Math.PI * 34}`}
                strokeDashoffset={`${2 * Math.PI * 34 * 0.28}`}
                strokeLinecap="round"
                rotation={-90}
                origin="40, 40"
              />
            </Svg>
            <View style={slide3Styles.gaugeCenter}>
              <Text style={slide3Styles.gaugeValue}>45</Text>
              <Text style={slide3Styles.gaugeUnit}>rep/min</Text>
            </View>
          </View>
          <Text style={slide3Styles.gaugeLabel}>
            {isFr ? "Rythme moyen" : "Average pace"}
          </Text>
        </View>

        {/* Right: Streak & Record cards */}
        <View style={slide3Styles.rightCol}>
          <View style={slide3Styles.miniCard}>
            <Text style={slide3Styles.miniLabel}>
              {isFr ? "SÉRIE EN COURS" : "CURRENT STREAK"}
            </Text>
            <View style={slide3Styles.miniValueRow}>
              <Text style={slide3Styles.miniValue}>12</Text>
              <Text style={slide3Styles.miniUnit}>
                {isFr ? "jours" : "days"}
              </Text>
            </View>
          </View>

          <View style={slide3Styles.miniCard}>
            <Text style={slide3Styles.miniLabel}>RECORD</Text>
            <View style={slide3Styles.miniValueRow}>
              <Text style={slide3Styles.miniValue}>96</Text>
              <Text style={slide3Styles.miniUnit}>kg · squat</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  slide: {
    width: SCREEN_W,
    flex: 1,
    justifyContent: "flex-start",
    paddingBottom: 90,
  },
  mockupArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  textArea: {
    paddingHorizontal: 24,
    alignItems: "center",
    marginTop: 16,
  },
  title: {
    fontFamily: FONTS.extraBold,
    fontSize: 28,
    color: NAVY,
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    lineHeight: 22,
    color: TEXT_MUTED,
    textAlign: "center",
    paddingHorizontal: 4,
  },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 26,
  },
  dots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 32,
    height: 4.5,
    borderRadius: 2.5,
  },
  dotActive: {
    backgroundColor: NAVY,
  },
  dotInactive: {
    backgroundColor: "#E2E8F0",
  },
  nextBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: NAVY,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
});

// ─── Slide 1 Specific Styles ───
const HERO_HEIGHT = Math.round(Math.min(Math.max(SCREEN_H * 0.45, 300), 395));

const slide1Styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    gap: 12,
  },
  heroCard: {
    width: "100%",
    height: HERO_HEIGHT,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: CARD_LIGHT_BG,
    justifyContent: "flex-end",
  },
  heroOverlay: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 18,
    paddingBottom: 18,
  },
  repRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  repNumber: {
    fontFamily: FONTS.extraBold,
    fontSize: 52,
    color: "#FFFFFF",
    lineHeight: 56,
  },
  repLabel: {
    fontFamily: FONTS.semiBold,
    fontSize: 17,
    color: "#FFFFFF",
    marginBottom: 4,
  },
  autoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 4,
  },
  greenDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#22C55E",
  },
  autoBadgeText: {
    fontFamily: FONTS.bold,
    fontSize: 10.5,
    color: NAVY,
    letterSpacing: 0.8,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  statCard: {
    flex: 1,
    backgroundColor: CARD_LIGHT_BG,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 18,
    justifyContent: "center",
  },
  statNumber: {
    fontFamily: FONTS.extraBold,
    fontSize: 25,
    color: NAVY,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontFamily: FONTS.medium,
    fontSize: 12.5,
    color: TEXT_MUTED,
    marginTop: 2,
  },
});

// ─── Slide 2 Specific Styles ───
const GRID_CARD_W = (SCREEN_W - 40 - 12) / 2;
const GRID_CARD_H = Math.round(Math.min(Math.max((SCREEN_H * 0.56 - 24) / 3, 118), 145));

const slide2Styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
  },
  grid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    position: "relative",
    justifyContent: "center",
  },
  card: {
    width: GRID_CARD_W,
    height: GRID_CARD_H,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#E8EFF5",
  },
  cardUpper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 7,
    position: "relative",
  },
  exerciseName: {
    fontFamily: FONTS.bold,
    fontSize: 13.5,
    color: "#FFFFFF",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  cardBottom: {
    backgroundColor: NAVY,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  cardCategory: {
    fontFamily: FONTS.bold,
    fontSize: 8.5,
    color: NAVY_MUTED,
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  cardFocus: {
    fontFamily: FONTS.extraBold,
    fontSize: 14,
    color: "#FFFFFF",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginTop: -1,
  },
  brainBadge: {
    position: "absolute",
    top: GRID_CARD_H + 6 - 28,
    left: "50%",
    transform: [{ translateX: -28 }],
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 10,
    borderWidth: 2.5,
    borderColor: "#F0F4F8",
  },
});

// ─── Slide 3 Specific Styles ───
const slide3Styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: 12,
    position: "relative",
  },
  bgCircle: {
    position: "absolute",
    top: -50,
    right: -60,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "#F2F5F9",
    zIndex: -1,
  },
  dashCard: {
    backgroundColor: NAVY,
    borderRadius: 24,
    padding: 20,
    width: "100%",
  },
  dashHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  dashCategory: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    color: NAVY_MUTED,
    letterSpacing: 0.8,
  },
  dashValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 2,
  },
  dashValue: {
    fontFamily: FONTS.extraBold,
    fontSize: 38,
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  dashUnit: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.7)",
    marginLeft: 6,
  },
  percentBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(52, 211, 153, 0.18)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  percentText: {
    fontFamily: FONTS.bold,
    fontSize: 12.5,
    color: ACCENT_GREEN,
  },
  chartRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 22,
    height: 114,
    paddingHorizontal: 4,
  },
  chartCol: {
    alignItems: "center",
    gap: 7,
    flex: 1,
  },
  chartBar: {
    width: 16,
    borderRadius: 8,
  },
  chartLabel: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.6)",
  },
  bottomCardsRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  gaugeCard: {
    flex: 1.15,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  gaugeWrap: {
    width: 80,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  gaugeCenter: {
    position: "absolute",
    alignItems: "center",
  },
  gaugeValue: {
    fontFamily: FONTS.extraBold,
    fontSize: 24,
    color: NAVY,
  },
  gaugeUnit: {
    fontFamily: FONTS.medium,
    fontSize: 9.5,
    color: TEXT_MUTED,
    marginTop: -2,
  },
  gaugeLabel: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: TEXT_MUTED,
    marginTop: 8,
  },
  rightCol: {
    flex: 1,
    gap: 10,
  },
  miniCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  miniLabel: {
    fontFamily: FONTS.bold,
    fontSize: 9.5,
    color: TEXT_MUTED,
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  miniValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  miniValue: {
    fontFamily: FONTS.extraBold,
    fontSize: 28,
    color: NAVY,
  },
  miniUnit: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: TEXT_MUTED,
  },
});
