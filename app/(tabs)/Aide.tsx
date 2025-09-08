import { MaterialIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../ThemeContext";

export default function Aide() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  const faqs = [
    {
      question: "Comment créer un compte ?",
      answer:
        "Pour créer un compte, cliquez sur 'S'inscrire' depuis la page d'accueil et remplissez vos informations personnelles.",
    },
    {
      question: "Comment récupérer mon mot de passe ?",
      answer:
        "Cliquez sur 'Mot de passe oublié' sur la page de connexion et suivez les instructions envoyées par email.",
    },
    {
      question: "Comment ajouter un bien à mes favoris ?",
      answer:
        "Sur chaque fiche de bien, cliquez sur l'icône '❤️ Favori'. Pour le retirer, cliquez à nouveau sur le cœur.",
    },
    {
      question: "Comment demander une visite d'un bien ?",
      answer:
        "Sur la fiche du bien, cliquez sur '📅 Visite' et sélectionnez une date disponible. Vous recevrez une confirmation par email.",
    },
    {
      question: "Comment publier mon propre bien à louer ou à vendre ?",
      answer:
        "Accédez à 'Ajouter un bien', remplissez les informations et téléchargez les photos. Votre annonce sera vérifiée avant publication.",
    },
    {
      question: "Comment contacter un agent pour un bien spécifique ?",
      answer:
        "Sur chaque fiche de bien, le nom et le numéro de l'agent sont indiqués. Vous pouvez l'appeler directement ou envoyer un email.",
    },
    {
      question: "Comment signaler un problème sur la plateforme ?",
      answer:
        "Utilisez le formulaire ci-dessous ou envoyez un email à privacy@locatiis.com pour signaler tout problème ou bug.",
    },
    {
      question:
        "Comment sécuriser mes paiements et informations personnelles ?",
      answer:
        "Toutes les transactions sont sécurisées et vos informations personnelles sont protégées. Ne partagez jamais vos identifiants.",
    },
    {
      question: "Comment supprimer mon compte ?",
      answer:
        "Vous pouvez demander la suppression de votre compte en envoyant un email à privacy@locatiis.com. Toutes vos données seront effacées.",
    },
    {
      question: "Comment filtrer les biens par prix, type ou localisation ?",
      answer:
        "Utilisez les filtres disponibles sur la page d'accueil ou lors de vos recherches pour trouver rapidement le bien correspondant à vos critères.",
    },
  ];

  const handleSendMessage = () => {
    if (!message.trim()) {
      Alert.alert("Erreur", "Veuillez saisir un message.");
      return;
    }
    Alert.alert("Merci !", "Votre message a été envoyé avec succès.");
    setMessage("");
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? "#000" : "#fff" }]}
      contentContainerStyle={{ padding: 16 }}
    >
      {/* Section FAQ */}
      <Text style={[styles.sectionTitle, { color: isDark ? "#fff" : "#000" }]}>
        FAQ
      </Text>
      {faqs.map((faq, index) => (
        <View
          key={index}
          style={[
            styles.faqCard,
            { backgroundColor: isDark ? "#222" : "#f2f2f2" },
          ]}
        >
          <TouchableOpacity
            style={styles.faqHeader}
            onPress={() => setFaqOpen(faqOpen === index ? null : index)}
          >
            <Text
              style={[styles.faqQuestion, { color: isDark ? "#fff" : "#000" }]}
            >
              {faq.question}
            </Text>
            <MaterialIcons
              name={faqOpen === index ? "expand-less" : "expand-more"}
              size={24}
              color={isDark ? "#fff" : "#000"}
            />
          </TouchableOpacity>
          {faqOpen === index && (
            <Text
              style={[styles.faqAnswer, { color: isDark ? "#ccc" : "#333" }]}
            >
              {faq.answer}
            </Text>
          )}
        </View>
      ))}

      {/* Section Contact */}
      <Text style={[styles.sectionTitle, { color: isDark ? "#fff" : "#000" }]}>
        Contactez-nous
      </Text>
      <Text style={{ color: isDark ? "#ccc" : "#555", marginBottom: 8 }}>
        Email: privacy@locatiis.com
      </Text>
      <Text style={{ color: isDark ? "#ccc" : "#555", marginBottom: 12 }}>
        Téléphone: +229 01 66 42 02 11
      </Text>
      <TouchableOpacity
        style={[styles.contactBtn, { backgroundColor: "green" }]}
        onPress={() => Linking.openURL("tel:+2290166420211")}
      >
        <Text style={{ color: "#fff", fontWeight: "bold" }}>Appeler</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.contactBtn, { backgroundColor: "#007bff" }]}
        onPress={() =>
          Linking.openURL("mailto:privacy@locatiis.com?subject=Assistance")
        }
      >
        <Text style={{ color: "#fff", fontWeight: "bold" }}>
          Envoyer un email
        </Text>
      </TouchableOpacity>

      {/* Formulaire message */}
      <Text style={[styles.sectionTitle, { color: isDark ? "#fff" : "#000" }]}>
        Envoyer un message
      </Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: isDark ? "#222" : "#f2f2f2",
            color: isDark ? "#fff" : "#000",
          },
        ]}
        placeholder="Votre message..."
        placeholderTextColor={isDark ? "#888" : "#666"}
        multiline
        numberOfLines={4}
        value={message}
        onChangeText={setMessage}
      />
      <TouchableOpacity
        style={[styles.sendBtn, { backgroundColor: "green" }]}
        onPress={handleSendMessage}
      >
        <Text style={{ color: "#fff", fontWeight: "bold" }}>Envoyer</Text>
      </TouchableOpacity>

      {/* Guide rapide */}
      <Text
        style={[
          styles.sectionTitle,
          { color: isDark ? "#fff" : "#000", marginTop: 20 },
        ]}
      >
        Guide rapide
      </Text>
      <View
        style={[
          styles.guideCard,
          { backgroundColor: isDark ? "#222" : "#f2f2f2" },
        ]}
      >
        <Text style={{ color: isDark ? "#fff" : "#000", marginBottom: 6 }}>
          1️⃣ Créez votre compte via la page d'accueil.
        </Text>
        <Text style={{ color: isDark ? "#fff" : "#000", marginBottom: 6 }}>
          2️⃣ Parcourez les biens et utilisez les filtres pour trouver
          facilement.
        </Text>
        <Text style={{ color: isDark ? "#fff" : "#000", marginBottom: 6 }}>
          3️⃣ Ajoutez vos biens favoris pour les retrouver rapidement.
        </Text>
        <Text style={{ color: isDark ? "#fff" : "#000", marginBottom: 6 }}>
          4️⃣ Contactez l'agent ou demandez une visite directement depuis
          l'application.
        </Text>
        <Text style={{ color: isDark ? "#fff" : "#000", marginBottom: 6 }}>
          5️⃣ Effectuez vos transactions de manière sécurisée.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 16 },
  sectionTitle: { fontSize: 22, fontWeight: "bold", marginVertical: 12 },
  faqCard: { borderRadius: 12, padding: 12, marginBottom: 8 },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  faqQuestion: { fontSize: 16, fontWeight: "bold" },
  faqAnswer: { marginTop: 8, fontSize: 15 },
  contactBtn: {
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 8,
  },
  input: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 16,
    textAlignVertical: "top",
  },
  sendBtn: { padding: 12, borderRadius: 8, alignItems: "center" },
  guideCard: { padding: 12, borderRadius: 12, marginBottom: 12 },
});
