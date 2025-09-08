import { MaterialIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../ThemeContext";

type Notification = {
  id: string;
  title: string;
  message: string;
  time: string;
};

export default function Notifications() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [search, setSearch] = useState("");
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      title: "Nouvelle mise à jour",
      message: "La version 2.0 est dispo 🎉",
      time: "Il y a 2h",
    },
    {
      id: "2",
      title: "Promotion spéciale",
      message: "Profitez de -20% sur votre abonnement",
      time: "Hier",
    },
    {
      id: "3",
      title: "Message système",
      message: "Votre mot de passe expire bientôt",
      time: "Il y a 3 jours",
    },
  ]);

  const [selected, setSelected] = useState<string[]>([]);
  const [multiSelect, setMultiSelect] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null); // id de notif avec menu ouvert

  const filtered = notifications.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.message.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((s) => s !== id));
    } else {
      setSelected([...selected, id]);
    }
  };

  const deleteOne = (id: string) => {
    setNotifications(notifications.filter((n) => n.id !== id));
    setSelected(selected.filter((s) => s !== id));
    setMenuOpen(null);
  };

  const deleteSelected = () => {
    setNotifications(notifications.filter((n) => !selected.includes(n.id)));
    setSelected([]);
    setMultiSelect(false);
  };

  const cancelSelection = () => {
    setSelected([]);
    setMultiSelect(false);
  };

  const renderItem = ({ item }: { item: Notification }) => {
    const isSelected = selected.includes(item.id);

    const handlePress = () => {
      if (multiSelect) {
        toggleSelect(item.id); // 👉 clique simple sélectionne/désélectionne
      } else {
        // ici tu peux ajouter l’action normale (ex: ouvrir notif)
        console.log("Notification ouverte:", item.title);
      }
    };

    return (
      <TouchableOpacity
        onLongPress={() => {
          setMultiSelect(true);
          toggleSelect(item.id);
        }}
        onPress={handlePress} // 👉 ajout
        activeOpacity={0.8}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: isSelected
                ? isDark
                  ? "#333"
                  : "#d4f5d4"
                : isDark
                ? "#222"
                : "#f9f9f9",
            },
          ]}
        >
          <View style={styles.cardHeader}>
            {multiSelect && (
              <MaterialIcons
                name={isSelected ? "check-box" : "check-box-outline-blank"}
                size={24}
                color={isDark ? "white" : "green"}
              />
            )}

            <MaterialIcons
              name="notifications"
              size={24}
              color={isDark ? "white" : "green"}
            />
            <Text
              style={[
                styles.cardTitle,
                { color: isDark ? "#fff" : "#000", flex: 1 },
              ]}
            >
              {item.title}
            </Text>

            {!multiSelect && (
              <View style={{ position: "relative" }}>
                <TouchableOpacity
                  onPress={() =>
                    setMenuOpen(menuOpen === item.id ? null : item.id)
                  }
                >
                  <MaterialIcons
                    name="more-vert"
                    size={24}
                    color={isDark ? "#fff" : "#000"}
                  />
                </TouchableOpacity>

                {/* Menu flottant */}
                {menuOpen === item.id && (
                  <View
                    style={[
                      styles.menu,
                      { backgroundColor: isDark ? "#333" : "#fff" },
                    ]}
                  >
                    <TouchableOpacity
                      onPress={() => deleteOne(item.id)}
                      style={styles.menuItem}
                    >
                      <MaterialIcons
                        name="delete"
                        size={20}
                        color="red"
                        style={{ marginRight: 6 }}
                      />
                      <Text style={{ color: "red", fontWeight: "bold" }}>
                        Supprimer
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>

          <Text
            style={[styles.cardMessage, { color: isDark ? "#ccc" : "#333" }]}
          >
            {item.message}
          </Text>
          <Text style={[styles.cardTime, { color: isDark ? "#aaa" : "#666" }]}>
            {item.time}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[styles.container, { backgroundColor: isDark ? "#000" : "#fff" }]}
    >
      <TextInput
        style={[
          styles.searchInput,
          {
            backgroundColor: isDark ? "#222" : "#f2f2f2",
            color: isDark ? "#fff" : "#000",
          },
        ]}
        placeholder="Rechercher une notification..."
        placeholderTextColor={isDark ? "#888" : "#666"}
        value={search}
        onChangeText={setSearch}
      />

      {multiSelect && selected.length > 0 && (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: "red" }]}
            onPress={deleteSelected}
          >
            <MaterialIcons name="delete-forever" size={22} color="white" />
            <Text style={styles.actionText}>Supprimer ({selected.length})</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: "gray" }]}
            onPress={cancelSelection}
          >
            <MaterialIcons name="cancel" size={22} color="white" />
            <Text style={styles.actionText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text
            style={{
              textAlign: "center",
              marginTop: 20,
              color: isDark ? "#aaa" : "#555",
            }}
          >
            Aucune notification trouvée
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  searchInput: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 16,
  },
  listContent: { paddingBottom: 20 },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 8,
  },
  cardTitle: { fontSize: 18, fontWeight: "bold" },
  cardMessage: { fontSize: 15, marginBottom: 4 },
  cardTime: { fontSize: 13, fontStyle: "italic" },

  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 8,
    flex: 1,
    justifyContent: "center",
    marginHorizontal: 5,
  },
  actionText: {
    color: "white",
    fontWeight: "bold",
    marginLeft: 6,
    fontSize: 16,
  },

  menu: {
    position: "absolute",
    top: 40,
    right: 0,
    width: 120,
    padding: 8,
    borderRadius: 6,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
  },
});
