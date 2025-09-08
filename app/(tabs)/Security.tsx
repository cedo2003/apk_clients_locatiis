import { MaterialIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../ThemeContext";

export default function Security() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleToggle2FA = () => {
    setTwoFAEnabled(!twoFAEnabled);
    Alert.alert(
      "Authentification à 2 facteurs",
      twoFAEnabled ? "2FA désactivée" : "2FA activée"
    );
  };

  const handleLogoutAll = () => {
    Alert.alert(
      "Déconnexion sur tous les appareils",
      "Toutes les sessions seront terminées."
    );
  };

  const handleHistory = () => {
    Alert.alert(
      "Historique des connexions",
      "Fonctionnalité en cours d'implémentation."
    );
  };

  const handleChangePassword = () => {
    setModalVisible(true);
  };

  const handleSavePassword = () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(
        "Erreur",
        "Le nouveau mot de passe et la confirmation ne correspondent pas."
      );
      return;
    }

    Alert.alert("Succès", "Votre mot de passe a été changé !");
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setModalVisible(false);
  };

  const renderOption = (
    icon: string,
    title: string,
    action: any,
    extra?: any
  ) => (
    <TouchableOpacity
      style={[styles.option, { backgroundColor: isDark ? "#222" : "#f2f2f2" }]}
      onPress={action}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <MaterialIcons
          name={icon}
          size={26}
          color={isDark ? "green" : "green"}
        />
        <Text style={[styles.optionText, { color: isDark ? "#fff" : "#000" }]}>
          {title}
        </Text>
      </View>
      {extra}
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? "#111" : "#fff" }]}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {renderOption("lock", "Changer le mot de passe", handleChangePassword)}

      {renderOption(
        "security",
        twoFAEnabled ? "Désactiver l’A2F" : "Activer l’A2F",
        handleToggle2FA,
        <Switch
          value={twoFAEnabled}
          onValueChange={handleToggle2FA}
          trackColor={{ false: "#ccc", true: "green" }}
          thumbColor={twoFAEnabled ? "#fff" : "#f4f3f4"}
        />
      )}

      {renderOption(
        "history",
        "Historique des connexions récentes",
        handleHistory
      )}
      {renderOption(
        "logout",
        "Déconnexion sur tous les appareils",
        handleLogoutAll
      )}

      {/* Modal pour changer mot de passe */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: isDark ? "#222" : "#fff" },
            ]}
          >
            <Text
              style={[styles.modalTitle, { color: isDark ? "#fff" : "#000" }]}
            >
              Changer le mot de passe
            </Text>

            <TextInput
              placeholder="Ancien mot de passe"
              placeholderTextColor={isDark ? "#888" : "#666"}
              secureTextEntry
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? "#333" : "#f2f2f2",
                  color: isDark ? "#fff" : "#000",
                },
              ]}
              value={oldPassword}
              onChangeText={setOldPassword}
            />
            <TextInput
              placeholder="Nouveau mot de passe"
              placeholderTextColor={isDark ? "#888" : "#666"}
              secureTextEntry
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? "#333" : "#f2f2f2",
                  color: isDark ? "#fff" : "#000",
                },
              ]}
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TextInput
              placeholder="Confirmer le nouveau mot de passe"
              placeholderTextColor={isDark ? "#888" : "#666"}
              secureTextEntry
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? "#333" : "#f2f2f2",
                  color: isDark ? "#fff" : "#000",
                },
              ]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: "green" }]}
                onPress={handleSavePassword}
              >
                <Text style={styles.saveText}>Sauvegarder</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.cancelBtn,
                  { backgroundColor: isDark ? "#555" : "#ccc" },
                ]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.saveText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 70 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 30 },
  option: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
  },
  optionText: { marginLeft: 15, fontSize: 16 },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 20 },
  input: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  saveBtn: {
    padding: 12,
    borderRadius: 10,
    width: "48%",
    alignItems: "center",
  },
  cancelBtn: {
    padding: 12,
    borderRadius: 10,
    width: "48%",
    alignItems: "center",
  },
  saveText: { color: "#fff", fontWeight: "bold" },
});
