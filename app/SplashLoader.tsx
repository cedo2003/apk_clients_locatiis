import React, { useEffect, useRef } from "react";
import { Animated, Easing, Image, StyleSheet, View } from "react-native";

interface SplashLoaderProps {
  logo: any;
}

export default function SplashLoader({ logo }: SplashLoaderProps) {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.splashContainer}>
      <Animated.View
        style={[styles.circle, { transform: [{ rotate: rotation }] }]}
      />
      <Image source={logo} style={styles.logo} />
    </View>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  logo: {
    width: 200,
    height: 200,
    resizeMode: "contain",
    position: "absolute",
  },
  circle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 4,
    borderColor: "green",
    borderTopColor: "transparent",
    position: "absolute",
  },
});
