import { MaterialIcons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, TouchableOpacity, View } from "react-native";

import { useAuth } from "../../contexts/AuthContext";
import Login from "../components/Login";
import Monprofil from "../components/Monprofil";
import Register from "../components/Signup";
import { useTheme } from "../ThemeContext";
import Acceuil from "./acceuil";
import Aide from "./Aide";
import Confidentialite from "./Confidentialite";
import Favoris from "./favoris";
import Incidents from "./incidents";
import MesBiens from "./mesbiens";
import Notifications from "./notifications";
import SettingsScreen from "./parametres";
import Security from "./Security";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const icons = {
  Accueil: "dashboard",
  Profil: "person-outline",
  Paramètres: "settings",
  Favoris: "favorite-outline",
  Biens: "home",
};

function Tabs() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const borderAnim = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();
  const { user } = useAuth();

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(borderAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: false,
        }),
        Animated.timing(borderAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [borderAnim]);

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["transparent", "white"],
  });

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: true,
          headerStyle: { backgroundColor: "green" },
          headerTintColor: "#fff",
          headerRight: () => (
            <View style={{ flexDirection: "row", marginRight: 10 }}>
              {user ? (
                <TouchableOpacity
                  onPress={() => navigation.navigate("Notifications")}
                >
                  <MaterialIcons name="notifications" size={30} color="#fff" />
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity
                    onPress={() => navigation.navigate("Signup")}
                    style={{ marginRight: 30 }}
                  >
                    <MaterialIcons name="person-add" size={30} color="#fff" />
                  </TouchableOpacity>

                  <Animated.View
                    style={{
                      borderWidth: 2,
                      borderColor: borderColor,
                      borderRadius: 8,
                      padding: 2,
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => navigation.navigate("Login")}
                    >
                      <MaterialIcons name="login" size={30} color="#fff" />
                    </TouchableOpacity>
                  </Animated.View>
                </>
              )}
            </View>
          ),
          tabBarStyle: {
            backgroundColor: isDark ? "green" : "#E0DDDDFF",
            borderTopWidth: 3,
            height: 90,
          },
          tabBarLabelStyle: {
            fontSize: 13,
            fontWeight: "bold",
            marginBottom: 8,
          },
          tabBarIcon: ({ color }) => {
            const iconName = icons[route.name] || "home";
            return <MaterialIcons name={iconName} size={30} color={color} />;
          },
          tabBarActiveTintColor: isDark ? "white" : "green",
          tabBarInactiveTintColor: "black",
        })}
      >
        <Tab.Screen name="Accueil" component={Acceuil} />
        {user && <Tab.Screen name="Mes Biens" component={MesBiens} />}
        {user && <Tab.Screen name="Favoris" component={Favoris} />}
        <Tab.Screen name="Paramètres" component={SettingsScreen} />
      </Tab.Navigator>

      {user && (
        <TouchableOpacity
          onPress={() => navigation.navigate("Incidents")}
          style={styles.fab}
        >
          <MaterialIcons name="report-problem" size={28} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function AppTabs() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "green" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "bold" },
      }}
    >
      <Stack.Screen
        name="Retour"
        component={Tabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Login"
        component={Login}
        options={{ title: "CONNEXION" }}
      />
      <Stack.Screen
        name="Signup"
        component={Register}
        options={{ title: "INSCRIPTION" }}
      />
      <Stack.Screen
        name="AppTabs"
        component={AppTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Notifications"
        component={Notifications}
        options={{ title: "Notifications" }}
      />
      <Stack.Screen
        name="Incidents"
        component={Incidents}
        options={{ title: "Incidents" }}
      />
      <Stack.Screen
        name="Monprofil"
        component={Monprofil}
        options={{ title: "Mon Profil" }}
      />
      <Stack.Screen
        name="Security"
        component={Security}
        options={{ title: "Sécurité du Compte" }}
      />
      <Stack.Screen
        name="Confidentialite"
        component={Confidentialite}
        options={{ title: "Confidentialité" }}
      />
      <Stack.Screen
        name="Aide"
        component={Aide}
        options={{ title: "Aide et Assistance" }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 100,
    right: 20,
    backgroundColor: "red",
    padding: 16,
    borderRadius: 50,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
  },
});
