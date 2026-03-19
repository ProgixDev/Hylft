import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Theme, ThemeType } from "../../constants/themes";
import { useAuth } from "../../contexts/AuthContext";
import { useI18n } from "../../contexts/I18nContext";
import { useTheme } from "../../contexts/ThemeContext";

import { FONTS } from "../../constants/fonts";

// ─── Storage keys ─────────────────────────────────────────────────────────────
const KEYS = {
  weightUnit: "@hylift_weight_unit",
  distanceUnit: "@hylift_distance_unit",
  weekStart: "@hylift_week_start",
  pushNotifications: "@hylift_push_notif",
  workoutReminders: "@hylift_workout_reminder",
  emailNotifications: "@hylift_email_notif",
  privateAccount: "@hylift_private_account",
  healthConnect: "@hylift_health_connect",
};

// ─── Styles ───────────────────────────────────────────────────────────────────
function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background.dark,
    },
    // header
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.background.accent,
    },
    backBtn: {
      padding: 4,
      marginRight: 6,
    },
    headerTitle: {
      fontSize: 17,
      fontFamily: FONTS.bold,
      color: theme.foreground.white,
    },
    // section
    sectionHeader: {
      paddingHorizontal: 16,
      paddingTop: 18,
      paddingBottom: 6,
    },
    sectionLabel: {
      fontSize: 11,
      fontFamily: FONTS.semiBold,
      letterSpacing: 0.8,
      textTransform: "uppercase",
      color: theme.foreground.gray,
    },
    sectionBody: {
      backgroundColor: theme.background.accent,
      marginHorizontal: 16,
      borderRadius: 10,
      overflow: "hidden",
    },
    // row
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    rowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: theme.background.darker,
    },
    rowIcon: {
      width: 28,
      height: 28,
      borderRadius: 7,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 10,
    },
    rowContent: {
      flex: 1,
    },
    rowTitle: {
      fontSize: 14,
      fontFamily: FONTS.medium,
      color: theme.foreground.white,
    },
    rowSubtitle: {
      fontSize: 11,
      color: theme.foreground.gray,
      marginTop: 1,
    },
    rowRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    rowValue: {
      fontSize: 13,
      color: theme.foreground.gray,
    },
    // segmented control
    segmented: {
      flexDirection: "row",
      backgroundColor: theme.background.darker,
      borderRadius: 7,
      padding: 2,
      gap: 2,
    },
    segBtn: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 5,
    },
    segBtnActive: {
      backgroundColor: theme.primary.main,
    },
    segBtnText: {
      fontSize: 12,
      fontFamily: FONTS.semiBold,
      color: theme.foreground.gray,
    },
    segBtnTextActive: {
      color: theme.background.dark,
    },
    // danger
    dangerSection: {
      backgroundColor: theme.background.accent,
      marginHorizontal: 16,
      borderRadius: 10,
      overflow: "hidden",
    },
    dangerRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    dangerText: {
      fontSize: 14,
      fontFamily: FONTS.semiBold,
      marginLeft: 10,
    },
    // version
    version: {
      textAlign: "center",
      fontSize: 11,
      color: theme.foreground.gray,
      marginTop: 18,
      marginBottom: 12,
    },
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface RowProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  showBorder?: boolean;
  showChevron?: boolean;
  styles: ReturnType<typeof createStyles>;
  theme: Theme;
}

function SettingsRow({
  icon,
  iconBg,
  title,
  subtitle,
  right,
  onPress,
  showBorder = true,
  showChevron = false,
  styles,
  theme,
}: RowProps) {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper
      style={[styles.row, showBorder && styles.rowBorder]}
      {...(onPress ? { onPress, activeOpacity: 0.7 } : {})}
    >
      <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={15} color={theme.foreground.white} />
      </View>
      <View style={styles.rowContent}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      {right ? (
        <View style={styles.rowRight}>{right}</View>
      ) : showChevron ? (
        <Ionicons
          name="chevron-forward"
          size={16}
          color={theme.foreground.gray}
        />
      ) : null}
    </Wrapper>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function Settings() {
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const { language, setLanguage } = useI18n();
  const router = useRouter();
  const { theme, themeType, setTheme } = useTheme();
  const styles = createStyles(theme);

  // ── Preferences state ────────────────────────────────────────────────────────
  const [weightUnit, setWeightUnit] = useState<"kg" | "lbs">("kg");
  const [distanceUnit, setDistanceUnit] = useState<"km" | "mi">("km");
  const [weekStart, setWeekStart] = useState<"mon" | "sun">("mon");
  const [pushNotifs, setPushNotifs] = useState(true);
  const [workoutReminders, setWorkoutReminders] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(false);
  const [privateAccount, setPrivateAccount] = useState(false);
  const [healthConnect, setHealthConnect] = useState(false);

  // ── Load from storage ─────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [wu, du, ws, pn, wr, en, pa, hc] = await Promise.all([
          AsyncStorage.getItem(KEYS.weightUnit),
          AsyncStorage.getItem(KEYS.distanceUnit),
          AsyncStorage.getItem(KEYS.weekStart),
          AsyncStorage.getItem(KEYS.pushNotifications),
          AsyncStorage.getItem(KEYS.workoutReminders),
          AsyncStorage.getItem(KEYS.emailNotifications),
          AsyncStorage.getItem(KEYS.privateAccount),
          AsyncStorage.getItem(KEYS.healthConnect),
        ]);
        if (wu === "kg" || wu === "lbs") setWeightUnit(wu);
        if (du === "km" || du === "mi") setDistanceUnit(du);
        if (ws === "mon" || ws === "sun") setWeekStart(ws);
        if (pn !== null) setPushNotifs(pn === "true");
        if (wr !== null) setWorkoutReminders(wr === "true");
        if (en !== null) setEmailNotifs(en === "true");
        if (pa !== null) setPrivateAccount(pa === "true");
        if (hc !== null) setHealthConnect(hc === "true");
      } catch (_) {} // eslint-disable-line @typescript-eslint/no-unused-vars
    };
    load();
  }, []);

  // ── Persist helpers ───────────────────────────────────────────────────────────
  const save = async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (_) {} // eslint-disable-line @typescript-eslint/no-unused-vars
  };

  const togglePush = (v: boolean) => {
    setPushNotifs(v);
    save(KEYS.pushNotifications, String(v));
  };
  const toggleReminders = (v: boolean) => {
    setWorkoutReminders(v);
    save(KEYS.workoutReminders, String(v));
  };
  const toggleEmail = (v: boolean) => {
    setEmailNotifs(v);
    save(KEYS.emailNotifications, String(v));
  };
  const togglePrivate = (v: boolean) => {
    setPrivateAccount(v);
    save(KEYS.privateAccount, String(v));
  };
  const toggleHealth = (v: boolean) => {
    setHealthConnect(v);
    save(KEYS.healthConnect, String(v));
  };
  const changeWeightUnit = (v: "kg" | "lbs") => {
    setWeightUnit(v);
    save(KEYS.weightUnit, v);
  };
  const changeDistanceUnit = (v: "km" | "mi") => {
    setDistanceUnit(v);
    save(KEYS.distanceUnit, v);
  };
  const changeWeekStart = (v: "mon" | "sun") => {
    setWeekStart(v);
    save(KEYS.weekStart, v);
  };

  const handleTheme = (t: ThemeType) => {
    setTheme(t);
  };

  const handleLogout = () => {
    Alert.alert(t("settings.logOut"), t("settings.logOutConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("settings.logOut"),
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/auth" as any);
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t("settings.deleteAccount"),
      t("settings.deleteAccountConfirm"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: () => {
            // TODO: call delete account API
          },
        },
      ],
    );
  };

  // ─── Segmented helper ──────────────────────────────────────────────────────

  function Seg<T extends string>({
    options,
    value,
    onChange,
  }: {
    options: { label: string; value: T }[];
    value: T;
    onChange: (v: T) => void;
  }) {
    return (
      <View style={styles.segmented}>
        {options.map((o) => (
          <TouchableOpacity
            key={o.value}
            style={[styles.segBtn, value === o.value && styles.segBtnActive]}
            onPress={() => onChange(o.value)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.segBtnText,
                value === o.value && styles.segBtnTextActive,
              ]}
            >
              {o.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  const switchThumb = theme.primary.main;
  const switchTrackOn = theme.primary.light + "88";

  // ─── JSX ──────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons
            name="chevron-back"
            size={26}
            color={theme.foreground.white}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("settings.title")}</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* ── ACCOUNT ────────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>{t("settings.account")}</Text>
        </View>
        <View style={styles.sectionBody}>
          <SettingsRow
            icon="person-outline"
            iconBg="#dbeafe"
            title={t("settings.editProfile")}
            subtitle={t("settings.changeProfileSubtitle")}
            showBorder
            showChevron
            onPress={() => router.push("/settings/edit-profile" as any)}
            styles={styles}
            theme={theme}
          />
          <SettingsRow
            icon="lock-closed-outline"
            iconBg="#ede9fe"
            title={t("settings.changePassword")}
            subtitle={t("settings.changePasswordSubtitle")}
            showBorder
            showChevron
            onPress={() => router.push("/settings/change-password" as any)}
            styles={styles}
            theme={theme}
          />
          <SettingsRow
            icon="eye-off-outline"
            iconBg="#ccfbf1"
            title={t("settings.privateAccount")}
            subtitle={t("settings.privateAccountSubtitle")}
            showBorder={false}
            right={
              <Switch
                value={privateAccount}
                onValueChange={togglePrivate}
                thumbColor={switchThumb}
                trackColor={{ false: "#3a3a3a", true: switchTrackOn }}
              />
            }
            styles={styles}
            theme={theme}
          />
        </View>

        {/* ── APPEARANCE ─────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>{t("settings.appearance")}</Text>
        </View>
        <View style={styles.sectionBody}>
          <SettingsRow
            icon="color-palette-outline"
            iconBg="#ecfccb"
            title={t("settings.theme")}
            subtitle={themeType === "male" ? t("settings.themeMale") : t("settings.themeFemale")}
            showBorder
            right={
              <Seg
                options={[
                  { label: t("settings.male"), value: "male" },
                  { label: t("settings.female"), value: "female" },
                ]}
                value={themeType}
                onChange={(v) => handleTheme(v as ThemeType)}
              />
            }
            styles={styles}
            theme={theme}
          />
          <SettingsRow
            icon="language-outline"
            iconBg="#fef3c7"
            title={t("settings.language")}
            subtitle={t("settings.languageSubtitle")}
            showBorder={false}
            right={
              <Seg
                options={[
                  { label: "English", value: "en" },
                  { label: "Français", value: "fr" },
                ]}
                value={language}
                onChange={(v) => setLanguage(v as "en" | "fr")}
              />
            }
            styles={styles}
            theme={theme}
          />
        </View>

        {/* ── PREFERENCES ────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>{t("settings.preferences")}</Text>
        </View>
        <View style={styles.sectionBody}>
          <SettingsRow
            icon="scale-outline"
            iconBg="#fef3c7"
            title={t("settings.weightUnit")}
            showBorder
            right={
              <Seg
                options={[
                  { label: "kg", value: "kg" },
                  { label: "lbs", value: "lbs" },
                ]}
                value={weightUnit}
                onChange={changeWeightUnit}
              />
            }
            styles={styles}
            theme={theme}
          />
          <SettingsRow
            icon="navigate-outline"
            iconBg="#e0f2fe"
            title={t("settings.distanceUnit")}
            showBorder
            right={
              <Seg
                options={[
                  { label: "km", value: "km" },
                  { label: "mi", value: "mi" },
                ]}
                value={distanceUnit}
                onChange={changeDistanceUnit}
              />
            }
            styles={styles}
            theme={theme}
          />
          <SettingsRow
            icon="calendar-outline"
            iconBg="#d1fae5"
            title={t("settings.firstDayOfWeek")}
            showBorder={false}
            right={
              <Seg
                options={[
                  { label: "Mon", value: "mon" },
                  { label: "Sun", value: "sun" },
                ]}
                value={weekStart}
                onChange={changeWeekStart}
              />
            }
            styles={styles}
            theme={theme}
          />
        </View>

        {/* ── NOTIFICATIONS ───────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>{t("settings.notifications")}</Text>
        </View>
        <View style={styles.sectionBody}>
          <SettingsRow
            icon="notifications-outline"
            iconBg="#fce7f3"
            title={t("settings.pushNotifications")}
            subtitle={t("settings.pushNotificationsSubtitle")}
            showBorder
            right={
              <Switch
                value={pushNotifs}
                onValueChange={togglePush}
                thumbColor={switchThumb}
                trackColor={{ false: "#3a3a3a", true: switchTrackOn }}
              />
            }
            styles={styles}
            theme={theme}
          />
          <SettingsRow
            icon="alarm-outline"
            iconBg="#ecfccb"
            title={t("settings.workoutReminders")}
            subtitle={t("settings.workoutRemindersSubtitle")}
            showBorder
            right={
              <Switch
                value={workoutReminders}
                onValueChange={toggleReminders}
                thumbColor={switchThumb}
                trackColor={{ false: "#3a3a3a", true: switchTrackOn }}
              />
            }
            styles={styles}
            theme={theme}
          />
          <SettingsRow
            icon="mail-outline"
            iconBg="#e0f2fe"
            title={t("settings.emailNotifications")}
            subtitle={t("settings.emailNotificationsSubtitle")}
            showBorder={false}
            right={
              <Switch
                value={emailNotifs}
                onValueChange={toggleEmail}
                thumbColor={switchThumb}
                trackColor={{ false: "#3a3a3a", true: switchTrackOn }}
              />
            }
            styles={styles}
            theme={theme}
          />
        </View>

        {/* ── CONNECTED APPS ───────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>{t("settings.connectedApps")}</Text>
        </View>
        <View style={styles.sectionBody}>
          <SettingsRow
            icon="heart-outline"
            iconBg="#fee2e2"
            title={t("settings.healthConnect")}
            subtitle={t("settings.healthConnectSubtitle")}
            showBorder={false}
            right={
              <Switch
                value={healthConnect}
                onValueChange={toggleHealth}
                thumbColor={switchThumb}
                trackColor={{ false: "#3a3a3a", true: switchTrackOn }}
              />
            }
            styles={styles}
            theme={theme}
          />
        </View>

        {/* ── SUPPORT ─────────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>{t("settings.support")}</Text>
        </View>
        <View style={styles.sectionBody}>
          <SettingsRow
            icon="help-circle-outline"
            iconBg="#dbeafe"
            title={t("settings.helpCenter")}
            showBorder
            showChevron
            onPress={() => router.push("/settings/help-center" as any)}
            styles={styles}
            theme={theme}
          />
          <SettingsRow
            icon="star-outline"
            iconBg="#fef9c3"
            title={t("settings.rateHylift")}
            subtitle={t("settings.rateHyliftSubtitle")}
            showBorder
            showChevron
            onPress={() => {}}
            styles={styles}
            theme={theme}
          />
          <SettingsRow
            icon="information-circle-outline"
            iconBg="#e8e0f0"
            title={t("settings.aboutHylift")}
            subtitle={t("settings.version")}
            showBorder
            showChevron
            onPress={() => router.push("/settings/about" as any)}
            styles={styles}
            theme={theme}
          />
          <SettingsRow
            icon="document-text-outline"
            iconBg="#ccfbf1"
            title={t("settings.termsOfService")}
            showBorder
            showChevron
            onPress={() => router.push("/settings/terms" as any)}
            styles={styles}
            theme={theme}
          />
          <SettingsRow
            icon="shield-checkmark-outline"
            iconBg="#f3e8ff"
            title={t("settings.privacyPolicy")}
            showBorder={false}
            showChevron
            onPress={() => router.push("/settings/privacy" as any)}
            styles={styles}
            theme={theme}
          />
        </View>

        {/* ── DANGER ZONE ─────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionLabel, { color: "#f87171" }]}>
            {t("settings.accountActions")}
          </Text>
        </View>
        <View style={styles.dangerSection}>
          <TouchableOpacity
            style={[styles.dangerRow, styles.rowBorder]}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={20} color="#f87171" />
            <Text style={[styles.dangerText, { color: "#f87171" }]}>
              {t("settings.logOut")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dangerRow}
            onPress={handleDeleteAccount}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
            <Text style={[styles.dangerText, { color: "#ef4444" }]}>
              {t("settings.deleteAccount")}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>Hylift v1.0.0 · Built with ♥</Text>
      </ScrollView>
    </View>
  );
}
