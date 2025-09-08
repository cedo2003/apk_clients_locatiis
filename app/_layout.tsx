import React, { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import RootNavigator from "./(tabs)";
import { AuthProvider } from "./AuthContext";
import { FavorisProvider } from "./FavorisContext";
import SplashLoader from "./SplashLoader";
import { ThemeProvider } from "./ThemeContext";

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <SplashLoader logo={require("../assets/images/Locatiis-Logo-1.png")} />
    );
  }

  return (
    <AuthProvider>
      <ThemeProvider>
        <FavorisProvider>
          <RootNavigator />
        </FavorisProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  text: {
    fontSize: 24,
    fontWeight: "bold",
  },
});
