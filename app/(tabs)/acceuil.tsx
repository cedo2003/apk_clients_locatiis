import { useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import React, { useCallback, useEffect, useState, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import Icon from "react-native-vector-icons/FontAwesome";
import api, { API_BASE_URL } from "../../contexts/api";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../ThemeContext";

const categories = [
  "Maison",
  "Appartement",
  "GuestHouse",
  "Immeuble",
  "Boutique",
];

const typeMap: { [key: string]: string } = {
  Maison: "MAISON",
  Appartement: "APPARTEMENT",
  GuestHouse: "GUESTHOUSE",
  Immeuble: "IMMEUBLE",
  Boutique: "BOUTIQUE",
};

// Helper function for relative time
function timeAgo(date: string | Date): string {
  if (!date) return "Publié récemment";
  const seconds = Math.floor(
    (new Date().getTime() - new Date(date).getTime()) / 1000
  );

  if (seconds < 5) return "À l'instant";

  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) return `Il y a ${interval} an${interval > 1 ? "s" : ""}`;
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return `Il y a ${interval} mois`;
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return `Il y a ${interval} jour${interval > 1 ? "s" : ""}`;
  interval = Math.floor(seconds / 3600);
  if (interval >= 1)
    return `Il y a ${interval} heure${interval > 1 ? "s" : ""}`;
  interval = Math.floor(seconds / 60);
  if (interval >= 1)
    return `Il y a ${interval} minute${interval > 1 ? "s" : ""}`;
  return `Il y a ${Math.floor(seconds)} seconde${
    Math.floor(seconds) > 1 ? "s" : ""
  }`;
}

export default function Acceuil() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { user } = useAuth();
  const navigation = useNavigation();

  const [biens, setBiens] = useState([]);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<{ [key: string]: boolean }>({});
  const [selectedBien, setSelectedBien] = useState<any>(null);
  const [currentImg, setCurrentImg] = useState(0);
  const [showCalendar, setShowCalendar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingFavorite, setProcessingFavorite] = useState<string | null>(null);

  const isMounted = useRef(true);

  useEffect(() => {
    // Set isMounted to false when component unmounts
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchBiens = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = {
        titre: search,
        description: search,
        type: activeCat ? typeMap[activeCat] : undefined,
        page: 1,
        limit: 100,
      };
      const response = await api.post("/bien/all", filters);
      const mappedBiens = response.data.biens.map((b: any) => ({
        id: b.id.toString(),
        titre: b.titre,
        prix: b.prix || (b.type === "GUESTHOUSE" ? b.prixParJour : 0),
        type: b.type,
        status: b.typeGestion === "VENTE" ? "A Vendre" : "A Louer",
        dispo: b.disponible || "Disponible",
        images: b.images
          ? b.images.map(
              (img: any) => `${API_BASE_URL}/agence/files/${img.url}`
            )
          : [
              b.firstImage
                ? `${API_BASE_URL}/agence/files/${b.firstImage}`
                : "https://picsum.photos/400/250?random=default",
            ],
        desc: b.description,
        visites: b.visites || 0,
        surface: b.superficie,
        photosCount: b.images ? b.images.length : b.firstImage ? 1 : 0,
        location: b.emplacement?.commune || "Inconnu",
        agent: {
          name: b.agence?.nomAgence || b.nomProprietaire || "Anonyme",
          phone: b.agence?.telephone || b.telephoneProprietaire || "N/A",
        },
        createdAt: b.createdAt,
      }));
      setBiens(mappedBiens);
    } catch (err) {
      if (isMounted.current) {
        setError("Échec du chargement des biens. Veuillez réessayer.");
      }
      console.error("Fetch biens error:", err);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [search, activeCat]);

  useEffect(() => {
    fetchBiens();
  }, [fetchBiens]);

  useEffect(() => {
    const checkFavorites = async () => {
      if (!user || biens.length === 0) return;
      try {
        const bienIds = biens.map((b: any) => b.id);
        const response = await api.post("/users/checkMultipleFavorites", {
          bienIds,
        });
        const favMap: { [key: string]: boolean } = {};
        response.data.forEach((item: any) => {
          favMap[item.propertyId] = item.isFavorite;
        });
        if (isMounted.current) {
          setFavorites(favMap);
        }
      } catch (err) {
        console.error("Check favorites error:", err);
      }
    };
    checkFavorites();
  }, [biens, user]);

  const toggleFavori = async (id: string) => {
    if (processingFavorite === id) return; // Prevent double clicks

    if (!user) {
      Toast.show({
        type: "error",
        text1: "Connexion requise",
        text2: "Veuillez vous connecter pour ajouter aux favoris.",
      });
      navigation.navigate("Login" as never);
      return;
    }

    const originalState = favorites[id];
    setProcessingFavorite(id);
    setFavorites((prev) => ({ ...prev, [id]: !originalState })); // Optimistic update

    try {
      await api.post("/users/like", { bienId: id });
      Toast.show({
        type: "success",
        text1: "Favoris mis à jour",
        text2: !originalState ? "Ajouté aux favoris" : "Retiré des favoris",
      });
    } catch (err) {
      setFavorites((prev) => ({ ...prev, [id]: originalState })); // Revert on error
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Impossible de mettre à jour vos favoris.",
      });
      console.error("Toggle favorite error:", err);
    } finally {
      if (isMounted.current) {
        setProcessingFavorite(null);
      }
    }
  };

  const openModal = (bien: any) => {
    setSelectedBien(bien);
    setCurrentImg(0);
  };

  const handleConfirm = (date: Date) => {
    setShowCalendar(false);
    if (date < new Date()) {
      Alert.alert("Erreur", "Vous ne pouvez pas choisir une date passée.");
      return;
    }
    Alert.alert(
      "Visite demandée",
      `Vous avez choisi le ${date.toDateString()}`
    );
  };

  const shareBien = async () => {
    if (!selectedBien) return;

    const { titre, desc, images } = selectedBien;
    const message = `${titre}\n${desc}`;
    const imageUrl = images[0]; // première image

    Alert.alert("Partager sur", "Choisissez l'application", [
      {
        text: "WhatsApp",
        onPress: () =>
          Linking.openURL(
            `whatsapp://send?text=${encodeURIComponent(
              message + "\n" + imageUrl
            )}`
          ),
      },
      {
        text: "Telegram",
        onPress: () =>
          Linking.openURL(
            `tg://msg?text=${encodeURIComponent(message + "\n" + imageUrl)}`
          ),
      },
      {
        text: "Facebook",
        onPress: () =>
          Linking.openURL(
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
              imageUrl
            )}&quote=${encodeURIComponent(message)}`
          ),
      },
      { text: "Annuler", style: "cancel" },
    ]);
  };

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          {
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: isDark ? "#000" : "#fff",
          },
        ]}
      >
        <ActivityIndicator size="large" color="green" />
        <Text style={{ marginTop: 10, color: isDark ? "#fff" : "#000" }}>
          Chargement des biens...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={[
          styles.container,
          {
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: isDark ? "#000" : "#fff",
          },
        ]}
      >
        <Text style={{ color: "red", marginBottom: 10 }}>{error}</Text>
        <TouchableOpacity onPress={fetchBiens} style={styles.btn}>
          <Text style={{ color: "white", fontWeight: "bold" }}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const filtered = biens.filter(
    (b: any) =>
      (!activeCat || b.type.toUpperCase() === typeMap[activeCat]) &&
      (search === "" ||
        b.titre.toLowerCase().includes(search.toLowerCase()) ||
        b.desc.toLowerCase().includes(search.toLowerCase()))
  );

  const recents = filtered.slice(0, 5);
  const visites = [...filtered].sort((a: any, b: any) => b.visites - a.visites);
  const eco = [...filtered]
    .sort((a: any, b: any) => a.prix - b.prix)
    .slice(0, filtered.length > 5 ? 5 : filtered.length);
  const autres = filtered.slice(5);

  const BienCard = ({ item, fullWidth = false }: any) => (
    <View
      style={[
        styles.card,
        {
          width: fullWidth ? "96%" : 220,
          backgroundColor: isDark ? "#2F2C2CFF" : "#fff",
        },
      ]}
    >
      <Image source={{ uri: item.images[0] }} style={styles.image} />
      <View style={styles.badges}>
        <Text
          style={[
            styles.badge,
            { backgroundColor: item.status === "A Louer" ? "green" : "red" },
          ]}
        >
          {item.status}
        </Text>
        <Text style={[styles.badge, { backgroundColor: "#555" }]}>
          {item.dispo}
        </Text>
      </View>
      <View style={{ padding: 8 }}>
        <Text style={[styles.price, { color: isDark ? "#0f0" : "green" }]}>
          {item.prix.toLocaleString()} FCFA
        </Text>
        <Text style={[styles.title, { color: isDark ? "#fff" : "#000" }]}>
          {item.titre}
        </Text>
        <Text
          numberOfLines={2}
          style={[styles.desc, { color: isDark ? "#ccc" : "#555" }]}
        >
          {item.desc}
        </Text>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 6,
          }}
        >
          <TouchableOpacity style={styles.btn} onPress={() => openModal(item)}>
            <Text style={{ color: "white", fontWeight: "bold" }}>
              Voir Détails
            </Text>
          </TouchableOpacity>

          {user && (
            <TouchableOpacity
              onPress={() => toggleFavori(item.id)}
              style={[
                styles.favBtn,
                { backgroundColor: isDark ? "#333" : "#eee" },
              ]}
              disabled={processingFavorite === item.id}
            >
              {processingFavorite === item.id ? (
                <ActivityIndicator size="small" color={isDark ? "#fff" : "#888"} />
              ) : (
                <Icon
                  name={favorites[item.id] ? "heart" : "heart-o"}
                  size={20}
                  color={favorites[item.id] ? "red" : isDark ? "#fff" : "#888"}
                />
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? "#000" : "#fff" }]}
    >
      <TextInput
        style={[
          styles.search,
          {
            backgroundColor: isDark ? "#222" : "#f2f2f2",
            color: isDark ? "#fff" : "#000",
          },
        ]}
        placeholder="Rechercher un bien..."
        placeholderTextColor={isDark ? "#888" : "#666"}
        value={search}
        onChangeText={setSearch}
      />

      <View style={styles.categories}>
        {categories.map((c) => (
          <TouchableOpacity
            key={c}
            onPress={() => setActiveCat(activeCat === c ? null : c)}
            style={[
              styles.catBtn,
              { backgroundColor: activeCat === c ? "green" : "#ddd" },
            ]}
          >
            <Text
              style={{
                color: activeCat === c ? "white" : "black",
                fontWeight: "bold",
              }}
            >
              {c}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.sectionTitle, { color: isDark ? "#fff" : "#000" }]}>
        🏡 Biens récents
      </Text>
      <FlatList
        data={recents}
        renderItem={({ item }) => <BienCard item={item} />}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
      />

      <Text style={[styles.sectionTitle, { color: isDark ? "#fff" : "#000" }]}>
        🔥 Les plus visités
      </Text>
      {visites.map((item) => (
        <BienCard key={item.id} item={item} fullWidth />
      ))}

      <Text style={[styles.sectionTitle, { color: isDark ? "#fff" : "#000" }]}>
        💸 Prix éco loyer pas cher
      </Text>
      <FlatList
        data={eco}
        renderItem={({ item }) => <BienCard item={item} />}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
      />

      <Text style={[styles.sectionTitle, { color: isDark ? "#fff" : "#000" }]}>
        📦 Autres biens
      </Text>
      {autres.map((item) => (
        <BienCard key={item.id} item={item} fullWidth />
      ))}

      {/* Modal */}
      {selectedBien && (
        <Modal visible={true} animationType="slide" transparent={true}>
          <View style={styles.modalBackground}>
            <View
              style={[
                styles.modalContent,
                { backgroundColor: isDark ? "#424141FF" : "#fff" },
              ]}
            >
              <ScrollView>
                <Image
                  source={{ uri: selectedBien.images[currentImg] }}
                  style={styles.mainImage}
                />
                <FlatList
                  data={selectedBien.images}
                  horizontal
                  keyExtractor={(_, idx) => idx.toString()}
                  renderItem={({ item, index }) => (
                    <TouchableOpacity onPress={() => setCurrentImg(index)}>
                      <Image source={{ uri: item }} style={styles.thumb} />
                    </TouchableOpacity>
                  )}
                  style={{ marginTop: 8 }}
                />

                <Text
                  style={[
                    styles.title,
                    { color: isDark ? "#fff" : "#000", marginTop: 8 },
                  ]}
                >
                  {selectedBien.titre}
                </Text>
                <Text
                  style={{ color: isDark ? "#ccc" : "#555", marginBottom: 4 }}
                >
                  {timeAgo(selectedBien.createdAt)}
                </Text>

                <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor:
                          selectedBien.status === "A Louer" ? "green" : "red",
                      },
                    ]}
                  >
                    <Text style={{ color: "white", fontWeight: "bold" }}>
                      {selectedBien.status}
                    </Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: "#555" }]}>
                    <Text style={{ color: "white", fontWeight: "bold" }}>
                      {selectedBien.dispo}
                    </Text>
                  </View>
                </View>

                <Text style={{ color: isDark ? "#ccc" : "#555" }}>
                  💰 {selectedBien.prix.toLocaleString()} FCFA
                </Text>
                <Text style={{ color: isDark ? "#ccc" : "#555" }}>
                  📏 {selectedBien.surface} m²
                </Text>
                <Text style={{ color: isDark ? "#ccc" : "#555" }}>
                  🖼 {selectedBien.photosCount} photos
                </Text>
                <Text style={{ color: isDark ? "#ccc" : "#555" }}>
                  📍 {selectedBien.location}
                </Text>

                {/* Agent */}
                <Text
                  style={{
                    fontWeight: "bold",
                    marginTop: 12,
                    color: isDark ? "#fff" : "#000",
                  }}
                >
                  {selectedBien.agent.name}
                </Text>
                {user && (
                  <TouchableOpacity
                    onPress={() =>
                      Linking.openURL(`tel:${selectedBien.agent.phone}`)
                    }
                    style={[
                      styles.contactBtn,
                      { backgroundColor: "green", marginTop: 4 },
                    ]}
                  >
                    <Text style={{ color: "#fff" }}>
                      📞 {selectedBien.agent.phone}
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Boutons favoris, partager, visite */}
                {user && (
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginVertical: 12,
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => toggleFavori(selectedBien.id)}
                      style={[styles.btn, { flex: 1, marginRight: 4 }]}
                    >
                      <Text style={{ color: "white", fontWeight: "bold" }}>
                        {favorites[selectedBien.id] ? "❤️ Favori" : "🤍 Favori"}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={shareBien}
                      style={[styles.btn, { flex: 1, marginHorizontal: 4 }]}
                    >
                      <Text style={{ color: "white", fontWeight: "bold" }}>
                        🔗 Partager
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setShowCalendar(true)}
                      style={[styles.btn, { flex: 1, marginLeft: 4 }]}
                    >
                      <Text style={{ color: "white", fontWeight: "bold" }}>
                        📅 Visite
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                <DateTimePickerModal
                  isVisible={showCalendar}
                  mode="date"
                  onConfirm={handleConfirm}
                  onCancel={() => setShowCalendar(false)}
                  minimumDate={new Date()}
                  headerTextIOS="Choisissez une date"
                  cancelTextIOS="Annuler"
                  confirmTextIOS="Valider"
                />

                <TouchableOpacity
                  onPress={() => setSelectedBien(null)}
                  style={[styles.btnfermer, { marginVertical: 12 }]}
                >
                  <Text style={{ color: "white", fontWeight: "bold" }}>
                    Fermer
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  search: { padding: 12, borderRadius: 8, marginBottom: 20, fontSize: 16 },
  categories: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 5,
    gap: 8,
  },
  catBtn: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20 },
  card: {
    borderRadius: 12,
    margin: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  image: {
    width: "100%",
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  badges: {
    position: "absolute",
    top: 10,
    left: 10,
    flexDirection: "row",
    gap: 5,
  },
  badge: {
    color: "white",
    fontWeight: "bold",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: "hidden",
  },
  title: { fontSize: 18, fontWeight: "bold", marginVertical: 2 },
  desc: { fontSize: 14 },
  price: { fontSize: 16, fontWeight: "bold" },
  btn: {
    backgroundColor: "green",
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 6,
  },
  btnfermer: {
    backgroundColor: "red",
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 6,
  },
  favBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    borderRadius: 12,
    padding: 12,
    maxHeight: "90%",
  },
  mainImage: { width: "100%", height: 200, borderRadius: 12 },
  thumb: { width: 60, height: 60, marginRight: 8, borderRadius: 6 },
  contactBtn: {
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  section: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 25,
    fontWeight: "bold",
    marginBottom: 4,
    marginTop: 30,
  },
});
