import React from "react";
import { useTranslation } from "react-i18next";
import CelebrationScreen from "../../components/ui/CelebrationScreen";

export default function HabitsCongrats() {
  const { t } = useTranslation();

  return (
    <CelebrationScreen
      gifSource={require("../../../assets/compass.gif")}
      badge={t("onboarding.habitsCongrats.badge")}
      headline={t("onboarding.habitsCongrats.headline")}
      message={t("onboarding.habitsCongrats.message")}
      buttonLabel={t("common.next")}
      next="/get-started/meal-planning"
    />
  );
}
