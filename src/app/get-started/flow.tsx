/**
 * Single-screen onboarding flow for email sign-up.
 * All 14 steps live here — transitions are fully in-page (no stack push).
 * Slides: question ↔ question  |  Fade: ↔ celebration screens
 * Each step's elements entrance with a staggered fade+slide.
 */

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Animated,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ChipButton from "../../components/ui/ChipButton";
import RulerPicker from "../../components/ui/RulerPicker";
import { FONTS } from "../../constants/fonts";
import { Theme } from "../../constants/themes";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";


// ─── Steps ────────────────────────────────────────────────────────────────────

const STEPS = [
  "username",
  "goal",
  "goal-congrats",
  "habits",
  "habits-congrats",
  "meal-planning",
  "meal-congrats",
  "activity-level",
  "gender",
  "age",
  "height",
  "weight",
  "weekly-goal",
  "account",
] as const;

type StepId = (typeof STEPS)[number];

const CONGRATS_SET = new Set<StepId>([
  "goal-congrats",
  "habits-congrats",
  "meal-congrats",
]);

const QUESTION_STEPS = STEPS.filter((s) => !CONGRATS_SET.has(s));
const TOTAL = QUESTION_STEPS.length;

function progressFor(id: StepId) {
  const idx = QUESTION_STEPS.indexOf(id);
  return idx === -1 ? null : { current: idx + 1, total: TOTAL };
}

// ─── Form data ────────────────────────────────────────────────────────────────

interface FormData {
  username: string;
  goal: string;
  habits: string[];
  mealPlanning: string;
  activityLevel: string;
  gender: string;
  age: number;
  height: number;
  weight: number;
  weeklyGoalId: string;
  weeklyGoalKg: number;
  email: string;
  password: string;
  agreedToTerms: boolean;
}

const DEFAULT_FORM: FormData = {
  username: "",
  goal: "",
  habits: [],
  mealPlanning: "",
  activityLevel: "",
  gender: "",
  age: 25,
  height: 175,
  weight: 75,
  weeklyGoalId: "",
  weeklyGoalKg: 0,
  email: "",
  password: "",
  agreedToTerms: false,
};

// ─── Static option arrays ─────────────────────────────────────────────────────

const GOALS = [
  { id: "lose_weight",   label: "Lose weight",     desc: "Burn fat, feel lighter",     icon: "trending-down-outline" },
  { id: "maintain",      label: "Maintain weight",  desc: "Stay where you are",         icon: "remove-outline"        },
  { id: "gain_weight",   label: "Gain weight",      desc: "Fuel up, add size",          icon: "trending-up-outline"   },
  { id: "build_muscle",  label: "Build muscle",     desc: "Get stronger & leaner",      icon: "barbell-outline"       },
] as const;

const HABITS = [
  { id: "eat_balanced",    label: "Eat balanced meals", icon: "nutrition-outline"     },
  { id: "drink_water",     label: "Drink more water",   icon: "water-outline"         },
  { id: "sleep_well",      label: "Sleep better",       icon: "moon-outline"          },
  { id: "move_daily",      label: "Move every day",     icon: "walk-outline"          },
  { id: "strength",        label: "Build strength",     icon: "barbell-outline"       },
  { id: "reduce_stress",   label: "Reduce stress",      icon: "leaf-outline"          },
  { id: "cut_sugar",       label: "Cut added sugar",    icon: "ice-cream-outline"     },
  { id: "track_progress",  label: "Track progress",     icon: "stats-chart-outline"   },
  { id: "mindful_eating",  label: "Eat mindfully",      icon: "happy-outline"         },
] as const;

const MEAL_OPTIONS = [
  { id: "never",        label: "Never",        desc: "I eat whatever shows up" },
  { id: "rarely",       label: "Rarely",       desc: "Once in a while"         },
  { id: "occasionally", label: "Occasionally", desc: "Some days, not most"     },
  { id: "frequently",   label: "Frequently",   desc: "Most days I plan"        },
  { id: "always",       label: "Always",       desc: "I plan every meal"       },
] as const;

const ACTIVITY_LEVELS = [
  { id: "sedentary",   label: "Sedentary",          desc: "Mostly sitting, little exercise",    icon: "cafe-outline"     },
  { id: "light",       label: "Lightly active",     desc: "Light walks, occasional workouts",   icon: "walk-outline"     },
  { id: "moderate",    label: "Moderately active",  desc: "3–5 workouts or active job",         icon: "bicycle-outline"  },
  { id: "active",      label: "Very active",        desc: "Daily workouts, on your feet",       icon: "fitness-outline"  },
  { id: "very_active", label: "Extra active",       desc: "Intense training or physical job",   icon: "flame-outline"    },
] as const;

const LOSS_OPTIONS = [
  { id: "lose_0_25", label: "Lose 0.25 kg / week", sub: "Easy and sustainable", kgPerWeek: -0.25, pace: "slow"   },
  { id: "lose_0_5",  label: "Lose 0.5 kg / week",  sub: "Recommended",          kgPerWeek: -0.5,  pace: "steady" },
  { id: "lose_0_75", label: "Lose 0.75 kg / week", sub: "Ambitious",            kgPerWeek: -0.75, pace: "fast"   },
  { id: "lose_1_0",  label: "Lose 1 kg / week",    sub: "Aggressive",           kgPerWeek: -1.0,  pace: "fast"   },
] as const;

const GAIN_OPTIONS = [
  { id: "gain_0_2",  label: "Gain 0.2 kg / week",  sub: "Lean, slow bulk", kgPerWeek: 0.2,  pace: "slow"   },
  { id: "gain_0_35", label: "Gain 0.35 kg / week", sub: "Recommended",     kgPerWeek: 0.35, pace: "steady" },
  { id: "gain_0_5",  label: "Gain 0.5 kg / week",  sub: "Ambitious",       kgPerWeek: 0.5,  pace: "fast"   },
] as const;

const MAINTAIN_OPTIONS = [
  { id: "maintain", label: "Maintain weight", sub: "Keep your current weight", kgPerWeek: 0, pace: "steady" },
] as const;

// ─── Main component ───────────────────────────────────────────────────────────

export default function OnboardingFlow() {
  const router   = useRouter();
  const { theme } = useTheme();
  const { signUp, setGetStartedCompleted } = useAuth();
  const styles   = createStyles(theme);

  const [stepIdx,       setStepIdx]      = useState(0);
  const [form,          setForm]         = useState<FormData>(DEFAULT_FORM);
  const [signupLoading, setSignupLoading] = useState(false);
  const [showPassword,  setShowPassword] = useState(false);
  const busy = useRef(false);

  // Single opacity value — fade out, swap step, fade in
  const opacity = useRef(new Animated.Value(1)).current;

  // Celebration-screen badge animations
  const pulse        = useRef(new Animated.Value(0)).current;
  const badgeScale   = useRef(new Animated.Value(0.3)).current;
  const badgeOpacity = useRef(new Animated.Value(0)).current;

  const currentId  = STEPS[stepIdx];
  const isCongrats = CONGRATS_SET.has(currentId);

  // Pulse loop for celebration screens
  useEffect(() => {
    if (!isCongrats) return;
    pulse.setValue(0);
    badgeScale.setValue(0.3);
    badgeOpacity.setValue(0);

    Animated.parallel([
      Animated.spring(badgeScale,   { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
      Animated.timing(badgeOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [isCongrats, stepIdx, pulse, badgeScale, badgeOpacity]);

  const pulseScale   = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.4] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });

  // ─── Transition engine ────────────────────────────────────────────────────

  const goTo = useCallback(
    (target: number) => {
      if (busy.current) return;
      busy.current = true;
      Keyboard.dismiss();

      // Fade out
      Animated.timing(opacity, {
        toValue: 0,
        duration: 160,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        // Swap content while invisible
        setStepIdx(target);
        // Fade in on next frame so layout has settled
        requestAnimationFrame(() => {
          Animated.timing(opacity, {
            toValue: 1,
            duration: 220,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }).start(() => {
            busy.current = false;
          });
        });
      });
    },
    [opacity],
  );

  const next = useCallback(() => {
    if (stepIdx < STEPS.length - 1) goTo(stepIdx + 1);
  }, [stepIdx, goTo]);

  // ─── Weekly goal options ──────────────────────────────────────────────────

  const weeklyOptions = useMemo(() => {
    if (form.goal === "gain_weight" || form.goal === "build_muscle") return GAIN_OPTIONS;
    if (form.goal === "maintain") return MAINTAIN_OPTIONS;
    return LOSS_OPTIONS;
  }, [form.goal]);

  // ─── Account submit ───────────────────────────────────────────────────────

  const handleSignUp = async () => {
    if (signupLoading) return;
    setSignupLoading(true);
    try {
      await signUp(form.email.trim(), form.password, form.username);
      try { await setGetStartedCompleted(); } catch {}
      router.replace("/(tabs)/home");
    } catch (err: unknown) {
      Alert.alert("Sign up error", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setSignupLoading(false);
    }
  };

  // ─── CTA enabled? ─────────────────────────────────────────────────────────

  const canContinue = useMemo(() => {
    switch (STEPS[stepIdx]) {
      case "username":      return form.username.trim().length >= 2;
      case "goal":          return !!form.goal;
      case "habits":        return form.habits.length > 0;
      case "meal-planning": return !!form.mealPlanning;
      case "activity-level":return !!form.activityLevel;
      case "gender":        return !!form.gender;
      case "weekly-goal":   return !!form.weeklyGoalId;
      case "account":
        return (
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) &&
          form.password.length >= 6 &&
          form.agreedToTerms &&
          !signupLoading
        );
      default: return true;
    }
  }, [stepIdx, form, signupLoading]);

  const handleCTA = useCallback(() => {
    if (!canContinue) return;
    if (STEPS[stepIdx] === "account") handleSignUp();
    else next();
  }, [canContinue, stepIdx, next]);

  // ─── Step content ─────────────────────────────────────────────────────────

  const renderStep = (si: number) => {
    const id = STEPS[si];

    switch (id) {

      case "username":
        return (
          <Shell key="username">
            <Text style={styles.title}>First, what can we call you?</Text>
            <Text style={styles.subtitle}>Pick a name you'd like on Hylift. You can change it later.</Text>
            <Text style={styles.label}>Preferred username</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. alex_fitness"
              placeholderTextColor={theme.foreground.gray}
              value={form.username}
              onChangeText={(v) => setForm((f) => ({ ...f, username: v }))}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={24}
            />
            <Text style={styles.hint}>2 to 24 characters</Text>
          </Shell>
        );

      case "goal":
        return (
          <Shell key="goal" scrollable>
            <Text style={styles.title}>What's your main goal?</Text>
            <Text style={styles.subtitle}>Pick one — we'll tailor your entire Hylift experience.</Text>
            {GOALS.map((g) => (
              <SelectCard
                key={g.id}
                selected={form.goal === g.id}
                onPress={() => setForm((f) => ({ ...f, goal: g.id }))}
                icon={g.icon as any}
                title={g.label}
                desc={g.desc}
                theme={theme}
              />
            ))}
          </Shell>
        );

      case "goal-congrats":
        return (
          <Congrats
            key="goal-congrats"
            icon="trophy"
            headline={form.username ? `Great, ${form.username}!` : "Great!"}
            message="You've just taken a big step on your journey. Let's keep the momentum going."
            badgeScale={badgeScale}
            badgeOpacity={badgeOpacity}
            pulseScale={pulseScale}
            pulseOpacity={pulseOpacity}
            theme={theme}
          />
        );

      case "habits":
        return (
          <Shell key="habits" scrollable>
            <Text style={styles.title}>Which healthy habits matter to you?</Text>
            <Text style={styles.subtitle}>Select all that apply — we'll keep you accountable.</Text>
            <View style={styles.chipGrid}>
              {HABITS.map((h) => {
                const sel = form.habits.includes(h.id);
                return (
                  <TouchableOpacity
                    key={h.id}
                    activeOpacity={0.82}
                    onPress={() =>
                      setForm((f) => ({
                        ...f,
                        habits: sel
                          ? f.habits.filter((x) => x !== h.id)
                          : [...f.habits, h.id],
                      }))
                    }
                    style={[
                      styles.habitChip,
                      {
                        borderColor: sel ? theme.primary.main : theme.background.accent,
                        backgroundColor: sel ? theme.primary.main + "18" : theme.background.darker,
                      },
                    ]}
                  >
                    <Ionicons name={h.icon as any} size={16} color={sel ? theme.primary.main : theme.foreground.gray} />
                    <Text style={[styles.habitChipLabel, { color: sel ? theme.primary.main : theme.foreground.white }]}>
                      {h.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {form.habits.length > 0 && (
              <Text style={[styles.hint, { marginTop: 14 }]}>{form.habits.length} selected</Text>
            )}
          </Shell>
        );

      case "habits-congrats":
        return (
          <Congrats
            key="habits-congrats"
            icon="compass"
            headline="This is your journey"
            message="No worries — we'll be your guide every step of the way."
            badgeScale={badgeScale}
            badgeOpacity={badgeOpacity}
            pulseScale={pulseScale}
            pulseOpacity={pulseOpacity}
            theme={theme}
          />
        );

      case "meal-planning":
        return (
          <Shell key="meal-planning" scrollable>
            <Text style={styles.title}>How often do you plan meals in advance?</Text>
            <Text style={styles.subtitle}>No judgment — we'll meet you where you are.</Text>
            {MEAL_OPTIONS.map((o) => {
              const sel = form.mealPlanning === o.id;
              return (
                <TouchableOpacity
                  key={o.id}
                  activeOpacity={0.85}
                  onPress={() => setForm((f) => ({ ...f, mealPlanning: o.id }))}
                  style={[
                    styles.radioCard,
                    {
                      borderColor: sel ? theme.primary.main : theme.background.accent,
                      backgroundColor: sel ? theme.primary.main + "14" : theme.background.darker,
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: sel ? theme.primary.main : theme.foreground.white }]}>{o.label}</Text>
                    <Text style={[styles.cardDesc, { color: theme.foreground.gray }]}>{o.desc}</Text>
                  </View>
                  <View style={[styles.radio, { borderColor: sel ? theme.primary.main : theme.background.accent, backgroundColor: sel ? theme.primary.main : "transparent" }]}>
                    {sel && <Ionicons name="checkmark" size={13} color="#fff" />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </Shell>
        );

      case "meal-congrats":
        return (
          <Congrats
            key="meal-congrats"
            icon="checkmark-circle"
            headline="Great! We have a solid system for you"
            message="Just a few more questions and your plan is ready."
            badgeScale={badgeScale}
            badgeOpacity={badgeOpacity}
            pulseScale={pulseScale}
            pulseOpacity={pulseOpacity}
            theme={theme}
          />
        );

      case "activity-level":
        return (
          <Shell key="activity-level" scrollable>
            <Text style={styles.title}>What's your baseline activity level?</Text>
            <Text style={styles.subtitle}>Pick whatever describes your typical week.</Text>
            {ACTIVITY_LEVELS.map((lv) => (
              <SelectCard
                key={lv.id}
                selected={form.activityLevel === lv.id}
                onPress={() => setForm((f) => ({ ...f, activityLevel: lv.id }))}
                icon={lv.icon as any}
                title={lv.label}
                desc={lv.desc}
                theme={theme}
              />
            ))}
          </Shell>
        );

      case "gender":
        return (
          <Shell key="gender">
            <Text style={styles.title}>What's your gender?</Text>
            <Text style={styles.subtitle}>Helps us calculate your calorie and macro targets.</Text>
            <View style={styles.genderRow}>
              {(["male", "female"] as const).map((g) => {
                const sel = form.gender === g;
                return (
                  <TouchableOpacity
                    key={g}
                    activeOpacity={0.85}
                    onPress={() => setForm((f) => ({ ...f, gender: g }))}
                    style={[
                      styles.genderCard,
                      {
                        borderColor: sel ? theme.primary.main : theme.background.accent,
                        backgroundColor: sel ? theme.primary.main + "14" : theme.background.darker,
                      },
                    ]}
                  >
                    <Ionicons name={g === "male" ? "man-outline" : "woman-outline"} size={36} color={sel ? theme.primary.main : theme.foreground.gray} />
                    <Text style={[styles.genderLabel, { color: sel ? theme.primary.main : theme.foreground.white }]}>
                      {g === "male" ? "Male" : "Female"}
                    </Text>
                    {sel && (
                      <View style={[styles.genderCheck, { backgroundColor: theme.primary.main }]}>
                        <Ionicons name="checkmark" size={13} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Shell>
        );

      case "age":
        return (
          <Shell key="age">
            <Text style={styles.title}>How old are you?</Text>
            <Text style={styles.subtitle}>We use this to estimate your daily energy needs.</Text>
            <View style={styles.pickerWrap}>
              <RulerPicker min={13} max={80} step={1} defaultValue={form.age} unit="yrs" onChange={(v) => setForm((f) => ({ ...f, age: v }))} />
            </View>
          </Shell>
        );

      case "height":
        return (
          <Shell key="height">
            <Text style={styles.title}>How tall are you?</Text>
            <Text style={styles.subtitle}>Used to calculate your BMI and calorie needs.</Text>
            <View style={styles.pickerWrap}>
              <RulerPicker min={130} max={220} step={1} defaultValue={form.height} unit="cm" onChange={(v) => setForm((f) => ({ ...f, height: v }))} />
            </View>
          </Shell>
        );

      case "weight":
        return (
          <Shell key="weight">
            <Text style={styles.title}>What's your current weight?</Text>
            <Text style={styles.subtitle}>Your starting point — update it any time.</Text>
            <View style={styles.pickerWrap}>
              <RulerPicker min={30} max={200} step={0.5} defaultValue={form.weight} unit="kg" onChange={(v) => setForm((f) => ({ ...f, weight: v }))} />
            </View>
          </Shell>
        );

      case "weekly-goal": {
        const opts = weeklyOptions;
        const headline =
          form.goal === "gain_weight" || form.goal === "build_muscle"
            ? "What's your weekly gain goal?"
            : form.goal === "maintain"
            ? "Confirm your weekly goal"
            : "What's your weekly loss goal?";
        const paceColor = (pace: string) =>
          pace === "slow" ? "#22C55E" : pace === "steady" ? theme.primary.main : "#F59E0B";

        return (
          <Shell key="weekly-goal" scrollable>
            <Text style={styles.title}>{headline}</Text>
            <Text style={styles.subtitle}>Small steady wins compound. You can adjust this any time.</Text>
            {opts.map((o) => {
              const sel = form.weeklyGoalId === o.id;
              const color = paceColor(o.pace);
              return (
                <TouchableOpacity
                  key={o.id}
                  activeOpacity={0.85}
                  onPress={() => setForm((f) => ({ ...f, weeklyGoalId: o.id, weeklyGoalKg: o.kgPerWeek }))}
                  style={[
                    styles.radioCard,
                    {
                      borderColor: sel ? color : theme.background.accent,
                      backgroundColor: sel ? color + "14" : theme.background.darker,
                    },
                  ]}
                >
                  <View style={[styles.weeklyBadge, { backgroundColor: sel ? color + "22" : theme.background.accent }]}>
                    <Ionicons
                      name={o.kgPerWeek < 0 ? "trending-down" : o.kgPerWeek > 0 ? "trending-up" : "remove"}
                      size={20}
                      color={sel ? color : theme.foreground.gray}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: sel ? color : theme.foreground.white }]}>{o.label}</Text>
                    <Text style={[styles.cardDesc, { color: theme.foreground.gray }]}>{o.sub}</Text>
                  </View>
                  {sel && (
                    <View style={[styles.check, { backgroundColor: color }]}>
                      <Ionicons name="checkmark" size={13} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </Shell>
        );
      }

      case "account":
        return (
          <Shell key="account" scrollable keyboardAvoiding>
            <Text style={styles.title}>
              {form.username ? `One last step, ${form.username}` : "One last step"}
            </Text>
            <Text style={styles.subtitle}>Create your account to save your plan and start tracking.</Text>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, { marginBottom: 14 }]}
              placeholder="you@example.com"
              placeholderTextColor={theme.foreground.gray}
              value={form.email}
              onChangeText={(v) => setForm((f) => ({ ...f, email: v }))}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, { flex: 1, paddingRight: 46 }]}
                placeholder="At least 6 characters"
                placeholderTextColor={theme.foreground.gray}
                value={form.password}
                onChangeText={(v) => setForm((f) => ({ ...f, password: v }))}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword((s) => !s)} activeOpacity={0.7}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={theme.foreground.gray} />
              </TouchableOpacity>
            </View>
            <Pressable onPress={() => setForm((f) => ({ ...f, agreedToTerms: !f.agreedToTerms }))} style={styles.agreeRow}>
              <View style={[styles.checkbox, { borderColor: form.agreedToTerms ? theme.primary.main : theme.background.accent, backgroundColor: form.agreedToTerms ? theme.primary.main : "transparent" }]}>
                {form.agreedToTerms && <Ionicons name="checkmark" size={13} color="#fff" />}
              </View>
              <Text style={[styles.agreeText, { color: theme.foreground.gray }]}>
                I agree to the{" "}
                <Text style={{ color: theme.primary.main, fontFamily: FONTS.semiBold }}>Hylift Terms</Text>
                {" "}and{" "}
                <Text style={{ color: theme.primary.main, fontFamily: FONTS.semiBold }}>Privacy Policy</Text>.
              </Text>
            </Pressable>
          </Shell>
        );

      default:
        return null;
    }
  };

  // ─── Progress bar ─────────────────────────────────────────────────────────

  const progressAnim = useRef(new Animated.Value(0)).current;
  const prog = progressFor(currentId);

  useEffect(() => {
    if (!prog) return;
    Animated.timing(progressAnim, {
      toValue: prog.current / prog.total,
      duration: 360,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [prog, progressAnim]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        {stepIdx > 0 ? (
          <TouchableOpacity onPress={() => goTo(stepIdx - 1)} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={22} color={theme.foreground.white} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtn} />
        )}

        {prog && (
          <View style={styles.progressWrap}>
            <View style={[styles.progressBg, { backgroundColor: theme.background.accent }]}>
              <Animated.View style={[styles.progressFill, { backgroundColor: theme.primary.main, width: progressWidth }]} />
            </View>
            <Text style={[styles.progressLabel, { color: theme.primary.main }]}>
              {prog.current}/{prog.total}
            </Text>
          </View>
        )}

        <View style={{ width: 36 }} />
      </View>

      {/* Content */}
      <Animated.View style={[styles.contentArea, { opacity }]}>
        {renderStep(stepIdx)}
      </Animated.View>

      {/* CTA */}
      <View style={styles.ctaWrap}>
        {isCongrats ? (
          <Animated.View style={{ opacity: badgeOpacity }}>
            <ChipButton title="Next" onPress={() => next()} variant="primary" size="lg" fullWidth />
          </Animated.View>
        ) : (
          <ChipButton
            title={STEPS[stepIdx] === "account" ? (signupLoading ? "Creating account…" : "Create account") : "Continue"}
            onPress={handleCTA}
            variant="primary"
            size="lg"
            fullWidth
            disabled={!canContinue}
            loading={signupLoading}
          />
        )}
      </View>
    </View>
  );
}

// ─── Shell ────────────────────────────────────────────────────────────────────
// Container for each step's content. Handles scrollable + keyboard-avoiding variants.

function Shell({
  children,
  scrollable = false,
  keyboardAvoiding = false,
}: {
  children: React.ReactNode;
  scrollable?: boolean;
  keyboardAvoiding?: boolean;
}) {
  const body = scrollable ? (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={{ flex: 1 }}>{children}</View>
  );

  if (keyboardAvoiding) {
    return (
      <KeyboardAvoidingView style={styles.shell} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {body}
      </KeyboardAvoidingView>
    );
  }
  return <View style={styles.shell}>{body}</View>;
}

const styles = StyleSheet.create({
  shell: { flex: 1, paddingHorizontal: 20 },
});

// ─── SelectCard ───────────────────────────────────────────────────────────────

function SelectCard({
  selected, onPress, icon, title, desc, theme,
}: {
  selected: boolean;
  onPress: () => void;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  desc: string;
  theme: ReturnType<typeof useTheme>["theme"];
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        cardSty.card,
        {
          borderColor: selected ? theme.primary.main : theme.background.accent,
          backgroundColor: selected ? theme.primary.main + "14" : theme.background.darker,
        },
      ]}
    >
      <View style={[cardSty.icon, { backgroundColor: selected ? theme.primary.main + "22" : theme.background.accent }]}>
        <Ionicons name={icon} size={22} color={selected ? theme.primary.main : theme.foreground.gray} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[cardSty.title, { color: selected ? theme.primary.main : theme.foreground.white }]}>{title}</Text>
        <Text style={[cardSty.desc,  { color: theme.foreground.gray }]}>{desc}</Text>
      </View>
      {selected && (
        <View style={[cardSty.check, { backgroundColor: theme.primary.main }]}>
          <Ionicons name="checkmark" size={13} color="#fff" />
        </View>
      )}
    </TouchableOpacity>
  );
}

const cardSty = StyleSheet.create({
  card:  { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1.5, borderRadius: 14, padding: 14, marginBottom: 10 },
  icon:  { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 15, fontFamily: FONTS.bold, marginBottom: 2 },
  desc:  { fontSize: 12 },
  check: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
});

// ─── Congrats ─────────────────────────────────────────────────────────────────

function Congrats({
  icon, headline, message, badgeScale, badgeOpacity, pulseScale, pulseOpacity, theme,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  headline: string;
  message: string;
  badgeScale: Animated.Value;
  badgeOpacity: Animated.Value;
  pulseScale: Animated.AnimatedInterpolation<string | number>;
  pulseOpacity: Animated.AnimatedInterpolation<string | number>;
  theme: ReturnType<typeof useTheme>["theme"];
}) {
  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={[theme.primary.main + "22", "transparent"]} style={StyleSheet.absoluteFill} />
      <View style={congSty.inner}>
        <View style={congSty.wrap}>
          <Animated.View style={[congSty.pulse, { borderColor: theme.primary.main, opacity: pulseOpacity, transform: [{ scale: pulseScale }] }]} />
          <Animated.View style={[congSty.badge, { backgroundColor: theme.primary.main, opacity: badgeOpacity, transform: [{ scale: badgeScale }] }]}>
            <Ionicons name={icon} size={44} color="#fff" />
          </Animated.View>
        </View>
        <Animated.Text style={[congSty.headline, { color: "#fff", opacity: badgeOpacity }]}>{headline}</Animated.Text>
        <Animated.Text style={[congSty.message,  { color: "rgba(255,255,255,0.72)", opacity: badgeOpacity }]}>{message}</Animated.Text>
      </View>
    </View>
  );
}

const congSty = StyleSheet.create({
  inner:    { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28 },
  wrap:     { width: 120, height: 120, alignItems: "center", justifyContent: "center", marginBottom: 28 },
  pulse:    { position: "absolute", width: 120, height: 120, borderRadius: 60, borderWidth: 3 },
  badge:    { width: 96, height: 96, borderRadius: 48, alignItems: "center", justifyContent: "center" },
  headline: { fontSize: 28, fontFamily: FONTS.bold, textAlign: "center", marginBottom: 14, lineHeight: 34 },
  message:  { fontSize: 15, textAlign: "center", lineHeight: 22 },
});

// ─── Per-screen styles (need theme) ──────────────────────────────────────────

function createStyles(theme: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.background.dark },

    // Header
    header:        { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, gap: 10 },
    backBtn:       { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
    progressWrap:  { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
    progressBg:    { flex: 1, height: 4, borderRadius: 2, overflow: "hidden" },
    progressFill:  { height: "100%", borderRadius: 2 },
    progressLabel: { fontSize: 11, fontFamily: FONTS.bold, minWidth: 30, textAlign: "right" },

    // Content
    contentArea: { flex: 1 },
    ctaWrap:     { paddingHorizontal: 20, paddingBottom: 20, paddingTop: 8 },

    // Common text
    title:    { fontSize: 24, fontFamily: FONTS.bold, color: theme.foreground.white, marginBottom: 6, marginTop: 4 },
    subtitle: { fontSize: 13, color: theme.foreground.gray, lineHeight: 20, marginBottom: 18 },
    label:    { fontSize: 13, fontFamily: FONTS.semiBold, color: theme.foreground.white, marginBottom: 8 },
    hint:     { fontSize: 12, color: theme.foreground.gray },

    // Input
    input: {
      backgroundColor: theme.background.darker,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 14,
      fontSize: 15,
      color: theme.foreground.white,
      borderWidth: 1.5,
      borderColor: theme.background.accent,
      fontFamily: FONTS.medium,
      marginBottom: 6,
    },

    // Cards
    radioCard:   { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderRadius: 14, padding: 14, marginBottom: 10 },
    cardTitle:   { fontSize: 15, fontFamily: FONTS.bold, marginBottom: 2 },
    cardDesc:    { fontSize: 12 },
    radio:       { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: "center", justifyContent: "center" },
    weeklyBadge: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 12 },
    check:       { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },

    // Habits chips
    chipGrid:       { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    habitChip:      { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1.5, borderRadius: 999, paddingVertical: 9, paddingHorizontal: 14 },
    habitChipLabel: { fontSize: 13, fontFamily: FONTS.semiBold },

    // Gender
    genderRow:  { flexDirection: "row", gap: 14, marginTop: 8 },
    genderCard: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 28, borderWidth: 1.5, borderRadius: 16, gap: 10 },
    genderLabel:{ fontSize: 15, fontFamily: FONTS.bold },
    genderCheck:{ position: "absolute", top: 10, right: 10, width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },

    // Ruler pickers
    pickerWrap: { flex: 1, justifyContent: "center", alignItems: "center" },

    // Account
    passwordRow: { position: "relative", justifyContent: "center", marginBottom: 14 },
    eyeBtn:      { position: "absolute", right: 12, top: 0, bottom: 0, justifyContent: "center", paddingHorizontal: 4 },
    agreeRow:    { flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: 4, paddingVertical: 4 },
    checkbox:    { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: "center", justifyContent: "center", marginTop: 2 },
    agreeText:   { flex: 1, fontSize: 13, lineHeight: 19 },
  });
}
