import React from "react";
import CelebrationScreen from "../../components/ui/CelebrationScreen";

export default function HabitsCongrats() {
  return (
    <CelebrationScreen
      gifSource={require("../../../assets/compass.gif")}
      badge="Your Journey"
      headline="We've got you covered"
      message="No problem — we'll be your guide, every step of the way."
      buttonLabel="Next"
      next="/get-started/meal-planning"
    />
  );
}
