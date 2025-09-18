import { useNavigation } from "@react-navigation/native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/FontAwesome";
import api, { API_BASE_URL } from "../../contexts/api";
import { useAuth } from "../../contexts/AuthContext";
import BienDetailModal from "../components/BienDetailModal";
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

export default function Acceuil() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { user } = useAuth();
  const navigation = useNavigation();

  const [biens, setBiens] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingFavorite, setProcessingFavorite] = useState<string | null>(
    null
  );
  const [selectedBienId, setSelectedBienId] = useState<string | null>(null);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
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
        images: b.images?.length
          ? b.images.map(
              (img: any) => `${API_BASE_URL}/agence/files/${img.url}`
            )
          : [
              b.firstImage
                ? `${API_BASE_URL}/agence/files/${b.firstImage}`
                : `https://picsum.photos/seed/${b.id}/400/250`,
            ],
      }));
      if (isMounted.current) {
        setBiens(mappedBiens);
      }
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
    if (processingFavorite === id) return;
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
    setFavorites((prev) => ({ ...prev, [id]: !originalState }));
    try {
      await api.post("/users/like", { bienId: id });
      Toast.show({
        type: "success",
        text1: "Favoris mis à jour",
        text2: !originalState ? "Ajouté aux favoris" : "Retiré des favoris",
      });
    } catch (err) {
      setFavorites((prev) => ({ ...prev, [id]: originalState }));
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

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: isDark ? "#000" : "#fff" },
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
          styles.loadingContainer,
          { backgroundColor: isDark ? "#000" : "#fff" },
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
      (search === "" || b.titre.toLowerCase().includes(search.toLowerCase()))
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

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 6,
          }}
        >
          <TouchableOpacity
            style={styles.btn}
            onPress={() => setSelectedBienId(item.id)}
          >
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
                <ActivityIndicator
                  size="small"
                  color={isDark ? "#fff" : "#888"}
                />
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
    <>
      <ScrollView
        style={[
          styles.container,
          { backgroundColor: isDark ? "#000" : "#fff" },
        ]}
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

        <Text
          style={[styles.sectionTitle, { color: isDark ? "#fff" : "#000" }]}
        >
          🏡 Biens récents
        </Text>
        <FlatList
          data={recents}
          renderItem={({ item }) => <BienCard item={item} />}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
        />

        <Text
          style={[styles.sectionTitle, { color: isDark ? "#fff" : "#000" }]}
        >
          🔥 Les plus visités
        </Text>
        {visites.map((item) => (
          <BienCard key={item.id} item={item} fullWidth />
        ))}

        <Text
          style={[styles.sectionTitle, { color: isDark ? "#fff" : "#000" }]}
        >
          💸 Prix éco loyer pas cher
        </Text>
        <FlatList
          data={eco}
          renderItem={({ item }) => <BienCard item={item} />}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
        />

        <Text
          style={[styles.sectionTitle, { color: isDark ? "#fff" : "#000" }]}
        >
          📦 Autres biens
        </Text>
        {autres.map((item) => (
          <BienCard key={item.id} item={item} fullWidth />
        ))}
      </ScrollView>
      <BienDetailModal
        bienId={selectedBienId}
        isVisible={!!selectedBienId}
        onClose={() => setSelectedBienId(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: "hidden",
    fontSize: 12,
  },
  title: { fontSize: 18, fontWeight: "bold", marginVertical: 2 },
  price: { fontSize: 16, fontWeight: "bold" },
  btn: {
    backgroundColor: "green",
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
  sectionTitle: {
    fontSize: 25,
    fontWeight: "bold",
    marginBottom: 4,
    marginTop: 30,
  },
});
