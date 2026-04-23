import React from "react";
import { useTranslation } from "react-i18next";
import CelebrationScreen from "../../components/ui/CelebrationScreen";

export default function MealCongrats() {
  const { t, i18n } = useTranslation();
  const isFr = i18n.language?.startsWith("fr");
  const headline = t("onboarding.mealCongrats.headline");
  const message = t("onboarding.mealCongrats.message");

  return (
    <CelebrationScreen
      gifSource={require("../../../assets/checkmark.gif")}
      headline={
        headline === "onboarding.mealCongrats.headline"
          ? isFr
            ? "Nous avons un plan solide pour vous"
            : "We have a solid system for you"
          : headline
      }
      message={
        message === "onboarding.mealCongrats.message"
          ? isFr
            ? "Encore quelques questions pour ajuster votre programme parfaitement."
            : "Just a few more questions so we can dial in your plan perfectly."
          : message
      }
      buttonLabel={t("common.next")}
      next="/get-started/activity-level"
    />
  );
}
