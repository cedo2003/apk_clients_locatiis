import {
  faBath,
  faBed,
  faCalendarAlt,
  faEye,
  faHeart as faHeartRegular,
  faHeart as faHeartSolid,
  faHome,
  faMapMarkerAlt,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import api, { API_BASE_URL } from "../../contexts/api";
import { useAuth } from "../../contexts/AuthContext";
import { useFavoris } from "../FavorisContext";

// Format currency (adapted from PropertyList's formatPrice)
const formatCurrency = (price) => {
  if (!price && price !== 0) return "0 FCFA";
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " FCFA";
};

// EmptyState component for React Native
const EmptyState = ({ icon, title, description, actionText, actionLink }) => {
  const router = useRouter();
  return (
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyStateIcon}>{icon}</View>
      <Text style={styles.emptyStateTitle}>{title}</Text>
      <Text style={styles.emptyStateDescription}>{description}</Text>
      <TouchableOpacity
        style={styles.emptyStateButton}
        onPress={() => router.push(actionLink)}
      >
        <Text style={styles.emptyStateButtonText}>{actionText}</Text>
      </TouchableOpacity>
    </View>
  );
};

const MesFavoris = ({ searchFilters }) => {
  const { user, isLoading: authLoading } = useAuth();
  const { toggleFavori, isLoading: favorisLoading } = useFavoris();
  const router = useRouter();
  const [biens, setBiens] = useState([]);
  const [agencies, setAgencies] = useState({});
  const [emplacements, setEmplacements] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(6);

  // Fetch agencies for properties
  const fetchAgencies = useCallback(async (properties) => {
    const uniqueAgencyIds = [
      ...new Set(properties.map((bien) => bien.agence).filter(Boolean)),
    ];
    const agencyData = {};
    try {
      await Promise.all(
        uniqueAgencyIds.map(async (agencyId) => {
          try {
            const { data } = await api.get(`/agence/${agencyId}`);
            agencyData[agencyId] = data;
          } catch (error) {
            console.error(`Error fetching agency ${agencyId}:`, error);
          }
        })
      );
      setAgencies(agencyData);
    } catch (err) {
      console.error("Error fetching agencies:", err);
    }
  }, []);

  // Fetch locations for properties
  const fetchLocations = useCallback(async (properties) => {
    const uniqueLocationIds = [
      ...new Set(properties.map((bien) => bien.emplacement).filter(Boolean)),
    ];
    const locationData = {};
    try {
      await Promise.all(
        uniqueLocationIds.map(async (locationId) => {
          try {
            const { data } = await api.get(
              `/bien/listeEmplacement/${locationId}`
            );
            locationData[locationId] = data;
          } catch (error) {
            console.error(`Error fetching location ${locationId}:`, error);
          }
        })
      );
      setEmplacements(locationData);
    } catch (err) {
      console.error("Error fetching locations:", err);
    }
  }, []);

  // Fetch favorites with pagination
  const fetchFavorites = useCallback(
    async (pageNum = 1) => {
      setLoading(true);
      if (!user) {
        setError("Veuillez vous connecter pour voir vos favoris.");
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get("/users/viewLikes", {
          params: { page: pageNum, limit: itemsPerPage },
        });

        if (data.pagination) {
          setTotalPages(Math.ceil(data.pagination.total / itemsPerPage));
        }

        const favoriteIds = Array.isArray(data.items)
          ? data.items.map((fav) => fav.bienId)
          : Array.isArray(data)
          ? data.map((fav) => fav.bienId)
          : [];

        const propertyPromises = favoriteIds.map(async (id) => {
          try {
            const { data } = await api.get(`/bien/${id}`);
            return data;
          } catch (error) {
            console.error(`Error fetching property ${id}:`, error);
            return null;
          }
        });

        const properties = await Promise.all(propertyPromises);
        const validProperties = properties.filter((prop) => prop !== null);
        setBiens(validProperties);

        if (validProperties.length > 0) {
          await Promise.all([
            fetchAgencies(validProperties),
            fetchLocations(validProperties),
          ]);
        }
      } catch (err) {
        console.error("Error fetching favorites:", err);
        setError(
          `Impossible de charger vos favoris: ${
            err.response?.status ? `Erreur ${err.response.status}` : err.message
          }`
        );
        Toast.show({
          type: "error",
          text1: "Erreur",
          text2: "Impossible de charger vos favoris.",
        });
      } finally {
        setLoading(false);
      }
    },
    [itemsPerPage, user, fetchAgencies, fetchLocations]
  );

  // Remove property from favorites
  const removeFavorite = async (propertyId) => {
    setRemovingId(propertyId);
    try {
      await toggleFavori(propertyId); // Use FavorisContext's toggleFavori
      setBiens((prevBiens) =>
        prevBiens.filter((bien) => bien.id !== propertyId)
      );
      Toast.show({
        type: "success",
        text1: "Succès",
        text2: "Bien retiré des favoris",
      });
    } catch (err) {
      console.error("Error removing favorite:", err);
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Impossible de retirer ce bien des favoris",
      });
    } finally {
      setRemovingId(null);
    }
  };

  // Request a visit
  const requestVisit = (propertyId) => {
    router.push(`/detailbiens/${propertyId}?requestVisit=true`);
  };

  // Initial data fetch
  useEffect(() => {
    if (!authLoading && !favorisLoading) {
      fetchFavorites(page);
    }
  }, [page, authLoading, favorisLoading, fetchFavorites]);

  // Handle page change
  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  if ((loading && page === 1) || authLoading || favorisLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>Chargement de vos favoris...</Text>
      </View>
    );
  }

  if (error && biens.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorIcon}>
          <FontAwesomeIcon icon={faHeartRegular} size={20} color="#ef4444" />
        </View>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.errorButton}
          onPress={() => fetchFavorites(page)}
        >
          <Text style={styles.errorButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!user || biens.length === 0) {
    return (
      <EmptyState
        icon={
          <FontAwesomeIcon icon={faHeartRegular} size={48} color="#f87171" />
        }
        title="Aucun favori trouvé"
        description="Vous n'avez pas encore ajouté de biens à vos favoris."
        actionText="Découvrir des biens"
        actionLink="/biens"
      />
    );
  }

  const renderBien = ({ item }) => {
    const isSale = item.typeGestion === "VENTE";
    const isGuestHouse = item.type === "GUESTHOUSE";
    const statusColor = isSale ? "#dc2626" : "#16a34a";
    const isMultiPeriod =
      !isSale && typeof item.periodicite === "number" && item.periodicite > 1;

    let price;
    if (isGuestHouse && item.prixParJour) {
      const priceDay = formatCurrency(item.prixParJour);
      price = `${priceDay} / jour`;
    } else {
      const totalPrice = item.prix;
      const periodLabel = !isSale ? " / Mois" : "";
      price = `${formatCurrency(totalPrice)}${periodLabel}`;
    }

    const image =
      item.images && item.images.length > 0
        ? item.images[0].url?.startsWith("https")
          ? item.images[0].url
          : `${API_BASE_URL}/agence/files/${
              item.images[0].url || item.images[0]
            }`
        : require("../../assets/Default-Picture.png");

    const agency = agencies[item.agence];
    const location = emplacements[item.emplacement];

    const details = [];
    const specificData = item.appartement || item.maison || item.guestHouse;
    if (specificData) {
      if (specificData.nombreChambre)
        details.push(`${specificData.nombreChambre} Chambre(s)`);
      if (specificData.nombreSalon)
        details.push(`${specificData.nombreSalon} Salon(s)`);
      if (specificData.nombreDouche)
        details.push(`${specificData.nombreDouche} Douche(s)`);
      if (specificData.nombreGarage)
        details.push(`${specificData.nombreGarage} Garage(s)`);
    } else if (item.local) {
      details.push(`État: ${item.local.etatLieux || "N/A"}`);
    }

    return (
      <View style={styles.bienCard}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push(`/detailbiens/${item.id}`)}
        >
          <View style={styles.imageContainer}>
            <Image
              source={typeof image === "string" ? { uri: image } : image}
              style={styles.bienImage}
              resizeMode="cover"
            />
            <View style={styles.imageGradient} />
            <View
              style={[styles.statusBadge, { backgroundColor: statusColor }]}
            >
              <Text style={styles.statusText}>
                {isGuestHouse ? "Guest House" : isSale ? "À Vendre" : "À Louer"}
              </Text>
            </View>
            <Text style={styles.priceText}>{price}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.bienContent}>
          <Text style={styles.bienTitle} numberOfLines={1}>
            {item.titre || "Bien sans titre"}
          </Text>

          {location && (
            <View style={styles.locationContainer}>
              <FontAwesomeIcon
                icon={faMapMarkerAlt}
                size={16}
                color="#ef4444"
              />
              <Text style={styles.locationText}>
                {location.village || "N/A"}, {location.commune || "N/A"}
              </Text>
            </View>
          )}

          <View style={styles.detailsContainer}>
            {details.map((detail, index) => (
              <View key={index} style={styles.detailBadge}>
                {detail.includes("Chambre") ? (
                  <FontAwesomeIcon icon={faBed} size={14} color="#6b7280" />
                ) : detail.includes("Douche") ? (
                  <FontAwesomeIcon icon={faBath} size={14} color="#6b7280" />
                ) : (
                  <FontAwesomeIcon icon={faHome} size={14} color="#6b7280" />
                )}
                <Text style={styles.detailText}>{detail}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.descriptionText} numberOfLines={3}>
            {item.description || "Aucune description disponible"}
          </Text>

          {agency && (
            <View style={styles.agencyContainer}>
              <View style={styles.agencyImageContainer}>
                {agency.imageUrl ? (
                  <Image
                    source={{
                      uri: agency.imageUrl.startsWith("https")
                        ? agency.imageUrl
                        : `${API_BASE_URL}/agence/files/${agency.imageUrl}`,
                    }}
                    style={styles.agencyImage}
                  />
                ) : (
                  <View style={styles.agencyPlaceholder}>
                    <Text style={styles.agencyPlaceholderText}>
                      {agency.nomAgence?.charAt(0) || "A"}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.agencyText} numberOfLines={1}>
                {agency.nomAgence || "Agence inconnue"}
              </Text>
            </View>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.visitButton}
              onPress={() => requestVisit(item.id)}
            >
              <FontAwesomeIcon icon={faCalendarAlt} size={16} color="#fff" />
              <Text style={styles.buttonText}>Demander visite</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeFavorite(item.id)}
              disabled={removingId === item.id}
            >
              {removingId === item.id ? (
                <ActivityIndicator size="small" color="#ef4444" />
              ) : (
                <FontAwesomeIcon
                  icon={faHeartSolid}
                  size={16}
                  color="#ef4444"
                />
              )}
              <Text style={styles.removeButtonText}>Retirer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.detailsButton}
              onPress={() => router.push(`/detailbiens/${item.id}`)}
            >
              <FontAwesomeIcon icon={faEye} size={16} color="#374151" />
              <Text style={styles.buttonText}>Voir détails</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes Favoris</Text>
        <Text style={styles.headerSubtitle}>
          {biens.length} bien(s) trouvé(s)
        </Text>
      </View>

      <FlatList
        data={biens}
        renderItem={renderBien}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        ListFooterComponent={
          totalPages > 1 && (
            <View style={styles.paginationContainer}>
              <TouchableOpacity
                style={[styles.pageButton, page === 1 && styles.disabledButton]}
                onPress={() => handlePageChange(page - 1)}
                disabled={page === 1}
              >
                <Text style={styles.pageButtonText}>Précédent</Text>
              </TouchableOpacity>

              {[...Array(totalPages)].map((_, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.pageButton,
                    page === i + 1 && styles.activePageButton,
                  ]}
                  onPress={() => handlePageChange(i + 1)}
                >
                  <Text
                    style={[
                      styles.pageButtonText,
                      page === i + 1 && styles.activePageButtonText,
                    ]}
                  >
                    {i + 1}
                  </Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={[
                  styles.pageButton,
                  page === totalPages && styles.disabledButton,
                ]}
                onPress={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
              >
                <Text style={styles.pageButtonText}>Suivant</Text>
              </TouchableOpacity>
            </View>
          )
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6b7280",
  },
  listContainer: {
    paddingBottom: 16,
  },
  bienCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 224,
  },
  bienImage: {
    width: "100%",
    height: "100%",
  },
  imageGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  statusBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  priceText: {
    position: "absolute",
    bottom: 12,
    left: 12,
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  bienContent: {
    padding: 16,
  },
  bienTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1f2937",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 6,
  },
  locationText: {
    fontSize: 14,
    color: "#6b7280",
  },
  detailsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  detailBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    color: "#6b7280",
  },
  descriptionText: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 12,
  },
  agencyContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    gap: 10,
  },
  agencyImageContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: "hidden",
  },
  agencyImage: {
    width: "100%",
    height: "100%",
  },
  agencyPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#dcfce7",
    justifyContent: "center",
    alignItems: "center",
  },
  agencyPlaceholderText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#16a34a",
  },
  agencyText: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  buttonContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 16,
  },
  visitButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#16a34a",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  removeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ef4444",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  detailsButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#fff",
  },
  removeButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#ef4444",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    fontSize: 16,
    color: "#6b7280",
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    padding: 24,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#ef4444",
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: "#b91c1c",
    textAlign: "center",
    marginBottom: 16,
  },
  errorButton: {
    backgroundColor: "#ef4444",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  errorButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#fff",
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyStateIcon: {
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 16,
  },
  emptyStateButton: {
    backgroundColor: "#16a34a",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#fff",
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    gap: 8,
  },
  pageButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
  },
  activePageButton: {
    backgroundColor: "#16a34a",
    borderColor: "#16a34a",
  },
  disabledButton: {
    opacity: 0.5,
  },
  pageButtonText: {
    fontSize: 14,
    color: "#374151",
  },
  activePageButtonText: {
    color: "#fff",
  },
});

export default MesFavoris;
