import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useState } from "react";
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import CountryPicker, { CountryCode } from "react-native-country-picker-modal";
import Toast from "react-native-toast-message";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../contexts/api";

WebBrowser.maybeCompleteAuthSession();

export default function Register() {
  const navigation = useNavigation();
  const { signup, loginWithGoogle } = useAuth();
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agree, setAgree] = useState(false);
  const [countryCode, setCountryCode] = useState<CountryCode>("BJ");
  const [callingCode, setCallingCode] = useState("229");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");

  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: "YOUR_EXPO_CLIENT_ID", // Find this in your Google Cloud credentials
    iosClientId: "YOUR_IOS_CLIENT_ID", // Find this in your Google Cloud credentials
    androidClientId: "YOUR_ANDROID_CLIENT_ID", // Find this in your Google Cloud credentials
    webClientId: "YOUR_WEB_CLIENT_ID", // Find this in your Google Cloud credentials
  });

  useEffect(() => {
    const handleGoogleLogin = async () => {
      if (response?.type === "success") {
        const { authentication } = response;
        if (authentication?.idToken) {
          const success = await loginWithGoogle(authentication.idToken);
          if (success) {
            navigation.navigate("Mes Biens");
            Toast.show({
              type: "success",
              text1: "Succès",
              text2: "Connexion avec Google réussie !",
            });
          } else {
            Toast.show({
              type: "error",
              text1: "Erreur",
              text2: "Échec de la connexion avec Google. Veuillez réessayer.",
            });
          }
        }
      }
    };
    handleGoogleLogin();
  }, [response]);

  const handleGoogleLogin = () => {
    promptAsync();
  };

  const handleRegister = async () => {
    setError("");
    if (!agree) {
      setError("Vous devez accepter les conditions d'utilisation.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    const userData = {
      username,
      phone: `+${callingCode}${phoneNumber}`,
      email,
      password,
    };

    try {
      await signup(userData);
      navigation.navigate("Mes Biens");
      Toast.show({
        type: "success",
        text1: "Succès",
        text2: "Inscription réussie !",
      });
    } catch (err) {
      console.error("Signup failed:", err);
      if (err.response) {
        const { status, data } = err.response;
        if (status === 400 && data.message === "Email is already in use") {
          setError("Cette adresse email est déjà utilisée.");
        } else {
          setError(
            data.message || "L'inscription a échoué. Veuillez réessayer."
          );
        }
      } else {
        setError(
          "Impossible de s'inscrire. Vérifiez votre connexion internet."
        );
      }
    }
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

        <View style={styles.textSection}>
          <Text style={styles.title}>
            Créez un compte pour commencer votre recherche de logement
          </Text>
          <Text style={styles.subtitle}>
            Explorez des biens, sauvegardez vos choix et accédez aux options de
            réservation en toute simplicité.
          </Text>
          <TouchableOpacity
            style={styles.catalogButton}
            onPress={() => navigation.navigate("Biens")}
          >
            <Text style={styles.catalogButtonText}>Voir notre catalogue</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.formTitle}>Créer votre compte</Text>

          {error && (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={20} color="#b91c1c" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TextInput
            style={styles.input}
            placeholder="Nom d'utilisateur"
            placeholderTextColor="#888"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
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
            <Text
              style={styles.link}
              onPress={() => navigation.navigate("Terms")} // Replace with actual route
            >
              Conditions d'utilisation
            </Text>{" "}
            et notre{" "}
            <Text
              style={styles.link}
              onPress={() => navigation.navigate("Privacy")} // Replace with actual route
            >
              Politique de confidentialité
            </Text>
            .
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
            style={[styles.registerButton, !agree && styles.disabledButton]}
            onPress={handleRegister}
            disabled={!agree}
          >
            <Text style={styles.registerText}>S'inscrire</Text>
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={[styles.button, styles.googleButton]}
            onPress={handleGoogleLogin}
          >
            <AntDesign
              name="google"
              size={24}
              color="white"
              style={styles.googleIcon}
            />
            <Text style={styles.buttonText}>S'inscrire avec Google</Text>
          </TouchableOpacity>

          <Text style={styles.loginText}>
            Déjà inscrit ?{" "}
            <Text
              style={styles.loginLink}
              onPress={() => navigation.navigate("Login")}
            >
              Connectez-vous !
            </Text>
          </Text>
        </View>
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
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  container: {
    padding: 20,
    paddingBottom: 100,
  },
  logo: {
    width: 200,
    height: 100,
    alignSelf: "center",
    marginBottom: 20,
  },
  textSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "white",
    textAlign: "center",
    marginBottom: 20,
  },
  catalogButton: {
    backgroundColor: "#16a34a",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  catalogButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  formSection: {
    backgroundColor: "white",
    padding: 24,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
    color: "#1f2937",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: "#b91c1c",
    fontSize: 14,
    marginLeft: 8,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#d1d5db",
    fontSize: 16,
    color: "#000",
  },
  phoneWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    marginBottom: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  callingCode: {
    marginHorizontal: 8,
    fontSize: 16,
    color: "#000",
  },
  phoneInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 16,
    color: "#000",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    marginBottom: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 16,
    color: "#000",
  },
  infoText: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 16,
    textAlign: "center",
  },
  link: {
    color: "#16a34a",
    textDecorationLine: "underline",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: "#16a34a",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    borderRadius: 4,
    backgroundColor: "white",
  },
  checked: {
    width: 16,
    height: 16,
    backgroundColor: "#16a34a",
    borderRadius: 2,
  },
  label: {
    flex: 1,
    fontSize: 14,
    color: "#6b7280",
  },
  registerButton: {
    backgroundColor: "#16a34a",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  disabledButton: {
    backgroundColor: "#9ca3af",
  },
  registerText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#d1d5db",
  },
  dividerText: {
    marginHorizontal: 8,
    color: "#6b7280",
    fontSize: 14,
  },
  button: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  googleButton: {
    backgroundColor: "#f87171",
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  googleIcon: {
    marginRight: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  loginText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
  loginLink: {
    color: "#16a34a",
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
});