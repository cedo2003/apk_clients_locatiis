import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../ThemeContext"; // Assure-toi que le chemin est correct

export default function Favoris() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <View
      style={[styles.container, { backgroundColor: isDark ? "#000" : "#fff" }]}
    >
      <Text style={[styles.text, { color: isDark ? "#fff" : "#000" }]}>
        Aucun bien en Favoris
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: { fontSize: 24, fontWeight: "bold" },
});
