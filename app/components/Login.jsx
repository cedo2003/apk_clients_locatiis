// Updated Login.js (replace your existing Login component code with this)
// Note: I've made handleLogin async and added error handling.
// The 'rememberMe' feature is a UI element; for simplicity, tokens are always stored securely using SecureStore.
// If you want 'rememberMe' to control token persistence, you'd need to adjust how tokens are stored (e.g., in-memory vs. SecureStore)
// and how the API interceptor retrieves them. This would add complexity to the AuthContext and api.js.
import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  ImageBackground,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showError, setShowError] = useState(false);

  const { login, user } = useAuth();
  const navigation = useNavigation();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    if (user) {
      console.log("Login component: user is now set, navigating to AppTabs.");
      navigation.replace("Retour");
    }
  }, [user, navigation]);

  const handleLogin = async () => {
    console.log(`Attempting login for user: ${email}`);
    try {
      const success = await login(email, password);
      if (!success) {
        console.log("Login failed: login function returned false.");
        setShowError(true);
      }
    } catch (err) {
      console.error("An error occurred during login:", err);
      setShowError(true);
    }
  };

  return (
    <ImageBackground
      source={require("../../assets/images/fond.jpg")}
      style={styles.background}
    >
      <View style={styles.overlay} />

      <View style={styles.container}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <Image
            source={require("../../assets/images/Locatiis-Logo-Blanc-.png")}
            style={styles.logo}
          />

          <Text style={styles.title}>
            Connectez-vous pour découvrir votre futur logement
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
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
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <MaterialIcons
                name={showPassword ? "visibility" : "visibility-off"}
                size={24}
                color="green"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <TouchableOpacity
              onPress={() => setRememberMe(!rememberMe)}
              style={styles.checkbox}
            >
              {rememberMe && <View style={styles.checked} />}
            </TouchableOpacity>
            <Text style={styles.label}>Se souvenir de moi</Text>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Se connecter</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.googleButton]}
            onPress={() => alert("Connexion avec Google")} // TODO: Implement mobile Google auth if needed (see notes below)
          >
            <AntDesign
              name="google"
              size={24}
              color="white"
              style={{ marginRight: 10 }}
            />
            <Text style={styles.buttonText}>Continuer avec Google</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
            <Text style={styles.ins}>
              Pas encore de compte ? Inscrivez-Vous !
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* ✅ Popup d'erreur personnalisé */}
      <Modal
        transparent
        visible={showError}
        animationType="fade"
        onRequestClose={() => setShowError(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <MaterialIcons name="error-outline" size={40} color="red" />
            <Text style={styles.modalText}>
              Identifiants incorrects, veuillez réessayer.
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowError(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
}

// Styles remain unchanged
const styles = StyleSheet.create({
  background: { flex: 1, resizeMode: "cover" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  container: { flex: 1, padding: 15, paddingBottom: 50 },
  logo: {
    width: 200,
    height: 100,
    resizeMode: "contain",
    alignSelf: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginBottom: 30,
  },
  input: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  passwordContainer: { marginBottom: 15, position: "relative" },
  passwordInput: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    paddingRight: 45,
  },
  eyeButton: {
    position: "absolute",
    right: 15,
    top: "50%",
    transform: [{ translateY: -12 }],
  },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1,
    borderColor: "green",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    borderRadius: 4,
    backgroundColor: "white",
  },
  checked: { width: 14, height: 14, backgroundColor: "green", borderRadius: 2 },
  label: { fontSize: 16, color: "white" },
  ins: {
    color: "lightgreen",
    textAlign: "right",
    marginBottom: 25,
    marginTop: 30,
    fontWeight: "500",
    fontSize: 18,
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
  buttonText: { color: "white", fontSize: 18, fontWeight: "bold" },
  googleButton: { backgroundColor: "#E63913" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 25,
    borderRadius: 12,
    alignItems: "center",
    width: "80%",
  },
  modalText: {
    fontSize: 16,
    textAlign: "center",
    marginVertical: 15,
    color: "#333",
  },
  modalButton: {
    backgroundColor: "green",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  modalButtonText: { color: "white", fontWeight: "bold" },
});
