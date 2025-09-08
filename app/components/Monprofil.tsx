import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../AuthContext";
import { useTheme } from "../ThemeContext";

export default function Monprofil() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { user, setUser } = useAuth();

  const [profile, setProfile] = useState({
    photo: "../../assets/images/profil.jpg",
    nom: "Cédric",
    prenom: "Léger",
    pseudo: "cedricdev",
    email: "cedric.leger@example.com",
    tel: "+229 66 77 88 99",
    naissance: "1995-08-10",
    sexe: "Masculin",
    adresse: "Bénin, Cotonou, Fidjrossè",
    nationalite: "Béninoise",
    etatCivil: "Célibataire",
    profession: "Développeur Fullstack",
    interets: "Immobilier, Sport, Santé",
  });

  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState("");

  const startEditing = (field: string, value: string) => {
    setEditingField(field);
    setTempValue(value);
  };

  const saveEditing = (field: string) => {
    setProfile({ ...profile, [field]: tempValue });
    setEditingField(null);
    setTempValue("");
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Suppression de compte",
      "Es-tu sûr de vouloir supprimer ton compte ? Cette action est irréversible.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => console.log("Compte supprimé"),
        },
      ]
    );
  };

  // 📸 Choisir une nouvelle photo
  const changePhoto = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(
        "Permission refusée",
        "Autorise l'accès à la galerie pour changer ta photo."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfile({ ...profile, photo: result.assets[0].uri });
    }
  };

  const renderRow = (
    icon: string,
    label: string,
    field: string,
    value: string
  ) => (
    <View style={styles.row}>
      <MaterialIcons name={icon as any} size={22} color="#28a745" />
      <View style={{ marginLeft: 10, flex: 1 }}>
        <Text style={[styles.label, { color: isDark ? "#aaa" : "#555" }]}>
          {label}
        </Text>
        {editingField === field ? (
          <TextInput
            style={[
              styles.input,
              { color: isDark ? "#fff" : "#000", borderBottomColor: "#28a745" },
            ]}
            value={tempValue}
            onChangeText={setTempValue}
            autoFocus
          />
        ) : (
          <Text style={[styles.value, { color: isDark ? "#fff" : "#000" }]}>
            {value}
          </Text>
        )}
      </View>
      <TouchableOpacity
        onPress={() =>
          editingField === field
            ? saveEditing(field)
            : startEditing(field, value)
        }
      >
        <MaterialIcons
          name={editingField === field ? "check" : "edit"}
          size={22}
          color={editingField === field ? "#28a745" : isDark ? "#aaa" : "#888"}
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: isDark ? "#111" : "#f5f5f5" },
      ]}
    >
      {/* Photo + Nom complet */}
      <View
        style={[styles.card, { backgroundColor: isDark ? "#222" : "#fff" }]}
      >
        <TouchableOpacity onPress={changePhoto}>
          <Image source={{ uri: profile.photo }} style={styles.avatar} />
          <View style={styles.cameraIcon}>
            <MaterialIcons name="photo-camera" size={20} color="#fff" />
          </View>
        </TouchableOpacity>
        <Text style={[styles.name, { color: isDark ? "#fff" : "#000" }]}>
          {user.nom} {user.prenom}
        </Text>
        <Text style={{ color: isDark ? "#aaa" : "#555", marginBottom: 10 }}>
          @{user.pseudo}
        </Text>
      </View>

      {/* Informations de base */}
      <View
        style={[styles.card, { backgroundColor: isDark ? "#222" : "#fff" }]}
      >
        <Text style={styles.sectionTitle}>Informations de base</Text>
        {renderRow("person", "Nom", "nom", user.nom)}
        {renderRow("person", "Prénom", "prenom", user.prenom)}
        {renderRow("email", "Email", "email", user.email)}
        {renderRow("phone", "Téléphone", "tel", user.tel)}
        {renderRow("cake", "Date de naissance", "naissance", user.naissance)}
        {renderRow("wc", "Sexe", "sexe", user.sexe)}
      </View>

      {/* Informations avancées */}
      <View
        style={[styles.card, { backgroundColor: isDark ? "#222" : "#fff" }]}
      >
        <Text style={styles.sectionTitle}>
          Informations personnelles avancées
        </Text>
        {renderRow("home", "Adresse complète", "adresse", user.adresse)}
        {renderRow("flag", "Nationalité", "nationalite", user.nationalite)}
        {renderRow("favorite", "État civil", "etatCivil", user.etatCivil)}
        {renderRow("work", "Profession", "profession", user.profession)}
        {renderRow(
          "sports-basketball",
          "Centres d’intérêt",
          "interets",
          user.interets
        )}
      </View>

      {/* Supprimer compte */}
      <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
        <MaterialIcons name="delete" size={22} color="#fff" />
        <Text style={styles.deleteText}>Supprimer mon compte</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, marginBottom: 20 },
  card: {
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    elevation: 4,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowColor: "#000",
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: "center",
    marginBottom: 10,
    borderWidth: 3,
    borderColor: "#28a745",
  },
  cameraIcon: {
    position: "absolute",
    bottom: 5,
    right: 120 / 2 - 20,
    backgroundColor: "#28a745",
    padding: 6,
    borderRadius: 20,
  },
  name: { fontSize: 22, fontWeight: "bold", textAlign: "center" },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#28a745",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    paddingVertical: 8,
  },
  label: { fontSize: 14 },
  value: { fontSize: 16, fontWeight: "600" },
  input: {
    fontSize: 16,
    borderBottomWidth: 1,
    paddingVertical: 2,
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "red",
    padding: 15,
    borderRadius: 12,
    marginBottom: 30,
  },
  deleteText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },
});
