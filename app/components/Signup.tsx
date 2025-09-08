import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import CountryPicker, { CountryCode } from "react-native-country-picker-modal";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agree, setAgree] = useState(false);

  const [countryCode, setCountryCode] = useState<CountryCode>("BJ");
  const [callingCode, setCallingCode] = useState("229");
  const [phoneNumber, setPhoneNumber] = useState("");

  const handleGoogleLogin = () => {
    Alert.alert("Google Login", "Connexion avec Google !");
  };

  const handleRegister = () => {
    if (!agree) {
      Alert.alert("Erreur", "Vous devez accepter les conditions");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Erreur", "Les mots de passe ne correspondent pas");
      return;
    }
    Alert.alert(
      "Inscription",
      `Nom: ${username}\nTéléphone: +${callingCode}${phoneNumber}\nEmail: ${email}`
    );
  };

  return (
    <ImageBackground
      source={require("../../assets/images/fond.jpg")}
      style={styles.background}
    >
      <View style={styles.overlay} />

      <ScrollView contentContainerStyle={styles.container}>
        <ImageBackground
          source={require("../../assets/images/Locatiis-Logo-Blanc-.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>
          Créez un compte pour commencer votre recherche de logement
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Nom d'utilisateur"
          placeholderTextColor="#888"
          value={username}
          onChangeText={setUsername}
        />

        <View style={styles.phoneWrapper}>
          <CountryPicker
            countryCode={countryCode}
            withFilter
            withFlag
            withCallingCode
            onSelect={(country) => {
              setCountryCode(country.cca2);
              setCallingCode(country.callingCode[0]);
            }}
          />
          <Text style={styles.callingCode}>+{callingCode}</Text>
          <TextInput
            style={styles.phoneInput}
            keyboardType="phone-pad"
            placeholder="01 96725986"
            placeholderTextColor="#888"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />
        </View>

        <TextInput
          style={styles.input}
          placeholder="Email (Ex: cedric@gmail.com)"
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Mot de passe"
            placeholderTextColor="#888"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <MaterialIcons
              name={showPassword ? "visibility" : "visibility-off"}
              size={24}
              color="gray"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Confirmer le Mot de passe"
            placeholderTextColor="#888"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirm}
          />
          <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
            <MaterialIcons
              name={showConfirm ? "visibility" : "visibility-off"}
              size={24}
              color="gray"
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.infoText}>
          En cliquant sur "S'inscrire" vous acceptez nos{" "}
          <Text style={styles.link}>Conditions d'utilisation</Text> et notre{" "}
          <Text style={styles.link}>Politique de confidentialité</Text>.
        </Text>

        <View style={styles.checkboxContainer}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => setAgree(!agree)}
          >
            {agree && <View style={styles.checked} />}
          </TouchableOpacity>
          <Text style={styles.label}>
            J'ai lu et j'accepte les Politiques de confidentialité et les
            Conditions d'utilisation.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.registerButton, !agree && { backgroundColor: "#ccc" }]}
          onPress={handleRegister}
          disabled={!agree}
        >
          <Text style={styles.registerText}>S'inscrire</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.googleButton]}
          onPress={handleGoogleLogin}
        >
          <AntDesign
            name="google"
            size={24}
            color="white"
            style={{ marginRight: 10 }}
          />
          <Text style={styles.buttonText}>Continuer avec Google</Text>
        </TouchableOpacity>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  container: {
    padding: 20,
    marginTop: 20,
    paddingBottom: 100,
  },
  logo: {
    marginTop: -20,
    width: 200,
    height: 100,
    alignSelf: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginBottom: 30,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    fontSize: 16,
    color: "#000",
  },
  phoneWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 20,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  callingCode: {
    marginHorizontal: 8,
    fontSize: 16,
    color: "#000",
  },
  phoneInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: "#000",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 20,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: "#000",
  },
  infoText: {
    fontSize: 14,
    color: "#fff",
    marginBottom: 15,
    textAlign: "center",
  },
  link: {
    color: "lightgreen",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: "lightgreen",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    borderRadius: 4,
    backgroundColor: "white",
  },
  checked: {
    width: 16,
    height: 16,
    backgroundColor: "green",
    borderRadius: 2,
  },
  label: {
    flex: 1,
    fontSize: 15,
    color: "white",
  },
  registerButton: {
    backgroundColor: "green",
    paddingVertical: 18,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  registerText: {
    color: "white",
    fontSize: 17,
    fontWeight: "bold",
  },
  button: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 15,
    borderRadius: 10,
    backgroundColor: "green",
    marginBottom: 15,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  googleButton: {
    backgroundColor: "#E63913FF",
  },
});
