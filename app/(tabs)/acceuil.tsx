import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
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
import Config from "react-native-config";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import Icon from "react-native-vector-icons/FontAwesome";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../ThemeContext";

const categories = [
  "Maison",
  "Appartement",
  "GuestHouse",
  "Immeuble",
  "Boutique",
];
console.error(Config.BACKEND_URL);

export const biensData = [
  {
    id: "1",
    titre: "Maison traditionnelle en campagne",
    prix: 120000,
    type: "Maison",
    status: "A Louer",
    dispo: "Disponible",
    images: [
      "https://picsum.photos/400/250?random=1",
      "https://picsum.photos/400/250?random=2",
    ],
    desc: "Charmante maison traditionnelle dans un cadre calme et verdoyant.",
    visites: 50,
    surface: 110,
    photosCount: 5,
    location: "Cotonou",
    agent: { name: "Jean", phone: "12345678" },
  },
  {
    id: "2",
    titre: "Maison moderne avec piscine",
    prix: 350000,
    type: "Maison",
    status: "A Vendre",
    dispo: "Disponible",
    images: [
      "https://picsum.photos/400/250?random=3",
      "https://picsum.photos/400/250?random=4",
    ],
    desc: "Villa moderne avec piscine et grandes baies vitrées.",
    visites: 80,
    surface: 200,
    photosCount: 10,
    location: "Porto-Novo",
    agent: { name: "Marie", phone: "87654321" },
  },
  {
    id: "3",
    titre: "Maison en bord de mer",
    prix: 500000,
    type: "Appartement",
    status: "A Louer",
    dispo: "Disponible",
    images: [
      "https://picsum.photos/400/250?random=5",
      "https://picsum.photos/400/250?random=6",
    ],
    desc: "Superbe maison avec vue sur la mer et accès direct à la plage.",
    visites: 120,
    surface: 150,
    photosCount: 8,
    location: "Grand-Popo",
    agent: { name: "Paul", phone: "11223344" },
  },
  {
    id: "4",
    titre: "Maison en bois dans un champ",
    prix: 90000,
    type: "GuestHouse",
    status: "A Louer",
    dispo: "Disponible",
    images: [
      "https://picsum.photos/400/250?random=7",
      "https://picsum.photos/400/250?random=8",
    ],
    desc: "Maison en bois confortable dans un environnement naturel.",
    visites: 30,
    surface: 80,
    photosCount: 6,
    location: "Abomey-Calavi",
    agent: { name: "Alice", phone: "33445566" },
  },
  {
    id: "5",
    titre: "Maison en bambou",
    prix: 70000,
    type: "Maison",
    status: "A Louer",
    dispo: "Disponible",
    images: [
      "https://picsum.photos/400/250?random=9",
      "https://picsum.photos/400/250?random=10",
    ],
    desc: "Maison écologique et originale construite en bambou.",
    visites: 45,
    surface: 60,
    photosCount: 4,
    location: "Ouidah",
    agent: { name: "David", phone: "44556677" },
  },
  {
    id: "6",
    titre: "Maison en pierre traditionnelle",
    prix: 180000,
    type: "Maison",
    status: "A Vendre",
    dispo: "Disponible",
    images: [
      "https://picsum.photos/400/250?random=11",
      "https://picsum.photos/400/250?random=12",
    ],
    desc: "Maison en pierre typique avec beaucoup de charme.",
    visites: 60,
    surface: 120,
    photosCount: 7,
    location: "Dassa-Zoumé",
    agent: { name: "Emilie", phone: "55667788" },
  },
  {
    id: "7",
    titre: "Maison de ville moderne",
    prix: 220000,
    type: "Appartement",
    status: "A Louer",
    dispo: "Disponible",
    images: [
      "https://picsum.photos/400/250?random=13",
      "https://picsum.photos/400/250?random=14",
    ],
    desc: "Appartement moderne dans une maison de ville.",
    visites: 90,
    surface: 100,
    photosCount: 6,
    location: "Cotonou",
    agent: { name: "Jacques", phone: "66778899" },
  },
  {
    id: "8",
    titre: "Maison avec jardin",
    prix: 160000,
    type: "Maison",
    status: "A Louer",
    dispo: "Disponible",
    images: [
      "https://picsum.photos/400/250?random=15",
      "https://picsum.photos/400/250?random=16",
    ],
    desc: "Maison accueillante avec jardin privatif.",
    visites: 70,
    surface: 110,
    photosCount: 5,
    location: "Porto-Novo",
    agent: { name: "Laura", phone: "77889900" },
  },
  {
    id: "9",
    titre: "Maison en bord de lac",
    prix: 300000,
    type: "Maison",
    status: "A Vendre",
    dispo: "Disponible",
    images: [
      "https://picsum.photos/400/250?random=17",
      "https://picsum.photos/400/250?random=18",
    ],
    desc: "Maison spacieuse avec une vue magnifique sur le lac.",
    visites: 110,
    surface: 180,
    photosCount: 9,
    location: "Lokossa",
    agent: { name: "Michel", phone: "88990011" },
  },
  {
    id: "10",
    titre: "Maison avec toit en chaume",
    prix: 95000,
    type: "GuestHouse",
    status: "A Louer",
    dispo: "Disponible",
    images: [
      "https://picsum.photos/400/250?random=19",
      "https://picsum.photos/400/250?random=20",
    ],
    desc: "Charmante maison avec toit traditionnel en chaume.",
    visites: 40,
    surface: 70,
    photosCount: 4,
    location: "Abomey-Calavi",
    agent: { name: "Sophie", phone: "99001122" },
  },
  {
    id: "11",
    titre: "Maison contemporaine",
    prix: 400000,
    type: "Appartement",
    status: "A Vendre",
    dispo: "Disponible",
    images: [
      "https://picsum.photos/400/250?random=21",
      "https://picsum.photos/400/250?random=22",
    ],
    desc: "Maison contemporaine avec design épuré.",
    visites: 150,
    surface: 210,
    photosCount: 12,
    location: "Cotonou",
    agent: { name: "Lucas", phone: "11122233" },
  },
  {
    id: "12",
    titre: "Maison en bois dans la forêt",
    prix: 85000,
    type: "Maison",
    status: "A Louer",
    dispo: "Disponible",
    images: [
      "https://picsum.photos/400/250?random=23",
      "https://picsum.photos/400/250?random=24",
    ],
    desc: "Maison isolée en bois dans un environnement forestier.",
    visites: 35,
    surface: 75,
    photosCount: 5,
    location: "Djougou",
    agent: { name: "Nina", phone: "22233344" },
  },
  {
    id: "13",
    titre: "Maison avec vue sur la montagne",
    prix: 270000,
    type: "Maison",
    status: "A Vendre",
    dispo: "Disponible",
    images: [
      "https://picsum.photos/400/250?random=25",
      "https://picsum.photos/400/250?random=26",
    ],
    desc: "Maison avec une vue imprenable sur les montagnes.",
    visites: 95,
    surface: 160,
    photosCount: 8,
    location: "Natitingou",
    agent: { name: "Thomas", phone: "33344455" },
  },
  {
    id: "14",
    titre: "Maison en bord de rivière",
    prix: 180000,
    type: "Maison",
    status: "A Louer",
    dispo: "Disponible",
    images: [
      "https://picsum.photos/400/250?random=27",
      "https://picsum.photos/400/250?random=28",
    ],
    desc: "Maison pittoresque située au bord de la rivière.",
    visites: 60,
    surface: 120,
    photosCount: 6,
    location: "Lokossa",
    agent: { name: "Isabelle", phone: "44455566" },
  },
  {
    id: "15",
    titre: "Maison avec terrasse",
    prix: 220000,
    type: "Appartement",
    status: "A Vendre",
    dispo: "Disponible",
    images: [
      "https://picsum.photos/400/250?random=29",
      "https://picsum.photos/400/250?random=30",
    ],
    desc: "Maison avec grande terrasse et lumière naturelle.",
    visites: 100,
    surface: 150,
    photosCount: 9,
    location: "Cotonou",
    agent: { name: "Caroline", phone: "55566677" },
  },
  {
    id: "16",
    titre: "Maison avec piscine extérieure",
    prix: 330000,
    type: "Maison",
    status: "A Vendre",
    dispo: "Disponible",
    images: [
      "https://picsum.photos/400/250?random=31",
      "https://picsum.photos/400/250?random=32",
    ],
    desc: "Villa luxueuse avec piscine extérieure et jardin.",
    visites: 130,
    surface: 200,
    photosCount: 10,
    location: "Ouidah",
    agent: { name: "Antoine", phone: "66677788" },
  },
  {
    id: "17",
    titre: "Maison avec jardin tropical",
    prix: 190000,
    type: "Maison",
    status: "A Louer",
    dispo: "Disponible",
    images: [
      "https://picsum.photos/400/250?random=33",
      "https://picsum.photos/400/250?random=34",
    ],
    desc: "Maison entourée d'un jardin tropical luxuriant.",
    visites: 75,
    surface: 130,
    photosCount: 7,
    location: "Grand-Popo",
    agent: { name: "Lucie", phone: "77788899" },
  },
  {
    id: "18",
    titre: "Maison en bord de plage",
    prix: 380000,
    type: "Maison",
    status: "A Vendre",
    dispo: "Disponible",
    images: [
      "https://picsum.photos/400/250?random=35",
      "https://picsum.photos/400/250?random=36",
    ],
    desc: "Maison directement sur la plage avec vue imprenable.",
    visites: 160,
    surface: 180,
    photosCount: 10,
    location: "Ouidah",
    agent: { name: "Kevin", phone: "88899900" },
  },
  {
    id: "19",
    titre: "Maison avec vue panoramique",
    prix: 420000,
    type: "Appartement",
    status: "A Vendre",
    dispo: "Disponible",
    images: [
      "https://picsum.photos/400/250?random=37",
      "https://picsum.photos/400/250?random=38",
    ],
    desc: "Maison offrant une vue panoramique sur la ville et la mer.",
    visites: 180,
    surface: 220,
    photosCount: 12,
    location: "Cotonou",
    agent: { name: "Sandra", phone: "99900011" },
  },
  {
    id: "20",
    titre: "Maison en pierre dans un village",
    prix: 110000,
    type: "GuestHouse",
    status: "A Louer",
    dispo: "Disponible",
    images: [
      "https://picsum.photos/400/250?random=39",
      "https://picsum.photos/400/250?random=40",
    ],
    desc: "Maison en pierre traditionnelle dans un petit village pittoresque.",
    visites: 55,
    surface: 90,
    photosCount: 5,
    location: "Dassa-Zoumé",
    agent: { name: "Hélène", phone: "00011122" },
  },
];

export default function Acceuil() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const router = useRouter();
  const { user } = useAuth();

  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [favori, setFavori] = useState<{ [key: string]: boolean }>({});
  const [selectedBien, setSelectedBien] = useState<any>(null);
  const [currentImg, setCurrentImg] = useState(0);
  const [showCalendar, setShowCalendar] = useState(false);

  const filtered = biensData.filter(
    (b) =>
      (!activeCat || b.type === activeCat) &&
      (b.titre.toLowerCase().includes(search.toLowerCase()) ||
        b.desc.toLowerCase().includes(search.toLowerCase()))
  );

  const recents = filtered.slice(0, 5);
  const visites = [...filtered].sort((a, b) => b.visites - a.visites);
  const eco = [...filtered]
    .sort((a, b) => a.prix - b.prix)
    .slice(0, filtered.length - 2);
  const autres = filtered.slice(5);

  const toggleFavori = (id: string) => {
    setFavori((prev) => ({ ...prev, [id]: !prev[id] }));
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
            >
              <Icon
                name={favori[item.id] ? "heart" : "heart-o"}
                size={20}
                color={favori[item.id] ? "red" : isDark ? "#fff" : "#888"}
              />
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
                  Publié récemment
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
                        {favori[selectedBien.id] ? "❤️ Favori" : "🤍 Favori"}
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
