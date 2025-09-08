import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useRef, useState } from "react";
import {
  Animated,
  LayoutAnimation,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { useAuth } from "../AuthContext";
import { useTheme } from "../ThemeContext";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function Parametres() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const { user, logout } = useAuth();
  const navigation = useNavigation();

  const [expanded, setExpanded] = useState(false);
  const [expandedAccount, setExpandedAccount] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const modalAnim = useRef(new Animated.Value(0)).current;

  const [emailsEnabled, setEmailsEnabled] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const toggleAccountExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedAccount(!expandedAccount);
  };

  const openModal = () => {
    setShowModal(true);
    Animated.timing(modalAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(modalAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setShowModal(false));
  };

  const handleLogout = () => {
    Animated.timing(modalAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowModal(false);

      logout();

      navigation.reset({
        index: 0,
        routes: [{ name: "AppTabs" as never }],
      });
    });
  };

  const modalScale = modalAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1],
  });

  const accountOptions = [
    {
      label: "Modifier mes informations personnelles",
      screen: "Monprofil",
    },
    { label: "Sécurité du compte", screen: "Security" },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? "#000" : "#fff" }]}
    >
      {/* Aide et assistance */}
      <TouchableOpacity
        onPress={() => navigation.navigate("Aide")}
        style={styles.accordionHeader}
      >
        <View style={styles.iconTextRow}>
          <MaterialIcons
            name="help-outline"
            size={24}
            color={isDark ? "white" : "green"}
          />
          <Text
            style={[styles.accordionTitle, { color: isDark ? "#fff" : "#000" }]}
          >
            Aide et assistance
          </Text>
        </View>
      </TouchableOpacity>
      <View style={styles.separator} />

      {/* Paramètres application */}
      {/*
        <TouchableOpacity onPress={toggleExpand} style={styles.accordionHeader}>
          <View style={styles.iconTextRow}>
            <MaterialIcons
              name="settings"
              size={24}
              color={isDark ? "white" : "green"}
            />
            <Text
              style={[styles.accordionTitle, { color: isDark ? "#fff" : "#000" }]}
            >
              Paramètres application
            </Text>
          </View>
          <MaterialIcons
            name={expanded ? "keyboard-arrow-up" : "keyboard-arrow-down"}
            size={24}
            color={isDark ? "#fff" : "#000"}
          />
        </TouchableOpacity>
      */}

      {expanded && (
        <View
          style={[
            styles.accordionContent,
            {
              flexDirection: "row",
              justifyContent: "space-between",
              backgroundColor: isDark ? "#222" : "#f2f2f2",
              borderRadius: 8,
              padding: 12,
            },
          ]}
        >
          <Text style={[styles.label, { color: isDark ? "#fff" : "#000" }]}>
            {isDark ? "Désactiver mode sombre" : "Activer mode sombre"}
          </Text>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: "#545252FF", true: "white" }}
            thumbColor={isDark ? "green" : "green"}
          />
        </View>
      )}

      {/* Paramètres du compte si connecté */}
      {user && (
        <>
          <View style={styles.separator} />
          <TouchableOpacity
            onPress={toggleAccountExpand}
            style={styles.accordionHeader}
          >
            <View style={styles.iconTextRow}>
              <MaterialIcons
                name="account-circle"
                size={24}
                color={isDark ? "white" : "green"}
              />
              <Text
                style={[
                  styles.accordionTitle,
                  { color: isDark ? "#fff" : "#000" },
                ]}
              >
                Paramètres du compte
              </Text>
            </View>
            <MaterialIcons
              name={
                expandedAccount ? "keyboard-arrow-up" : "keyboard-arrow-down"
              }
              size={24}
              color={isDark ? "#fff" : "#000"}
            />
          </TouchableOpacity>

          {expandedAccount && (
            <View style={{ marginTop: 8 }}>
              {accountOptions.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.accountOption,
                    { backgroundColor: isDark ? "#333" : "#e0e0e0" },
                  ]}
                  onPress={() => navigation.navigate(option.screen as never)}
                >
                  <Text
                    style={{ color: isDark ? "#fff" : "#000", fontSize: 16 }}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}

              {/* ✅ Nouvelle option : switch emails */}
              <View
                style={[
                  styles.accordionContent,
                  {
                    flexDirection: "row",
                    justifyContent: "space-between",
                    backgroundColor: isDark ? "#222" : "#f2f2f2",
                    borderRadius: 8,
                    padding: 12,
                    marginTop: 8,
                  },
                ]}
              >
                <Text
                  style={[styles.label, { color: isDark ? "#fff" : "#000" }]}
                >
                  {emailsEnabled
                    ? "Ne pas Recevoir les emails de publication"
                    : "Recevoir les emails de publication"}
                </Text>
                <Switch
                  value={emailsEnabled}
                  onValueChange={(val) => setEmailsEnabled(val)}
                  trackColor={{ false: "#545252FF", true: "white" }}
                  thumbColor={emailsEnabled ? "green" : "gray"}
                />
              </View>
            </View>
          )}
        </>
      )}

      <View style={styles.separator} />

      {/* Centre de confidentialité */}
      <TouchableOpacity
        onPress={() => navigation.navigate("Confidentialite")}
        style={styles.accordionHeader}
      >
        <View style={styles.iconTextRow}>
          <MaterialIcons
            name="lock-outline"
            size={24}
            color={isDark ? "white" : "green"}
          />
          <Text
            style={[styles.accordionTitle, { color: isDark ? "#fff" : "#000" }]}
          >
            Centre de confidentialité
          </Text>
        </View>
      </TouchableOpacity>

      {/* Bouton de déconnexion */}
      {user && (
        <>
          <View style={styles.separator} />
          <TouchableOpacity onPress={openModal} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Déconnexion</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Modal de confirmation */}
      <Modal transparent visible={showModal} animationType="none">
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContent,
              { transform: [{ scale: modalScale }] },
            ]}
          >
            <Text style={styles.modalTitle}>Se déconnecter ?</Text>
            <Text style={styles.modalMessage}>
              Êtes-vous sûr de vouloir vous déconnecter ?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={handleLogout}
                style={[styles.modalBtn, { backgroundColor: "red" }]}
              >
                <Text style={styles.modalBtnText}>Oui</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={closeModal}
                style={[styles.modalBtn, { backgroundColor: "gray" }]}
              >
                <Text style={styles.modalBtnText}>Non</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  accordionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  iconTextRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  accordionTitle: { fontSize: 18, fontWeight: "bold" },
  accordionContent: {
    marginTop: 4,
  },
  label: { fontSize: 16 },
  separator: { height: 1, backgroundColor: "#ccc", marginVertical: 8 },
  logoutButton: {
    backgroundColor: "red",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 50,
  },
  logoutText: { color: "white", fontWeight: "bold", fontSize: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    width: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  modalMessage: { fontSize: 16, marginBottom: 20, textAlign: "center" },
  modalButtons: { flexDirection: "row", justifyContent: "space-around" },
  modalBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  modalBtnText: { color: "white", fontWeight: "bold", fontSize: 16 },
  accountOption: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    width: "100%",
  },
});
