import { useTheme } from "../contexts/ThemeContext";

// Male images (default)
const maleImages = {
  challenge: [
    require("../../assets/images/OnBoarding/ManWithTwoWeights.jpg"),
    require("../../assets/images/AuthPage/PullUp.jpg"),
    require("../../assets/images/AuthPage/HoldingTwoWeights.jpg"),
  ],
  bodyFocus: [
    require("../../assets/images/AuthPage/DeadLiftIGuess.jpg"),
    require("../../assets/images/OnBoarding/ManWithOneWeights.jpg"),
    require("../../assets/images/AuthPage/OneKneeOnTheGround.jpg"),
    require("../../assets/images/AuthPage/PullUp.jpg"),
  ],
  routine: [
    require("../../assets/images/AuthPage/PullUp.jpg"),
    require("../../assets/images/OnBoarding/ManWithTwoWeights.jpg"),
    require("../../assets/images/AuthPage/HoldingTwoWeights.jpg"),
    require("../../assets/images/OnBoarding/ManWithOneWeights.jpg"),
    require("../../assets/images/AuthPage/DeadLiftIGuess.jpg"),
    require("../../assets/images/OnBoarding/ManLookingUp.jpg"),
  ],
  health: {
    calories: require("../../assets/images/health/calories.jpg"),
    steps: require("../../assets/images/health/steps.jpg"),
    food: require("../../assets/images/health/food.jpg"),
    activity: require("../../assets/images/health/activity.jpg"),
  },
  motivational: require("../../assets/images/OnBoarding/ManLookingUp.jpg"),
  nextWorkout: require("../../assets/images/AuthPage/HoldingTwoWeights.jpg"),
};

// Female images — women athletes from Unsplash (free license)
const femaleImages = {
  challenge: [
    require("../../assets/images/OnBoarding/female/ManWithTwoWeights.jpg"),
    require("../../assets/images/AuthPage/female/PullUp.jpg"),
    require("../../assets/images/AuthPage/female/HoldingTwoWeights.jpg"),
  ],
  bodyFocus: [
    require("../../assets/images/AuthPage/female/DeadLiftIGuess.jpg"),
    require("../../assets/images/OnBoarding/female/ManWithOneWeights.jpg"),
    require("../../assets/images/AuthPage/female/OneKneeOnTheGround.jpg"),
    require("../../assets/images/AuthPage/female/PullUp.jpg"),
  ],
  routine: [
    require("../../assets/images/AuthPage/female/PullUp.jpg"),
    require("../../assets/images/OnBoarding/female/ManWithTwoWeights.jpg"),
    require("../../assets/images/AuthPage/female/HoldingTwoWeights.jpg"),
    require("../../assets/images/OnBoarding/female/ManWithOneWeights.jpg"),
    require("../../assets/images/AuthPage/female/DeadLiftIGuess.jpg"),
    require("../../assets/images/OnBoarding/female/ManLookingUp.jpg"),
  ],
  health: {
    calories: require("../../assets/images/health/calories.jpg"),
    steps: require("../../assets/images/health/steps.jpg"),
    food: require("../../assets/images/health/food.jpg"),
    activity: require("../../assets/images/health/activity.jpg"),
  },
  motivational: require("../../assets/images/OnBoarding/female/ManLookingUp.jpg"),
  nextWorkout: require("../../assets/images/AuthPage/female/HoldingTwoWeights.jpg"),
};

export function useGenderedImages() {
  const { themeType } = useTheme();
  return themeType === "female" ? femaleImages : maleImages;
}

export function getGenderFromTheme(themeType: string): "male" | "female" {
  return themeType === "female" ? "female" : "male";
}
