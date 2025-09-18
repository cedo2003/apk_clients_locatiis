import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Linking,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import Icon from "react-native-vector-icons/FontAwesome";
import Toast from "react-native-toast-message";

import api, { API_BASE_URL } from "../../contexts/api";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../ThemeContext";

const { width: screenWidth } = Dimensions.get("window");

// --- Helper Functions ---
function timeAgo(date: string | Date): string {
  if (!date) return "Publié récemment";
  const seconds = Math.floor(
    (new Date().getTime() - new Date(date).getTime()) / 1000
  );
  if (seconds < 5) return "À l'instant";
  const intervals: [number, string, string][] = [
    [31536000, "an", "ans"],
    [2592000, "mois", "mois"],
    [86400, "jour", "jours"],
    [3600, "heure", "heures"],
    [60, "minute", "minutes"],
  ];
  for (const [secondsInUnit, singular, plural] of intervals) {
    const count = Math.floor(seconds / secondsInUnit);
    if (count >= 1) return `il y a ${count} ${count === 1 ? singular : plural}`;
  }
  return `il y a ${Math.floor(seconds)} secondes`;
}

const formatPrice = (value: any) => {
  const num = Number(value) || 0;
  return num.toLocaleString("fr-FR");
};

// --- Main Component ---
interface BienDetailModalProps {
  bienId: string | null;
  isVisible: boolean;
  onClose: () => void;
}

export default function BienDetailModal({
  bienId,
  isVisible,
  onClose,
}: BienDetailModalProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { user } = useAuth();

  const [details, setDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentImg, setCurrentImg] = useState(0);
  const [showCalendar, setShowCalendar] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [processingFavorite, setProcessingFavorite] = useState(false);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!bienId) return;

      setIsLoading(true);
      try {
        const { data: propertyData } = await api.get(`/bien/${bienId}`);
        const [agencyRes, locationRes, isLikedRes] = await Promise.all([
          propertyData.agence
            ? api.get(`/agence/${propertyData.agence}`)
            : Promise.resolve(null),
          propertyData.emplacement
            ? api.get(`/bien/listeEmplacement/${propertyData.emplacement}`)
            : Promise.resolve(null),
          user
            ? api.post("/users/isLiked", { bienId })
            : Promise.resolve({ status: 404, data: false }),
        ]);

        if (isMounted.current) {
          setDetails({
            ...propertyData,
            fullAgency: agencyRes?.data,
            fullLocation: locationRes?.data,
          });
          if (isLikedRes.status === 201) {
            setIsFavorited(isLikedRes.data);
          }
        }
      } catch (err) {
        console.error("Error fetching property details:", err);
        Toast.show({
          type: "error",
          text1: "Erreur",
          text2: "Impossible de charger les détails.",
        });
        onClose();
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    };

    fetchDetails();
  }, [bienId, user]);

  // --- Action Handlers ---
  const handleVisitRequest = async (date: Date) => {
    setShowCalendar(false);
    if (date < new Date()) {
      Toast.show({
        type: "error",
        text1: "Date invalide",
        text2: "Vous ne pouvez pas choisir une date passée.",
      });
      return;
    }
    try {
      await api.post("/users/demande", {
        bienId,
        date: date.toISOString(),
      });
      Toast.show({
        type: "success",
        text1: "Demande envoyée",
        text2: `Votre demande de visite a été envoyée.`,
      });
    } catch (error: any) {
      if (error.response?.status === 400) {
        Toast.show({
          type: "error",
          text1: "Demande échouée",
          text2: "Vous avez déjà une demande pour ce bien.",
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Erreur",
          text2: "Impossible d'envoyer la demande.",
        });
      }
    }
  };

  const toggleFavorite = async () => {
    if (processingFavorite || !user) return;
    setProcessingFavorite(true);
    const originalState = isFavorited;
    setIsFavorited(!originalState);
    try {
      await api.post("/users/like", { bienId });
      Toast.show({
        type: "success",
        text1: !originalState ? "Ajouté aux favoris" : "Retiré des favoris",
      });
    } catch (err) {
      setIsFavorited(originalState);
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Impossible de mettre à jour vos favoris.",
      });
    } finally {
      setProcessingFavorite(false);
    }
  };

  const handleShare = async () => {
    if (!details) return;
    try {
      await Share.share({
        title: `Découvrez cette propriété: ${details.titre}`,
        message: `J'ai trouvé cette propriété sur Locatiis: ${details.titre}. Jetez-y un oeil ! (https://locatiis.com/detailbiens/${details.id})`,
      });
    } catch (error: any) {
      Alert.alert(error.message);
    }
  };

  // --- Render Sub-Components ---
  const renderFinancialDetails = (bien: any) => {
    const prix = Number(bien.prix) || 0;
    const periodicite = Number(bien.periodicite) || 1;
    const caution = Number(bien.caution) || 0;
    const prixParJour = Number(bien.prixParJour) || 0;
    const prixParSemaine = Number(bien.prixParSemaine) || 0;
    const displayPrice = bien.typeGestion === "LOCATION" && periodicite > 1 ? prix * periodicite : prix;

    const textColor = isDark ? styles.textDark : styles.textLight;

    return (
      <View style={styles.modalSection}>
        <Text style={[styles.sectionTitle, textColor]}>Détails Financiers</Text>
        <View style={styles.financialRow}>
          <Text style={styles.financialLabel}>Prix</Text>
          <Text style={[styles.financialValue, textColor]}>
            {formatPrice(displayPrice)} FCFA
            {bien.typeGestion === "LOCATION" && (
              <Text style={styles.periodicity}> / {periodicite > 1 ? `${periodicite} mois` : "mois"}</Text>
            )}
          </Text>
        </View>
        {bien.type === "GUESTHOUSE" && (
          <>
            {prixParJour > 0 && (
              <View style={styles.financialRow}>
                <Text style={styles.financialLabel}>Prix par Jour</Text>
                <Text style={[styles.financialValue, textColor]}>{formatPrice(prixParJour)} FCFA</Text>
              </View>
            )}
            {prixParSemaine > 0 && (
              <View style={styles.financialRow}>
                <Text style={styles.financialLabel}>Prix par Semaine</Text>
                <Text style={[styles.financialValue, textColor]}>{formatPrice(prixParSemaine)} FCFA</Text>
              </View>
            )}
          </>
        )}
        {bien.typeGestion === "LOCATION" && (
          <>
            <View style={styles.financialRow}>
              <Text style={styles.financialLabel}>Caution Loyer ({bien.periodicite || 1} mois)</Text>
              <Text style={[styles.financialValue, textColor]}>{formatPrice(prix * (bien.periodicite || 1))} FCFA</Text>
            </View>
            <View style={styles.financialRow}>
              <Text style={styles.financialLabel}>Caution Eau & Électricité</Text>
              <Text style={[styles.financialValue, textColor]}>{formatPrice(caution)} FCFA</Text>
            </View>
          </>
        )}
      </View>
    );
  };

  const renderContent = () => {
    if (isLoading || !details) {
      return (
        <View style={styles.modalLoadingContainer}>
          <ActivityIndicator size="large" color="green" />
          <Text style={{ color: isDark ? "#FFF" : "#000", marginTop: 10 }}>Chargement...</Text>
        </View>
      );
    }

    const { fullAgency, fullLocation, ...bien } = details;
    const imagesToShow = bien.images?.length
      ? bien.images.map((img: any) => `${API_BASE_URL}/agence/files/${img.url}`)
      : [`https://picsum.photos/seed/${bien.id}/400/250`];

    const typeSpecificDetails = () => {
      const p = bien.appartement || bien.maison || bien.guestHouse;
      if (!p) return [];
      const detailsMap = [
        { key: 'nombreChambre', icon: 'bed', label: 'Chambres' },
        { key: 'nombreDouche', icon: 'bath', label: 'Douches' },
        { key: 'nombreSalon', icon: 'tv', label: 'Salons' },
        { key: 'nombreCuisine', icon: 'cutlery', label: 'Cuisines' },
        { key: 'nombreGarage', icon: 'car', label: 'Garages' },
        { key: 'numeroEtage', icon: 'building-o', label: 'Étage' },
      ];
      return detailsMap.filter(d => p[d.key]).map(d => ({ ...d, value: p[d.key] }));
    };

    const textColor = isDark ? styles.textDark : styles.textLight;

    return (
      <>
        <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
          <Icon name="close" size={24} color={"#FFF"} />
        </TouchableOpacity>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.carouselContainer}>
            <FlatList
              data={imagesToShow}
              horizontal pagingEnabled showsHorizontalScrollIndicator={false}
              keyExtractor={(_, idx) => idx.toString()}
              onScroll={(e) => setCurrentImg(Math.round(e.nativeEvent.contentOffset.x / screenWidth))}
              renderItem={({ item }) => <Image source={{ uri: item }} style={styles.mainImage} />}
            />
            <View style={styles.paginationDots}>
              {imagesToShow.map((_, index) => (
                <View key={index} style={[styles.dot, { backgroundColor: currentImg === index ? "green" : "#888" }]} />
              ))}
            </View>
          </View>

          <View style={styles.modalPadding}>
            <View style={styles.modalSection}>
                <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, textColor]}>{bien.titre}</Text>
                </View>
                <Text style={styles.timestamp}>Publié {timeAgo(bien.createdAt)}</Text>
                <View style={{ flexDirection: "row", gap: 8, marginVertical: 8 }}>
                    <View style={[styles.badge, { backgroundColor: bien.typeGestion === "VENTE" ? "#C70039" : "#008000" }]}>
                        <Text style={styles.badgeText}>{bien.typeGestion === "VENTE" ? "À Vendre" : "À Louer"}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: "#555" }]}>
                        <Text style={styles.badgeText}>{bien.disponible ? "Disponible" : "Non Disponible"}</Text>
                    </View>
                </View>
            </View>

            {renderFinancialDetails(bien)}

            <View style={styles.modalSection}>
              <Text style={[styles.sectionTitle, textColor]}>Caractéristiques</Text>
              <View style={styles.featuresGrid}>
                <View style={styles.featureItem}><Icon name="map-marker" size={20} color="green" /><Text style={textColor}>{fullLocation?.commune || "N/A"}</Text></View>
                <View style={styles.featureItem}><Icon name="arrows-alt" size={20} color="green" /><Text style={textColor}>{bien.superficie} m²</Text></View>
                {typeSpecificDetails().map((d) => (
                  <View key={d.key} style={styles.featureItem}><Icon name={d.icon} size={20} color="green" /><Text style={textColor}>{d.value} {d.label}</Text></View>
                ))}
              </View>
            </View>

            {fullAgency && (
              <View style={styles.modalSection}>
                <Text style={[styles.sectionTitle, textColor]}>Agence</Text>
                <View style={[styles.agentCard, {backgroundColor: isDark ? "#333" : "#F0F0F0"}]}>
                  <Image source={fullAgency.imageUrl ? { uri: `${API_BASE_URL}/agence/files/${fullAgency.imageUrl}` } : require("../../assets/Default-Picture.png")} style={styles.agentAvatar} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.agentName, textColor]}>{fullAgency.nomAgence}</Text>
                    {user && <Text style={styles.agentPhone}>{fullAgency.telephone}</Text>}
                  </View>
                  {user && <TouchableOpacity onPress={() => Linking.openURL(`tel:${fullAgency.telephone}`)} style={styles.contactBtn}><Icon name="phone" size={24} color="#FFF" /></TouchableOpacity>}
                </View>
              </View>
            )}

            <View style={styles.modalSection}>
              <Text style={[styles.sectionTitle, textColor]}>Description</Text>
              <Text style={[styles.modalDescription, textColor]}>{bien.description}</Text>
            </View>

            {user && (
              <View style={styles.modalActions}>
                <TouchableOpacity onPress={toggleFavorite} style={styles.actionButton} disabled={processingFavorite}>
                  {processingFavorite ? <ActivityIndicator size="small" color="green" /> : <Icon name={isFavorited ? "heart" : "heart-o"} size={24} color={isFavorited ? "#C70039" : "green"} />}
                  <Text style={[styles.actionButtonText, {color: isFavorited ? "#C70039" : "green"}]}>{isFavorited ? "Favori" : "Ajouter"}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleShare} style={styles.actionButton}><Icon name="share-alt" size={24} color="green" /><Text style={styles.actionButtonText}>Partager</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => setShowCalendar(true)} style={styles.actionButton}><Icon name="calendar" size={24} color="green" /><Text style={styles.actionButtonText}>Visite</Text></TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
        <DateTimePickerModal isVisible={showCalendar} mode="date" onConfirm={handleVisitRequest} onCancel={() => setShowCalendar(false)} minimumDate={new Date()} />
      </>
    );
  };

  return (
    <Modal visible={isVisible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalBackground}>
        <View style={[styles.modalContent, { backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF" }]}>
          {renderContent()}
          <Toast />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
    textDark: { color: '#EAEAEA' },
    textLight: { color: '#1C1C1E' },
    timestamp: { color: '#999', fontSize: 12, marginBottom: 8 },
    modalBackground: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
    modalContent: { width: "100%", height: "95%", borderTopLeftRadius: 20, borderTopRightRadius: 20 },
    modalLoadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
    modalCloseButton: { position: "absolute", top: 16, right: 16, backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 20, padding: 5, zIndex: 10 },
    carouselContainer: { height: 250, borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: "hidden", backgroundColor: '#000' },
    mainImage: { width: screenWidth, height: 250, resizeMode: 'contain' },
    paginationDots: { position: "absolute", bottom: 10, flexDirection: "row", alignSelf: "center" },
    dot: { width: 8, height: 8, borderRadius: 4, marginHorizontal: 4 },
    modalPadding: { paddingHorizontal: 16 },
    modalSection: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#333" },
    modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
    modalTitle: { fontSize: 24, fontWeight: "bold", flex: 1, marginRight: 12 },
    modalPrice: { fontSize: 22, fontWeight: "bold", color: 'green' },
    modalDescription: { fontSize: 15, lineHeight: 24 },
    sectionTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 16 },
    featuresGrid: { flexDirection: "row", flexWrap: "wrap", gap: 20 },
    featureItem: { alignItems: "center", gap: 8, width: "45%" },
    agentCard: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 10 },
    agentAvatar: { width: 60, height: 60, borderRadius: 30, marginRight: 12, borderWidth: 1, borderColor: '#444' },
    agentName: { fontSize: 18, fontWeight: "bold" },
    agentPhone: { fontSize: 14, color: '#999', marginTop: 4 },
    contactBtn: { backgroundColor: "green", padding: 12, borderRadius: 30 },
    modalActions: { flexDirection: "row", justifyContent: "space-around", paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#333', marginTop: 8 },
    actionButton: { alignItems: "center", gap: 6 },
    actionButtonText: { fontSize: 14, fontWeight: '500' },
    financialRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#2E2E2E' },
    financialLabel: { fontSize: 14, color: '#B0B0B0' },
    financialValue: { fontSize: 15, fontWeight: 'bold' },
    periodicity: { fontSize: 14, fontWeight: 'normal', color: '#B0B0B0' },
    badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15 },
    badgeText: { color: "white", fontWeight: "bold", fontSize: 12 },
});