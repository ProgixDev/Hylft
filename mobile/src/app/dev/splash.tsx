import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import SplashScreen from "../../components/ui/SplashScreen";
import { FONTS } from "../../constants/fonts";

export default function SplashPreviewScreen() {
  const [key, setKey] = useState(0);
  const [done, setDone] = useState(false);

  const replay = () => {
    setDone(false);
    setKey((k) => k + 1);
  };

  return (
    <View style={s.root}>
      <SplashScreen key={key} onAnimationComplete={() => setDone(true)} />
      {done && (
        <TouchableOpacity style={s.btn} onPress={replay} activeOpacity={0.75}>
          <Text style={s.btnText}>↺  Replay Splash</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
  },
  btn: {
    position: "absolute",
    bottom: 60,
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  btnText: {
    color: "#fff",
    fontFamily: FONTS.bold,
    fontSize: 16,
    letterSpacing: 0.5,
  },
});
