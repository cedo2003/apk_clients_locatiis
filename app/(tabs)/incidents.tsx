import { MaterialIcons } from "@expo/vector-icons";
import {
  faCalendarAlt,
  faCamera,
  faCheck,
  faCheckCircle,
  faCog,
  faExclamationTriangle,
  faEye,
  faFileAlt,
  faHome,
  faHourglass,
  faMicrophone,
  faPencilAlt,
  faPlus,
  faTimes,
  faTools,
  faTrash,
  faUpload,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { Picker } from "@react-native-picker/picker";
import { Audio } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import Modal from "react-native-modal";
import Toast from "react-native-toast-message";
import api from "../../contexts/api";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../ThemeContext";

// Placeholder for default image
const PlaceholderImage = require("../../assets/Default-Picture.png");

// EmptyState component
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

export const IncidentStatus = {
  EN_ATTENTE: "EN_ATTENTE",
  EN_COURS: "EN_COURS",
  RESOLU: "RESOLU",
};

const Incidents = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const router = useRouter();
  const { bienId: preselectedBienId } = useLocalSearchParams();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [properties, setProperties] = useState({});
  const [filter, setFilter] = useState("all");
  const [isFetchingProperties, setIsFetchingProperties] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [incidentToDelete, setIncidentToDelete] = useState(null);
  const [deletingIncident, setDeletingIncident] = useState(false);
  const [resolvingIncident, setResolvingIncident] = useState(null);
  const [activeTab, setActiveTab] = useState("list");

  // Form states
  const [types, setTypes] = useState([]);
  const [contrats, setContrats] = useState([]);
  const [biens, setBiens] = useState({});
  const [formData, setFormData] = useState({
    typeProblemeId: "",
    bienId: preselectedBienId || "",
    description: "",
    incidentDate: new Date(),
    photo: null,
  });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [recording, setRecording] = useState(null);
  const [audioUri, setAudioUri] = useState(null);
  const [recordDuration, setRecordDuration] = useState(0);
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioPosition, setAudioPosition] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const recordingInterval = useRef(null);
  const MAX_DURATION = 60;

  // Fetch problem types
  const fetchTypes = useCallback(async () => {
    try {
      const { data } = await api.get("/users/findAllTypeProbleme");
      setTypes(data);
    } catch (error) {
      console.error("Error fetching problem types:", error);
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Impossible de charger les types de problèmes.",
      });
      setError("Impossible de charger les types de problèmes.");
    }
  }, []);

  // Fetch contracts and associated properties
  const fetchContratsAndBiens = useCallback(async () => {
    try {
      const { data } = await api.get("/contrats/locataireContrats");
      setContrats(data);

      const uniqueBienIds = [...new Set(data.map((contrat) => contrat.bienId))];
      const bienRequests = uniqueBienIds.map((bienId) =>
        api.get(`/bien/${bienId}`)
      );
      const bienResponses = await Promise.all(bienRequests);

      const biensMap = {};
      bienResponses.forEach((res) => {
        const bien = res.data;
        biensMap[bien.id] = bien;
      });
      setBiens(biensMap);
    } catch (error) {
      console.error("Error fetching contrats and biens:", error);
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Impossible de charger vos contrats et biens.",
      });
      setError("Impossible de charger vos contrats et biens.");
    }
  }, []);

  // Fetch properties for incidents
  const fetchProperties = useCallback(async (propertyIds) => {
    setIsFetchingProperties(true);
    const propertyData = {};
    try {
      await Promise.all(
        propertyIds.map(async (id) => {
          try {
            const { data } = await api.get(`/bien/${id}`);
            propertyData[id] = data;
          } catch (error) {
            console.error(`Error fetching property ${id}:`, error);
            propertyData[id] = { titre: `Bien #${id}` };
          }
        })
      );
      setProperties(propertyData);
    } catch (error) {
      console.error("Error fetching properties:", error);
    } finally {
      setIsFetchingProperties(false);
    }
  }, []);

  // Fetch incidents
  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get("/users/incidents");
      setIncidents(
        data.map((inc) => ({
          ...inc,
          isPlaying: false,
          audioPosition: 0,
          audioDuration: 0,
        }))
      );
      if (data.length > 0) {
        const uniquePropertyIds = [
          ...new Set(data.map((incident) => incident.bienId)),
        ];
        await fetchProperties(uniquePropertyIds);
      }
    } catch (err) {
      console.error("Error fetching incidents:", err);
      setError("Impossible de charger vos incidents.");
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Impossible de charger vos incidents.",
      });
    } finally {
      setLoading(false);
    }
  }, [user, fetchProperties]);

  // Start recording
  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission refusée", "Autorisez l'accès au micro");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );
      await rec.startAsync();
      setRecording(rec);
      setRecordDuration(0);

      recordingInterval.current = setInterval(() => {
        setRecordDuration((prev) => {
          if (prev + 1 >= MAX_DURATION) {
            stopRecording();
            return MAX_DURATION;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error(err);
      Alert.alert("Erreur", "Impossible de démarrer l'enregistrement");
    }
  };

  // Stop recording
  const stopRecording = async () => {
    if (!recording) return;
    try {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
        recordingInterval.current = null;
      }

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (uri) setAudioUri(uri);
      setRecording(null);
    } catch (err) {
      console.error(err);
      Alert.alert("Erreur", "Impossible d'arrêter l'enregistrement");
    }
  };

  // Play audio
  const playAudio = async (uri, index = null) => {
    try {
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
        if (index !== null && incidents[index]) {
          incidents[index].isPlaying = false;
          setIncidents([...incidents]);
        } else {
          setIsPlaying(false);
        }
      }

      const { sound: newSound, status } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true, volume: 1.0 }
      );

      setSound(newSound);
      if (index !== null) {
        setIncidents((prev) =>
          prev.map((inc, i) =>
            i === index
              ? {
                  ...inc,
                  isPlaying: true,
                  audioDuration: status.durationMillis || 0,
                }
              : { ...inc, isPlaying: false }
          )
        );
      } else {
        setIsPlaying(true);
        setAudioDuration(status.durationMillis || 0);
      }

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;
        if (index !== null) {
          setIncidents((prev) =>
            prev.map((inc, i) =>
              i === index
                ? {
                    ...inc,
                    isPlaying: status.isPlaying,
                    audioPosition: status.positionMillis,
                  }
                : inc
            )
          );
        } else {
          setIsPlaying(status.isPlaying);
          setAudioPosition(status.positionMillis);
        }

        if (status.didJustFinish) {
          if (index !== null) {
            setIncidents((prev) =>
              prev.map((inc, i) =>
                i === index
                  ? { ...inc, isPlaying: false, audioPosition: 0 }
                  : inc
              )
            );
          } else {
            setIsPlaying(false);
            setAudioPosition(0);
          }
          newSound.stopAsync();
        }
      });

      await newSound.playAsync();
    } catch (err) {
      console.error(err);
    }
  };

  // Pick image
  const pickImage = async () => {
    if (formData.photo) {
      Alert.alert("Limite atteinte", "Vous pouvez ajouter une seule photo.");
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission refusée", "Autorisez l'accès à la galerie");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setFormData((prev) => ({ ...prev, photo: result.assets[0] }));
      setPhotoPreview(result.assets[0].uri);
    }
  };

  // Clear photo
  const clearPhoto = () => {
    setFormData((prev) => ({ ...prev, photo: null }));
    setPhotoPreview(null);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      typeProblemeId: "",
      bienId: preselectedBienId || "",
      description: "",
      incidentDate: new Date(),
      photo: null,
    });
    setPhotoPreview(null);
    setAudioUri(null);
    setRecordDuration(0);
    setAudioPosition(0);
    setAudioDuration(0);
    if (sound) {
      sound.stopAsync();
      sound.unloadAsync();
      setSound(null);
    }
  };

  // Submit incident
  const handleSubmit = async () => {
    if (!formData.typeProblemeId || !formData.bienId || !formData.description) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs obligatoires.");
      return;
    }

    setSubmitting(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("typeProblemeId", formData.typeProblemeId);
      formDataToSend.append("bienId", formData.bienId);
      formDataToSend.append("description", formData.description);
      formDataToSend.append(
        "incidentDate",
        formData.incidentDate.toISOString()
      );
      if (formData.photo) {
        formDataToSend.append("photo", {
          uri: formData.photo.uri,
          type: "image/jpeg",
          name: "incident_photo.jpg",
        });
      }
      if (audioUri) {
        formDataToSend.append("audio", {
          uri: audioUri,
          type: "audio/m4a",
          name: "incident_audio.m4a",
        });
      }

      await api.post("/users/incidents", formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      Toast.show({
        type: "success",
        text1: "Succès",
        text2: "Incident signalé avec succès !",
      });
      resetForm();
      setActiveTab("list");
      fetchIncidents();
    } catch (err) {
      console.error("Error submitting incident:", err);
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Impossible de soumettre l'incident. Veuillez réessayer.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete incident
  const handleDeleteClick = (incident) => {
    setIncidentToDelete(incident);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!incidentToDelete) return;
    setDeletingIncident(true);
    try {
      await api.delete(`/users/incidents/${incidentToDelete.id}`);
      setIncidents((prev) =>
        prev.filter((inc) => inc.id !== incidentToDelete.id)
      );
      Toast.show({
        type: "success",
        text1: "Succès",
        text2: "Incident supprimé avec succès.",
      });
      setShowDeleteConfirm(false);
      setIncidentToDelete(null);
    } catch (err) {
      console.error("Error deleting incident:", err);
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Erreur lors de la suppression de l'incident.",
      });
    } finally {
      setDeletingIncident(false);
    }
  };

  // Resolve incident
  const handleResolveIncident = async (incidentId) => {
    setResolvingIncident(incidentId);
    try {
      await api.post("/users/resolveIncident", { id: incidentId });
      setIncidents((prev) =>
        prev.map((incident) =>
          incident.id === incidentId
            ? {
                ...incident,
                statut: IncidentStatus.RESOLU,
                dateResolution: new Date(),
              }
            : incident
        )
      );
      Toast.show({
        type: "success",
        text1: "Succès",
        text2: "Incident marqué comme résolu avec succès.",
      });
    } catch (err) {
      console.error("Error resolving incident:", err);
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Erreur lors de la résolution de l'incident.",
      });
    } finally {
      setResolvingIncident(null);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId((prevId) => (prevId === id ? null : id));
  };

  // Filter incidents
  const getFilteredIncidents = () => {
    if (filter === "all") return incidents;
    const statusMap = {
      pending: IncidentStatus.EN_ATTENTE,
      inProgress: IncidentStatus.EN_COURS,
      resolved: IncidentStatus.RESOLU,
    };
    return incidents.filter(
      (incident) => incident.statut === statusMap[filter]
    );
  };

  // Initial data fetch
  useEffect(() => {
    if (!authLoading) {
      fetchIncidents();
      fetchTypes();
      fetchContratsAndBiens();
    }
    return () => {
      if (sound) sound.unloadAsync();
      if (recordingInterval.current) clearInterval(recordingInterval.current);
    };
  }, [authLoading, fetchIncidents, fetchTypes, fetchContratsAndBiens]);

  if (loading || authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={isDark ? "#fff" : "#16a34a"} />
        <Text
          style={[styles.loadingText, { color: isDark ? "#fff" : "#4b5563" }]}
        >
          Chargement des données...
        </Text>
      </View>
    );
  }

  if (error) {
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
          color="#f87171"
        />
        <Text
          style={[styles.errorText, { color: isDark ? "#f87171" : "#b91c1c" }]}
        >
          {error}
        </Text>
        <TouchableOpacity
          style={styles.errorButton}
          onPress={() => fetchIncidents()}
        >
          <Text style={styles.errorButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!user || incidents.length === 0) {
    return (
      <EmptyState
        icon={
          <FontAwesomeIcon
            icon={faExclamationTriangle}
            size={48}
            color={isDark ? "#fb923c" : "#f97316"}
          />
        }
        title="Aucun incident signalé"
        description="Vous n'avez pas encore signalé d'incidents pour vos biens loués."
        actionText="Signaler un incident"
        actionLink="/signalerIncident"
      />
    );
  }

  const filteredIncidents = getFilteredIncidents();

  const renderIncident = ({ item: incident }) => {
    const property = properties[incident.bienId] || {
      titre: `Bien #${incident.bienId}`,
    };
    const canModify = incident.statut === IncidentStatus.EN_ATTENTE;

    let statusIcon, statusText, statusColor, statusTextColor;
    switch (incident.statut) {
      case IncidentStatus.EN_COURS:
        statusIcon = faCog;
        statusText = "En cours";
        statusColor = isDark ? "#1e40af" : "#dbeafe";
        statusTextColor = isDark ? "#60a5fa" : "#1e40af";
        break;
      case IncidentStatus.RESOLU:
        statusIcon = faCheckCircle;
        statusText = "Résolu";
        statusColor = isDark ? "#15803d" : "#dcfce7";
        statusTextColor = isDark ? "#22c55e" : "#15803d";
        break;
      default:
        statusIcon = faHourglass;
        statusText = "En attente";
        statusColor = isDark ? "#c2410c" : "#ffedd5";
        statusTextColor = isDark ? "#f97316" : "#c2410c";
    }

    const incidentDate = incident.incidentDate
      ? new Date(incident.incidentDate).toLocaleDateString("fr-FR", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : incident.dateResolution
      ? new Date(incident.dateResolution).toLocaleDateString("fr-FR", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "Date non spécifiée";

    return (
      <View
        style={[
          styles.incidentCard,
          { backgroundColor: isDark ? "#1f2937" : "#fff" },
        ]}
      >
        <View style={styles.incidentHeader}>
          <View style={styles.incidentTitleContainer}>
            <FontAwesomeIcon
              icon={faTools}
              size={20}
              color={isDark ? "#d1d5db" : "#6b7280"}
            />
            <View>
              <Text
                style={[
                  styles.incidentTitle,
                  { color: isDark ? "#fff" : "#1f2937" },
                ]}
              >
                {incident.typeProbleme?.nom || "Incident"}
              </Text>
              <View style={styles.incidentInfo}>
                <FontAwesomeIcon
                  icon={faHome}
                  size={16}
                  color={isDark ? "#d1d5db" : "#6b7280"}
                />
                <Text
                  style={[
                    styles.incidentInfoText,
                    { color: isDark ? "#d1d5db" : "#6b7280" },
                  ]}
                >
                  {isFetchingProperties ? "Chargement..." : property.titre}
                </Text>
              </View>
              <View style={styles.incidentInfo}>
                <FontAwesomeIcon
                  icon={faCalendarAlt}
                  size={16}
                  color={isDark ? "#d1d5db" : "#6b7280"}
                />
                <Text
                  style={[
                    styles.incidentInfoText,
                    { color: isDark ? "#d1d5db" : "#6b7280" },
                  ]}
                >
                  {incidentDate}
                </Text>
              </View>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <FontAwesomeIcon
              icon={statusIcon}
              size={16}
              color={statusTextColor}
            />
            <Text style={[styles.statusText, { color: statusTextColor }]}>
              {statusText}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.detailsButton}
          onPress={() => toggleExpand(incident.id)}
        >
          <FontAwesomeIcon
            icon={faEye}
            size={16}
            color={isDark ? "#60a5fa" : "#2563eb"}
          />
          <Text
            style={[
              styles.detailsButtonText,
              { color: isDark ? "#60a5fa" : "#2563eb" },
            ]}
          >
            {expandedId === incident.id
              ? "Masquer les détails"
              : "Voir les détails"}
          </Text>
        </TouchableOpacity>

        {expandedId === incident.id && (
          <View style={styles.detailsContainer}>
            <Text
              style={[
                styles.detailsTitle,
                { color: isDark ? "#fff" : "#1f2937" },
              ]}
            >
              Description
            </Text>
            <Text
              style={[
                styles.detailsText,
                { color: isDark ? "#d1d5db" : "#4b5563" },
              ]}
            >
              {incident.description || "Aucune description fournie."}
            </Text>

            {incident.photo && (
              <View style={styles.photoContainer}>
                <Text
                  style={[
                    styles.detailsTitle,
                    { color: isDark ? "#fff" : "#1f2937" },
                  ]}
                >
                  Photo
                </Text>
                <Image
                  source={{
                    uri: incident.photo.startsWith("https")
                      ? incident.photo
                      : `${api.defaults.baseURL}/agence/files/${incident.photo}`,
                  }}
                  style={styles.photo}
                  resizeMode="cover"
                  onError={() => PlaceholderImage}
                />
              </View>
            )}

            {incident.audio && (
              <View style={styles.audioContainer}>
                <Text
                  style={[
                    styles.detailsTitle,
                    { color: isDark ? "#fff" : "#1f2937" },
                  ]}
                >
                  Note vocale
                </Text>
                <TouchableOpacity
                  style={styles.playContainer}
                  onPress={() =>
                    playAudio(incident.audio, incidents.indexOf(incident))
                  }
                >
                  <Text style={{ color: "#2563eb", marginRight: 10 }}>
                    {incident.isPlaying ? "⏸️" : "▶"}
                  </Text>
                  <View style={styles.progressBarBackground}>
                    <View
                      style={[
                        styles.progressBarForeground,
                        {
                          width:
                            ((incident.audioPosition || 0) /
                              (incident.audioDuration || 1)) *
                            200,
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.audioText,
                      { color: isDark ? "#d1d5db" : "#4b5563", marginLeft: 10 },
                    ]}
                  >
                    {Math.floor((incident.audioPosition || 0) / 1000)}s
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {incident.dateResolution && (
              <View style={styles.detailItem}>
                <Text
                  style={[
                    styles.detailsTitle,
                    { color: isDark ? "#fff" : "#1f2937" },
                  ]}
                >
                  Date de résolution
                </Text>
                <Text
                  style={[
                    styles.detailsText,
                    { color: isDark ? "#d1d5db" : "#4b5563" },
                  ]}
                >
                  {new Date(incident.dateResolution).toLocaleDateString(
                    "fr-FR",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }
                  )}
                </Text>
              </View>
            )}

            {incident.coutReparation > 0 && (
              <View style={styles.detailItem}>
                <Text
                  style={[
                    styles.detailsTitle,
                    { color: isDark ? "#fff" : "#1f2937" },
                  ]}
                >
                  Coût de réparation
                </Text>
                <Text
                  style={[
                    styles.detailsText,
                    { color: isDark ? "#d1d5db" : "#4b5563" },
                  ]}
                >
                  {incident.coutReparation
                    .toString()
                    .replace(/\B(?=(\d{3})+(?!\d))/g, " ")}{" "}
                  FCFA
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.buttonContainer}>
          {incident.statut !== IncidentStatus.RESOLU && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                { borderColor: isDark ? "#4b5563" : "#d1d5db" },
              ]}
              onPress={() => router.push(`/modifierIncident/${incident.id}`)}
            >
              <FontAwesomeIcon
                icon={faPencilAlt}
                size={16}
                color={isDark ? "#fff" : "#374151"}
              />
              <Text
                style={[
                  styles.buttonText,
                  { color: isDark ? "#fff" : "#374151" },
                ]}
              >
                Modifier
              </Text>
            </TouchableOpacity>
          )}
          {incident.statut === IncidentStatus.EN_COURS && (
            <TouchableOpacity
              style={styles.resolveButton}
              onPress={() => handleResolveIncident(incident.id)}
              disabled={resolvingIncident === incident.id}
            >
              {resolvingIncident === incident.id ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <FontAwesomeIcon icon={faCheck} size={16} color="#fff" />
              )}
              <Text style={styles.buttonText}>Marquer comme résolu</Text>
            </TouchableOpacity>
          )}
          {canModify && (
            <TouchableOpacity
              style={[
                styles.deleteButton,
                { borderColor: isDark ? "#b91c1c" : "#ef4444" },
              ]}
              onPress={() => handleDeleteClick(incident)}
            >
              <FontAwesomeIcon
                icon={faTrash}
                size={16}
                color={isDark ? "#f87171" : "#ef4444"}
              />
              <Text
                style={[
                  styles.buttonText,
                  { color: isDark ? "#f87171" : "#ef4444" },
                ]}
              >
                Supprimer
              </Text>
            </TouchableOpacity>
          )}
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
        <Text
          style={[styles.headerTitle, { color: isDark ? "#fff" : "#1f2937" }]}
        >
          Mes Incidents et Réclamations
        </Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setActiveTab("form")}
        >
          <FontAwesomeIcon icon={faPlus} size={16} color="#fff" />
          <Text style={styles.addButtonText}>Signaler un incident</Text>
        </TouchableOpacity>
      </View>
      <Text
        style={[
          styles.headerSubtitle,
          { color: isDark ? "#d1d5db" : "#6b7280" },
        ]}
      >
        Suivez vos signalements et leur statut en temps réel.
      </Text>

      {activeTab === "form" ? (
        <ScrollView contentContainerStyle={styles.formContainer}>
          <View style={styles.formHeader}>
            <Text
              style={[styles.formTitle, { color: isDark ? "#fff" : "#1f2937" }]}
            >
              Signaler un Incident
            </Text>
            <Text
              style={[
                styles.formSubtitle,
                { color: isDark ? "#d1d5db" : "#6b7280" },
              ]}
            >
              Avez-vous rencontré un problème avec votre bien immobilier ?
              Remplissez ce formulaire pour signaler votre incident.
            </Text>
          </View>

          <View
            style={[
              styles.inputContainer,
              { backgroundColor: isDark ? "#1f2937" : "#fff" },
            ]}
          >
            <View style={styles.inputLabel}>
              <FontAwesomeIcon
                icon={faTools}
                size={16}
                color={isDark ? "#d1d5db" : "#6b7280"}
              />
              <Text
                style={[
                  styles.labelText,
                  { color: isDark ? "#d1d5db" : "#6b7280" },
                ]}
              >
                Type de problème
              </Text>
            </View>
            <Picker
              selectedValue={formData.typeProblemeId}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, typeProblemeId: value }))
              }
              style={[styles.picker, { color: isDark ? "#fff" : "#000" }]}
              dropdownIconColor={isDark ? "#fff" : "#000"}
            >
              <Picker.Item label="Sélectionner un type de problème" value="" />
              {types.map((type) => (
                <Picker.Item
                  key={type.id}
                  label={`${type.nom}${
                    type.description ? ` - ${type.description}` : ""
                  }`}
                  value={type.id}
                />
              ))}
            </Picker>
          </View>

          <View
            style={[
              styles.inputContainer,
              { backgroundColor: isDark ? "#1f2937" : "#fff" },
            ]}
          >
            <View style={styles.inputLabel}>
              <FontAwesomeIcon
                icon={faHome}
                size={16}
                color={isDark ? "#d1d5db" : "#6b7280"}
              />
              <Text
                style={[
                  styles.labelText,
                  { color: isDark ? "#d1d5db" : "#6b7280" },
                ]}
              >
                Bien concerné
              </Text>
            </View>
            <Picker
              selectedValue={formData.bienId}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, bienId: value }))
              }
              style={[styles.picker, { color: isDark ? "#fff" : "#000" }]}
              dropdownIconColor={isDark ? "#fff" : "#000"}
            >
              <Picker.Item label="Sélectionner un bien" value="" />
              {contrats.map((contrat) => {
                const bien = biens[contrat.bienId];
                return (
                  <Picker.Item
                    key={contrat.id}
                    label={bien ? bien.titre : `Bien #${contrat.bienId}`}
                    value={contrat.bienId}
                  />
                );
              })}
            </Picker>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputLabel}>
              <FontAwesomeIcon
                icon={faFileAlt}
                size={16}
                color={isDark ? "#d1d5db" : "#6b7280"}
              />
              <Text
                style={[
                  styles.labelText,
                  { color: isDark ? "#d1d5db" : "#6b7280" },
                ]}
              >
                Description
              </Text>
            </View>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: isDark ? "#374151" : "#f3f4f6",
                  color: isDark ? "#fff" : "#000",
                },
              ]}
              placeholder="Décrivez brièvement le problème..."
              placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
              multiline
              numberOfLines={4}
              value={formData.description}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, description: text }))
              }
            />
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputLabel}>
              <FontAwesomeIcon
                icon={faCalendarAlt}
                size={16}
                color={isDark ? "#d1d5db" : "#6b7280"}
              />
              <Text
                style={[
                  styles.labelText,
                  { color: isDark ? "#d1d5db" : "#6b7280" },
                ]}
              >
                Date de l'incident
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.dateInput,
                { backgroundColor: isDark ? "#374151" : "#f3f4f6" },
              ]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text
                style={[styles.dateText, { color: isDark ? "#fff" : "#000" }]}
              >
                {formData.incidentDate.toLocaleDateString("fr-FR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={formData.incidentDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    setFormData((prev) => ({
                      ...prev,
                      incidentDate: selectedDate,
                    }));
                  }
                }}
                maximumDate={new Date()}
              />
            )}
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputLabel}>
              <FontAwesomeIcon
                icon={faCamera}
                size={16}
                color={isDark ? "#d1d5db" : "#6b7280"}
              />
              <Text
                style={[
                  styles.labelText,
                  { color: isDark ? "#d1d5db" : "#6b7280" },
                ]}
              >
                Photo (optionnel)
              </Text>
            </View>
            {photoPreview ? (
              <View style={styles.photoPreviewContainer}>
                <Image
                  source={{ uri: photoPreview }}
                  style={styles.photoPreview}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={styles.clearPhotoButton}
                  onPress={clearPhoto}
                >
                  <FontAwesomeIcon icon={faTimes} size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.uploadContainer,
                  { borderColor: isDark ? "#4b5563" : "#d1d5db" },
                ]}
                onPress={pickImage}
              >
                <FontAwesomeIcon
                  icon={faUpload}
                  size={24}
                  color={isDark ? "#d1d5db" : "#6b7280"}
                />
                <Text
                  style={[
                    styles.uploadText,
                    { color: isDark ? "#d1d5db" : "#6b7280" },
                  ]}
                >
                  Cliquez pour ajouter une photo
                </Text>
                <Text
                  style={[
                    styles.uploadSubtext,
                    { color: isDark ? "#9ca3af" : "#9ca3af" },
                  ]}
                >
                  JPG, PNG ou GIF (max. 5MB)
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.audioContainer}>
            <View style={styles.inputLabel}>
              <FontAwesomeIcon
                icon={faMicrophone}
                size={16}
                color={isDark ? "#d1d5db" : "#6b7280"}
              />
              <Text
                style={[
                  styles.labelText,
                  { color: isDark ? "#d1d5db" : "#6b7280" },
                ]}
              >
                Note vocale (optionnel)
              </Text>
            </View>
            <View style={styles.audioControls}>
              <TouchableOpacity
                style={[
                  styles.audioButton,
                  { backgroundColor: recording ? "#ef4444" : "#16a34a" },
                ]}
                onPress={recording ? stopRecording : startRecording}
              >
                <MaterialIcons
                  name={recording ? "stop" : "keyboard-voice"}
                  size={28}
                  color="#fff"
                />
              </TouchableOpacity>
              <View style={styles.audioInfo}>
                {recording && (
                  <Text
                    style={[
                      styles.audioText,
                      { color: isDark ? "#fff" : "#1f2937" },
                    ]}
                  >
                    Enregistrement: {recordDuration}s
                  </Text>
                )}
                {audioUri && !recording && (
                  <>
                    <Text
                      style={[
                        styles.audioText,
                        { color: isDark ? "#fff" : "#1f2937" },
                      ]}
                    >
                      Note vocale
                    </Text>
                    <TouchableOpacity
                      style={styles.playContainer}
                      onPress={() => playAudio(audioUri)}
                    >
                      <Text style={{ color: "#2563eb", marginRight: 10 }}>
                        {isPlaying ? "⏸️" : "▶"}
                      </Text>
                      <View style={styles.progressBarBackground}>
                        <View
                          style={[
                            styles.progressBarForeground,
                            {
                              width:
                                (audioPosition / (audioDuration || 1)) * 200,
                            },
                          ]}
                        />
                      </View>
                      <Text
                        style={[
                          styles.audioText,
                          {
                            color: isDark ? "#d1d5db" : "#4b5563",
                            marginLeft: 10,
                          },
                        ]}
                      >
                        {Math.floor(audioPosition / 1000)}s
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          </View>

          <View style={styles.formButtonContainer}>
            <TouchableOpacity
              style={[
                styles.cancelButton,
                { borderColor: isDark ? "#4b5563" : "#d1d5db" },
              ]}
              onPress={resetForm}
              disabled={submitting}
            >
              <FontAwesomeIcon
                icon={faTimes}
                size={16}
                color={isDark ? "#fff" : "#374151"}
              />
              <Text
                style={[
                  styles.buttonText,
                  { color: isDark ? "#fff" : "#374151" },
                ]}
              >
                Annuler
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.buttonText}>Envoi en cours...</Text>
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faCheck} size={16} color="#fff" />
                  <Text style={styles.buttonText}>Soumettre</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <>
          <View style={styles.filterContainer}>
            {["all", "pending", "inProgress", "resolved"].map((f) => (
              <TouchableOpacity
                key={f}
                style={[
                  styles.filterButton,
                  filter === f && [
                    styles.activeFilterButton,
                    {
                      borderBottomColor:
                        f === "pending"
                          ? isDark
                            ? "#f97316"
                            : "#f97316"
                          : f === "inProgress"
                          ? isDark
                            ? "#60a5fa"
                            : "#2563eb"
                          : f === "resolved"
                          ? isDark
                            ? "#22c55e"
                            : "#16a34a"
                          : isDark
                          ? "#d1d5db"
                          : "#4b5563",
                    },
                  ],
                ]}
                onPress={() => setFilter(f)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    filter === f && [
                      styles.activeFilterButtonText,
                      {
                        color:
                          f === "pending"
                            ? isDark
                              ? "#f97316"
                              : "#f97316"
                            : f === "inProgress"
                            ? isDark
                              ? "#60a5fa"
                              : "#2563eb"
                            : f === "resolved"
                            ? isDark
                              ? "#22c55e"
                              : "#16a34a"
                            : isDark
                            ? "#d1d5db"
                            : "#4b5563",
                      },
                    ],
                  ]}
                >
                  {f === "all"
                    ? "Tous les incidents"
                    : f === "pending"
                    ? "En attente"
                    : f === "inProgress"
                    ? "En cours"
                    : "Résolus"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {filteredIncidents.length === 0 ? (
            <View
              style={[
                styles.emptyFilterContainer,
                { backgroundColor: isDark ? "#374151" : "#f9fafb" },
              ]}
            >
              <Text
                style={[
                  styles.emptyFilterText,
                  { color: isDark ? "#d1d5db" : "#6b7280" },
                ]}
              >
                Aucun incident ne correspond à ce filtre.
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredIncidents}
              renderItem={renderIncident}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.listContainer}
            />
          )}
        </>
      )}

      <Modal
        isVisible={showDeleteConfirm}
        onBackdropPress={() => setShowDeleteConfirm(false)}
      >
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: isDark ? "#1f2937" : "#fff" },
          ]}
        >
          <Text
            style={[styles.modalTitle, { color: isDark ? "#fff" : "#1f2937" }]}
          >
            Confirmer la suppression
          </Text>
          <Text
            style={[
              styles.modalText,
              { color: isDark ? "#d1d5db" : "#6b7280" },
            ]}
          >
            Êtes-vous sûr de vouloir supprimer cet incident ? Cette action est
            irréversible.
          </Text>
          <View style={styles.modalButtonContainer}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowDeleteConfirm(false)}
              disabled={deletingIncident}
            >
              <Text
                style={[
                  styles.modalButtonText,
                  { color: isDark ? "#fff" : "#374151" },
                ]}
              >
                Annuler
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalDeleteButton}
              onPress={confirmDelete}
              disabled={deletingIncident}
            >
              {deletingIncident ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <FontAwesomeIcon icon={faTrash} size={16} color="#fff" />
              )}
              <Text style={styles.modalButtonText}>Supprimer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  headerSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#16a34a",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#fff",
  },
  filterContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    marginBottom: 16,
    overflow: "scroll",
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  activeFilterButton: {
    borderBottomWidth: 2,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
  },
  activeFilterButtonText: {
    fontWeight: "600",
  },
  emptyFilterContainer: {
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  emptyFilterText: {
    fontSize: 14,
  },
  listContainer: {
    paddingBottom: 16,
  },
  incidentCard: {
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  incidentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 16,
  },
  incidentTitleContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  incidentTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  incidentInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  incidentInfoText: {
    fontSize: 14,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  detailsButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 6,
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  detailsContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  detailsText: {
    fontSize: 14,
  },
  photoContainer: {
    marginTop: 12,
  },
  photo: {
    width: "100%",
    height: 192,
    borderRadius: 8,
  },
  detailItem: {
    marginTop: 12,
  },
  audioContainer: {
    marginTop: 12,
  },
  playContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  progressBarBackground: {
    width: 200,
    height: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarForeground: {
    height: 8,
    backgroundColor: "#2563eb",
  },
  buttonContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    padding: 16,
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
  deleteButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  resolveButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#16a34a",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#fff",
  },
  formContainer: {
    paddingBottom: 32,
  },
  formHeader: {
    alignItems: "center",
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  formSubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 4,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  labelText: {
    fontSize: 14,
    fontWeight: "500",
  },
  picker: {
    fontSize: 16,
  },
  textArea: {
    borderRadius: 8,
    padding: 12,
    textAlignVertical: "top",
    height: 100,
  },
  dateInput: {
    borderRadius: 8,
    padding: 12,
  },
  dateText: {
    fontSize: 16,
  },
  photoPreviewContainer: {
    position: "relative",
    marginBottom: 8,
  },
  photoPreview: {
    width: "100%",
    height: 192,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  clearPhotoButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#ef4444",
    borderRadius: 999,
    padding: 4,
  },
  uploadContainer: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  uploadText: {
    fontSize: 14,
    marginTop: 8,
  },
  uploadSubtext: {
    fontSize: 12,
    marginTop: 4,
  },
  audioControls: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  audioButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  audioInfo: {
    flex: 1,
    marginLeft: 12,
  },
  audioText: {
    fontSize: 14,
    marginBottom: 8,
  },
  formButtonContainer: {
    flexDirection: "row",
    gap: 8,
  },
  cancelButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  submitButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#16a34a",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
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
    padding: 16,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  modalText: {
    fontSize: 14,
    marginBottom: 16,
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  modalCancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
  },
  modalDeleteButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ef4444",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#fff",
  },
});

export default Incidents;
