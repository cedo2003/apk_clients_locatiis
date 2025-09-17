import {
  faCalendarAlt,
  faCreditCard,
  faExclamationTriangle,
  faEye,
  faFileContract,
  faHome,
  faMapMarkerAlt,
  faMoneyBillWave,
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
import Modal from "react-native-modal";
import Toast from "react-native-toast-message";
import api, { API_BASE_URL } from "../../contexts/api";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../ThemeContext";

// Placeholder for Default-Picture.png (update path as-needed)
const ImageBien = require("../../assets/Default-Picture.png");

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

// Placeholder modals (replace with your actual implementations)
const PropertyModal = ({
  isVisible,
  onClose,
  propertyId,
  isRented,
  userRole,
}) => (
  <Modal isVisible={isVisible} onBackdropPress={onClose}>
    <View style={styles.modalContainer}>
      <Text style={styles.modalText}>Property Modal for ID: {propertyId}</Text>
      <Text style={styles.modalText}>Is Rented: {isRented ? "Yes" : "No"}</Text>
      <Text style={styles.modalText}>User Role: {userRole}</Text>
      <TouchableOpacity style={styles.modalButton} onPress={onClose}>
        <Text style={styles.modalButtonText}>Fermer</Text>
      </TouchableOpacity>
    </View>
  </Modal>
);

const ContractModal = ({
  isVisible,
  onClose,
  contract,
  property,
  agency,
  location,
}) => (
  <Modal isVisible={isVisible} onBackdropPress={onClose}>
    <View style={styles.modalContainer}>
      <Text style={styles.modalText}>
        Contract Modal for ID: {contract?.id}
      </Text>
      <Text style={styles.modalText}>Property: {property?.titre}</Text>
      <Text style={styles.modalText}>Agency: {agency?.nomAgence}</Text>
      <Text style={styles.modalText}>
        Location: {location?.village}, {location?.commune}
      </Text>
      <TouchableOpacity style={styles.modalButton} onPress={onClose}>
        <Text style={styles.modalButtonText}>Fermer</Text>
      </TouchableOpacity>
    </View>
  </Modal>
);

const PayerLoyerModal = ({ isVisible, contractId, onClose }) => (
  <Modal isVisible={isVisible} onBackdropPress={onClose}>
    <View style={styles.modalContainer}>
      <Text style={styles.modalText}>
        Payer Loyer Modal for Contract ID: {contractId}
      </Text>
      <TouchableOpacity style={styles.modalButton} onPress={onClose}>
        <Text style={styles.modalButtonText}>Fermer</Text>
      </TouchableOpacity>
    </View>
  </Modal>
);

const MesBiens = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const router = useRouter();
  const [contracts, setContracts] = useState([]);
  const [agencies, setAgencies] = useState({});
  const [emplacements, setEmplacements] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [selectedContract, setSelectedContract] = useState(null);
  const [showContractModal, setShowContractModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedContractForPayment, setSelectedContractForPayment] =
    useState(null);
  const [selectedBienId, setSelectedBienId] = useState(null);
  const [propertyRentStatus, setPropertyRentStatus] = useState({});

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!user) return;
      const { data: contrats } = await api.get("/contrats/locataireContrats");
      const items = contrats.items || contrats;
      const withData = await Promise.all(
        items.map(async (c) => {
          try {
            const { data: bien } = await api.get(`/bien/${c.bienId}`);
            return { ...c, bien, locataire: user };
          } catch {
            return null;
          }
        })
      );
      const valid = withData.filter(Boolean);
      setContracts(valid);

      if (valid.length) {
        await Promise.all([fetchAgencies(valid), fetchLocations(valid)]);
      }
    } catch (err) {
      console.error(err);
      setError("Impossible de charger vos contrats de location.");
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Impossible de charger vos contrats de location.",
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchAgencies = useCallback(async (list) => {
    const ids = [...new Set(list.map((c) => c.bien.agence))];
    const data = {};
    await Promise.all(
      ids.map(async (id) => {
        try {
          const { data: a } = await api.get(`/agence/${id}`);
          data[id] = a;
        } catch {}
      })
    );
    setAgencies(data);
  }, []);

  const fetchLocations = useCallback(async (list) => {
    const ids = [...new Set(list.map((c) => c.bien.emplacement))];
    const data = {};
    await Promise.all(
      ids.map(async (id) => {
        try {
          const { data: loc } = await api.get(`/bien/listeEmplacement/${id}`);
          data[id] = loc;
        } catch {}
      })
    );
    setEmplacements(data);
  }, []);

  const openContractModal = (contract) => {
    setSelectedContract(contract);
    setShowContractModal(true);
  };

  const handleViewBien = async (bienId) => {
    setSelectedBienId(bienId);
    try {
      const response = await api.post("/contrats/IsbienContrat", {
        id: bienId,
      });
      setPropertyRentStatus((prev) => ({ ...prev, [bienId]: response.data }));
    } catch (error) {
      console.error("Error checking property rent status:", error);
    }
  };

  const closeBienModal = () => {
    setSelectedBienId(null);
  };

  const handlePayerLoyer = (id) => {
    setSelectedContractForPayment(id);
    setShowPaymentModal(true);
  };

  const getPaymentStatus = (contract) => {
    if (!contract.paiements?.length) {
      return { label: "Aucun paiement", color: isDark ? "#4b5563" : "#e5e7eb" };
    }
    const paid = contract.paiements.filter((p) => p.statut === "PAYE").length;
    const total = contract.paiements.length;
    const pending = contract.avances?.some((a) => a.statut === "EN_ATTENTE");
    if (pending)
      return {
        label: "Avance en attente",
        color: isDark ? "#ca8a04" : "#fef08a",
      };
    if (paid === 0)
      return {
        label: "Non payé",
        color: isDark ? "#b91c1c" : "#fee2e2",
      };
    if (paid === total)
      return {
        label: "Entièrement payé",
        color: isDark ? "#15803d" : "#dcfce7",
      };
    return {
      label: `${paid}/${total} payé`,
      color: isDark ? "#1e40af" : "#dbeafe",
    };
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchContracts();
    }
  }, [user, authLoading, fetchContracts]);

  if (loading || authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={isDark ? "#fff" : "#4b5563"} />
        <Text
          style={[styles.loadingText, { color: isDark ? "#fff" : "#4b5563" }]}
        >
          Chargement...
        </Text>
      </View>
    );
  }

  if (error && !contracts.length) {
    return (
      <View
        style={[
          styles.errorContainer,
          { backgroundColor: isDark ? "#1f2937" : "#fef2f2" },
        ]}
      >
        <FontAwesomeIcon
          icon={faExclamationTriangle}
          size={32}
          color="#b91c1c"
        />
        <Text
          style={[styles.errorText, { color: isDark ? "#f87171" : "#b91c1c" }]}
        >
          {error}
        </Text>
        <TouchableOpacity style={styles.errorButton} onPress={fetchContracts}>
          <Text style={styles.errorButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!user || contracts.length === 0) {
    return (
      <EmptyState
        icon={
          <FontAwesomeIcon
            icon={faHome}
            size={48}
            color={isDark ? "#9ca3af" : "#9ca3af"}
          />
        }
        title="Aucun bien loué"
        description="Vous n'avez pas encore de contrats."
        actionText="Découvrir des biens"
        actionLink="/biens"
      />
    );
  }

  const renderContract = ({ item: contract }) => {
    const { bien, paiements } = contract;
    const periodicite = bien.periodicite || 1;
    const adjustedPrice = bien.prix * periodicite;
    const paymentStatus = getPaymentStatus(contract);
    const totalMo = paiements?.length ?? periodicite;
    const paid = paiements?.filter((p) => p.paiementId).length ?? 0;
    const remaining = totalMo - paid;
    const agency = agencies[bien.agence];
    const location = emplacements[bien.emplacement];
    const cautionLoyer = bien.prix * 3;
    const imageUrl = bien.images?.[0]?.url
      ? `${API_BASE_URL}/agence/files/${bien.images[0].url}`
      : ImageBien;

    return (
      <View
        style={[
          styles.contractCard,
          { backgroundColor: isDark ? "#1f2937" : "#fff" },
        ]}
      >
        <View style={styles.imageContainer}>
          <Image
            source={typeof imageUrl === "string" ? { uri: imageUrl } : imageUrl}
            style={styles.bienImage}
            resizeMode="cover"
            onError={() => ImageBien}
          />
          <View style={styles.imageGradient} />
          <View
            style={[
              styles.paymentStatusBadge,
              { backgroundColor: paymentStatus.color },
            ]}
          >
            <Text style={styles.paymentStatusText}>{paymentStatus.label}</Text>
          </View>
          <Text style={styles.priceText}>
            {contract.uniteLocation !== "mois"
              ? `${(bien.prix || 0)
                  .toString()
                  .replace(/\B(?=(\d{3})+(?!\d))/g, " ")} FCFA / ${
                  contract.uniteLocation
                }`
              : `${adjustedPrice
                  .toString()
                  .replace(/\B(?=(\d{3})+(?!\d))/g, " ")} FCFA ${
                  periodicite > 1 ? `/ ${periodicite} Mois` : "/ Mois"
                }`}
          </Text>
        </View>

        <View style={styles.contractContent}>
          <Text
            style={[styles.bienTitle, { color: isDark ? "#fff" : "#1f2937" }]}
          >
            {bien.titre}
          </Text>

          {location && (
            <View style={styles.locationContainer}>
              <FontAwesomeIcon
                icon={faMapMarkerAlt}
                size={16}
                color={isDark ? "#d1d5db" : "#6b7280"}
              />
              <Text
                style={[
                  styles.locationText,
                  { color: isDark ? "#d1d5db" : "#6b7280" },
                ]}
              >
                {location.village}, {location.commune}
              </Text>
            </View>
          )}

          <View
            style={[
              styles.financialContainer,
              { backgroundColor: isDark ? "#374151" : "#f9fafb" },
            ]}
          >
            <View style={styles.financialHeader}>
              <FontAwesomeIcon
                icon={faMoneyBillWave}
                size={16}
                color={isDark ? "#fff" : "#1f2937"}
              />
              <Text
                style={[
                  styles.financialTitle,
                  { color: isDark ? "#fff" : "#1f2937" },
                ]}
              >
                Informations financières
              </Text>
            </View>
            <View style={styles.financialItem}>
              <Text
                style={[
                  styles.financialLabel,
                  { color: isDark ? "#d1d5db" : "#6b7280" },
                ]}
              >
                Avance ({bien.avance} Mois)
              </Text>
              <Text
                style={[
                  styles.financialValue,
                  { color: isDark ? "#fff" : "#1f2937" },
                ]}
              >
                {(bien.prix * bien.avance)
                  .toString()
                  .replace(/\B(?=(\d{3})+(?!\d))/g, " ")}{" "}
                FCFA
              </Text>
            </View>
            <View style={styles.financialItem}>
              <Text
                style={[
                  styles.financialLabel,
                  { color: isDark ? "#d1d5db" : "#6b7280" },
                ]}
              >
                Caution loyer
              </Text>
              <Text
                style={[
                  styles.financialValue,
                  { color: isDark ? "#fff" : "#1f2937" },
                ]}
              >
                {cautionLoyer.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")}{" "}
                FCFA
              </Text>
            </View>
            <View style={styles.financialItem}>
              <Text
                style={[
                  styles.financialLabel,
                  { color: isDark ? "#d1d5db" : "#6b7280" },
                ]}
              >
                Caution eau/électricité
              </Text>
              <Text
                style={[
                  styles.financialValue,
                  { color: isDark ? "#fff" : "#1f2937" },
                ]}
              >
                {bien.caution.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")}{" "}
                FCFA
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.periodContainer,
              { backgroundColor: isDark ? "#374151" : "#f9fafb" },
            ]}
          >
            <View style={styles.periodHeader}>
              <FontAwesomeIcon
                icon={faCalendarAlt}
                size={16}
                color={isDark ? "#d1d5db" : "#6b7280"}
              />
              <Text
                style={[
                  styles.periodLabel,
                  { color: isDark ? "#d1d5db" : "#6b7280" },
                ]}
              >
                Période :
              </Text>
            </View>
            <Text
              style={[
                styles.periodText,
                { color: isDark ? "#d1d5db" : "#6b7280" },
              ]}
            >
              Total : {totalMo} Mois — Restants : {remaining} Mois
            </Text>
          </View>

          {agency && (
            <View style={styles.agencyContainer}>
              <View style={styles.agencyImageContainer}>
                {agency.imageUrl ? (
                  <Image
                    source={{
                      uri: `${API_BASE_URL}/agence/files/${agency.imageUrl}`,
                    }}
                    style={styles.agencyImage}
                    resizeMode="cover"
                    onError={() => ImageBien}
                  />
                ) : (
                  <View
                    style={[
                      styles.agencyPlaceholder,
                      { backgroundColor: isDark ? "#4b5563" : "#e5e7eb" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.agencyPlaceholderText,
                        { color: isDark ? "#fff" : "#6b7280" },
                      ]}
                    >
                      {agency.nomAgence?.[0] || "A"}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.agencyTextContainer}>
                <Text
                  style={[
                    styles.agencyName,
                    { color: isDark ? "#fff" : "#1f2937" },
                  ]}
                >
                  {agency.nomAgence}
                </Text>
                <Text
                  style={[
                    styles.agencySubtitle,
                    { color: isDark ? "#d1d5db" : "#6b7280" },
                  ]}
                >
                  Agence partenaire
                </Text>
              </View>
            </View>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                { borderColor: isDark ? "#4b5563" : "#d1d5db" },
              ]}
              onPress={() => handleViewBien(bien.id)}
            >
              <FontAwesomeIcon
                icon={faEye}
                size={16}
                color={isDark ? "#fff" : "#374151"}
              />
              <Text
                style={[
                  styles.buttonText,
                  { color: isDark ? "#fff" : "#374151" },
                ]}
              >
                Voir bien
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionButton,
                { borderColor: isDark ? "#60a5fa" : "#bfdbfe" },
              ]}
              onPress={() => openContractModal(contract)}
            >
              <FontAwesomeIcon
                icon={faFileContract}
                size={16}
                color={isDark ? "#60a5fa" : "#1e40af"}
              />
              <Text
                style={[
                  styles.buttonText,
                  { color: isDark ? "#60a5fa" : "#1e40af" },
                ]}
              >
                Contrat
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.payButton,
                { backgroundColor: isDark ? "#2563eb" : "#2563eb" },
              ]}
              onPress={() => handlePayerLoyer(contract.id)}
              disabled={actionLoading[`${contract.id}-payment`]}
            >
              {actionLoading[`${contract.id}-payment`] ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <FontAwesomeIcon icon={faCreditCard} size={16} color="#fff" />
              )}
              <Text style={styles.payButtonText}>Payer loyer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? "#111827" : "#f5f5f5" },
      ]}
    >
      <View style={styles.header}>
        <View>
          <Text
            style={[styles.headerTitle, { color: isDark ? "#fff" : "#1f2937" }]}
          >
            Mes Biens Loués
          </Text>
          <Text
            style={[
              styles.headerSubtitle,
              { color: isDark ? "#d1d5db" : "#6b7280" },
            ]}
          >
            Gérez vos contrats de location.
          </Text>
        </View>
        <View style={styles.contractCount}>
          <Text
            style={[
              styles.contractCountText,
              { color: isDark ? "#1f2937" : "#6b7280" },
            ]}
          >
            {contracts.length} contrat(s)
          </Text>
        </View>
      </View>

      <FlatList
        data={contracts}
        renderItem={renderContract}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
      />

      <ContractModal
        isVisible={showContractModal}
        onClose={() => setShowContractModal(false)}
        contract={selectedContract}
        property={selectedContract?.bien}
        agency={selectedContract && agencies[selectedContract.bien.agence]}
        location={
          selectedContract && emplacements[selectedContract.bien.emplacement]
        }
      />

      {showPaymentModal && (
        <PayerLoyerModal
          isVisible={showPaymentModal}
          contractId={selectedContractForPayment}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedContractForPayment(null);
            fetchContracts();
          }}
        />
      )}

      {selectedBienId && (
        <PropertyModal
          isVisible={!!selectedBienId}
          propertyId={selectedBienId}
          onClose={closeBienModal}
          isRented={propertyRentStatus[selectedBienId] === true}
          userRole={user?.role}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
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
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  contractCount: {
    backgroundColor: "#e5e7eb",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
  },
  contractCountText: {
    fontSize: 14,
    fontWeight: "600",
  },
  listContainer: {
    paddingBottom: 16,
  },
  contractCard: {
    borderRadius: 8,
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
    height: 192,
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
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  paymentStatusBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  paymentStatusText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#1f2937",
  },
  priceText: {
    position: "absolute",
    bottom: 12,
    left: 12,
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  contractContent: {
    padding: 16,
  },
  bienTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 6,
  },
  locationText: {
    fontSize: 14,
  },
  financialContainer: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  financialHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  financialTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  financialItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    marginBottom: 8,
  },
  financialLabel: {
    fontSize: 14,
  },
  financialValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  periodContainer: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  periodHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  periodLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  periodText: {
    fontSize: 14,
  },
  agencyContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    gap: 12,
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
    justifyContent: "center",
    alignItems: "center",
  },
  agencyPlaceholderText: {
    fontSize: 14,
    fontWeight: "600",
  },
  agencyTextContainer: {
    flex: 1,
  },
  agencyName: {
    fontSize: 14,
    fontWeight: "500",
  },
  agencySubtitle: {
    fontSize: 12,
  },
  buttonContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  payButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  payButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 16,
    marginVertical: 16,
    textAlign: "center",
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
  modalContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 8,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 10,
  },
  modalButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#fff",
  },
});

export default MesBiens;
