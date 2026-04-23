import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import CelebrationScreen from "../../components/ui/CelebrationScreen";

export default function GoalCongrats() {
  const [name, setName] = useState("");
  const { t } = useTranslation();

  useEffect(() => {
    AsyncStorage.getItem("@hylift_username").then((v) => {
      if (v) setName(v);
    });
  }, []);

  return (
    <CelebrationScreen
      gifSource={require("../../../assets/trophy.gif")}
      headline={
        name
          ? t("onboarding.goalCongrats.headlineWithName", { name })
          : t("onboarding.goalCongrats.headlineDefault")
      }
      message={t("onboarding.goalCongrats.message")}
      buttonLabel={t("common.next")}
      next="/get-started/habits"
    />
  );
}
