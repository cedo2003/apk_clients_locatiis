import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  LayoutAnimation,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { useTheme } from "../ThemeContext";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function Confidentialite() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [expandedSections, setExpandedSections] = useState<{
    [key: string]: boolean;
  }>({});

  const toggleSection = (key: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const openEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const sections = [
    {
      key: "intro",
      title: "Introduction",
      icon: "info",
      content: `Chez Locatiis, nous prenons votre vie privée très au sérieux. 
Chaque donnée que vous nous confiez est utilisée uniquement pour améliorer votre expérience et vous fournir nos services. 
Cette politique vous explique de manière simple et claire quelles informations nous collectons, pourquoi nous les collectons, et comment vous pouvez les gérer.`,
    },
    {
      key: "donnees",
      title: "Données collectées",
      icon: "database",
      content: `Nous collectons différents types de données pour que l'application fonctionne correctement et que votre expérience soit personnalisée :  

1. Informations personnelles : nom, prénom, email, téléphone, date de naissance, sexe.  
2. Informations de paiement : cartes bancaires et historique des transactions pour sécuriser vos paiements.  
3. Localisation : GPS ou adresse IP pour vous montrer les biens disponibles autour de vous.  
4. Données comportementales : vos préférences, les biens que vous consultez, vos interactions avec l'application.  
5. Informations techniques : type d'appareil, système d'exploitation, version de l'application.`,
    },
    {
      key: "utilisation",
      title: "Comment nous utilisons vos données",
      icon: "cogs",
      content: `Vos informations nous aident à :  
- Fournir nos services de location correctement.  
- Personnaliser votre expérience pour que vous voyiez ce qui vous intéresse.  
- Vous envoyer des notifications utiles et adaptées (comme vos réservations).  
- Améliorer l'application et corriger les bugs.  
- Respecter la loi et nos obligations légales.`,
    },
    {
      key: "partage",
      title: "Partage des données",
      icon: "users",
      content: `Nous ne vendons jamais vos données. Mais nous pouvons les partager avec :  
- Partenaires de confiance pour le traitement des paiements et services liés.  
- Autorités légales si la loi l'exige.  
- Transferts internationaux sécurisés, uniquement si nécessaires pour le service et avec protections appropriées.`,
    },
    {
      key: "cookies",
      title: "Cookies et traceurs",
      icon: "cookie",
      content: `Nous utilisons des cookies et petits fichiers pour :  
- Personnaliser votre expérience.  
- Analyser comment vous utilisez l'application afin de l'améliorer.  
- Proposer des contenus et publicités adaptées.  
Vous pouvez gérer ou désactiver ces cookies dans vos paramètres, mais certaines fonctionnalités pourraient ne plus fonctionner.`,
    },
    {
      key: "securite",
      title: "Sécurité des données",
      icon: "shield-alt",
      content: `Nous protégeons vos données avec :  
- Chiffrement avancé lors de l'envoi de vos informations.  
- Stockage sécurisé pour éviter tout accès non autorisé.  
- Contrôles d'accès internes pour que seules les personnes autorisées puissent consulter vos données.`,
    },
    {
      key: "droits",
      title: "Vos droits",
      icon: "hand-paper",
      content: `Vous avez le droit de :  
- Voir vos informations pour savoir quelles données nous détenons.  
- Modifier vos informations si elles sont incorrectes.  
- Supprimer vos données si vous le souhaitez.  
- Limiter certaines utilisations ou refuser certaines communications.  
- Télécharger vos données dans un format sécurisé.  

Pour exercer ces droits, contactez-nous à `,
      email: "privacy@locatiis.com",
    },
    {
      key: "conservation",
      title: "Durée de conservation",
      icon: "clock",
      content: `Nous gardons vos données seulement le temps nécessaire pour fournir nos services et respecter les lois.  
Par exemple, les informations liées aux transactions peuvent être conservées plusieurs années pour les obligations légales.`,
    },
    {
      key: "enfants",
      title: "Protection des enfants",
      icon: "child",
      content: `Locatiis n'est pas destiné aux personnes de moins de 18 ans.  
Nous ne collectons pas sciemment d'informations auprès des enfants et demandons aux parents de nous contacter si nécessaire.`,
    },
    {
      key: "politiques",
      title: "Politiques supplémentaires",
      icon: "file-alt",
      content: `- Emails et notifications : vous pouvez activer ou désactiver les notifications depuis vos paramètres.  
- Marketing et promotions : vous pouvez vous désinscrire à tout moment.  
- Mises à jour de la politique : toute modification sera communiquée clairement dans l'application.`,
    },
    {
      key: "articles",
      title: "Articles et références",
      icon: "book",
      content: `- Loi sur la protection des données personnelles  
- Règlement Général sur la Protection des Données (RGPD)  
- Politiques de confidentialité de nos partenaires`,
    },
    {
      key: "contact",
      title: "Nous contacter",
      icon: "envelope",
      content: `Pour toute question concernant la confidentialité ou pour exercer vos droits, contactez-nous à : `,
      email: "privacy@locatiis.com",
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? "#111" : "#fff" }]}
      contentContainerStyle={{ paddingBottom: 50 }}
    >
      <Text style={[styles.title, { color: isDark ? "#fff" : "#000" }]}>
        Nos Politiques de Confidentialité
      </Text>

      {sections.map((section) => (
        <View key={section.key} style={{ marginBottom: 12 }}>
          <TouchableOpacity
            style={styles.accordionHeader}
            onPress={() => toggleSection(section.key)}
          >
            <View style={styles.iconTextRow}>
              <FontAwesome5
                name={section.icon}
                size={20}
                color={isDark ? "#fff" : "green"}
              />
              <Text
                style={[
                  styles.accordionTitle,
                  { color: isDark ? "#fff" : "#000" },
                ]}
              >
                {section.title}
              </Text>
            </View>
            <MaterialIcons
              name={
                expandedSections[section.key]
                  ? "keyboard-arrow-up"
                  : "keyboard-arrow-down"
              }
              size={24}
              color={isDark ? "#fff" : "#000"}
            />
          </TouchableOpacity>
          {expandedSections[section.key] && (
            <View
              style={[
                styles.accordionContent,
                { backgroundColor: isDark ? "#222" : "#f2f2f2" },
              ]}
            >
              <Text
                style={{
                  color: isDark ? "#fff" : "#000",
                  fontSize: 14,
                  lineHeight: 22,
                }}
              >
                {section.content}
                {section.email && (
                  <Text
                    style={{ color: "green", textDecorationLine: "underline" }}
                    onPress={() => openEmail(section.email)}
                  >
                    {section.email}
                  </Text>
                )}
              </Text>
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  accordionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  iconTextRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  accordionTitle: { fontSize: 18, fontWeight: "bold" },
  accordionContent: { padding: 14, borderRadius: 12 },
});
