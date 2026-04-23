import React from "react";
import CelebrationScreen from "../../components/ui/CelebrationScreen";

export default function MealCongrats() {
  return (
    <CelebrationScreen
      gifSource={require("../../../assets/checkmark.gif")}
      badge="Plan Ready"
      headline="We have a solid system for you"
      message="Just a few more questions so we can dial in your plan perfectly."
      buttonLabel="Next"
      next="/get-started/activity-level"
    />
  );
}
