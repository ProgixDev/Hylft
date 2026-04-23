import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CelebrationScreen from "../../components/ui/CelebrationScreen";

export default function GoalCongrats() {
  const [name, setName] = useState("");

  useEffect(() => {
    AsyncStorage.getItem("@hylift_username").then((v) => {
      if (v) setName(v);
    });
  }, []);

  return (
    <CelebrationScreen
      gifSource={require("../../../assets/trophy.gif")}
      badge="Goal Set"
      headline={name ? `Great, ${name}!` : "Great choice!"}
      message="You've just taken a big step on your journey. Let's keep the momentum going."
      buttonLabel="Next"
      next="/get-started/habits"
    />
  );
}
