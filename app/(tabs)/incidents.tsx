import { MaterialIcons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { Audio } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../ThemeContext";

export default function Incidents() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [activeTab, setActiveTab] = useState<"form" | "list">("form");

  const [description, setDescription] = useState("");
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [recordDuration, setRecordDuration] = useState<number>(0);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioPosition, setAudioPosition] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedBien, setSelectedBien] = useState<string>("");

  const [images, setImages] = useState<string[]>([]); // pour stocker max 2 photos
  const [incidentsList, setIncidentsList] = useState<any[]>([]);
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState<number | null>(
    null
  );

  const MAX_DURATION = 60;
  const recordingInterval = useRef<NodeJS.Timeout | null>(null);

  // Démarrage enregistrement
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

  // Arrêter enregistrement
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

  // Lecture audio du formulaire
  const playAudio = async () => {
    if (!audioUri) return;

    try {
      if (sound) {
        if (isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          await sound.playAsync();
          setIsPlaying(true);
        }
        return;
      }

      const { sound: newSound, status } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true, volume: 1.0 }
      );

      setSound(newSound);
      setIsPlaying(true);
      setAudioDuration(status.durationMillis || 0);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;
        setIsPlaying(status.isPlaying);
        setAudioPosition(status.positionMillis);

        if (status.didJustFinish) {
          setIsPlaying(false);
          setAudioPosition(0);
          newSound.stopAsync();
        }
      });

      await newSound.playAsync();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    return () => {
      if (sound) sound.unloadAsync();
      if (recordingInterval.current) clearInterval(recordingInterval.current);
    };
  }, [sound]);

  // Choisir une photo (max 2)
  const pickImage = async () => {
    if (images.length >= 2) {
      Alert.alert(
        "Limite atteinte",
        "Vous pouvez ajouter au maximum 2 photos."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const handleSubmit = () => {
    if (
      !selectedType &&
      !selectedBien &&
      !description &&
      !audioUri &&
      images.length === 0
    ) {
      Alert.alert(
        "Erreur",
        "Veuillez remplir au moins un champ, ajouter une photo ou enregistrer une note vocale."
      );
      return;
    }

    const newIncident = {
      type: selectedType,
      bien: selectedBien,
      description,
      audio: audioUri,
      images, // ajout photos
      date: new Date().toLocaleString(),
      audioPosition: 0,
      audioDuration: 0,
      isPlaying: false,
    };

    setIncidentsList([newIncident, ...incidentsList]);
    Alert.alert("Incident signalé", "Merci pour votre signalement !");
    setSelectedType("");
    setSelectedBien("");
    setDescription("");
    setAudioUri(null);
    setRecordDuration(0);
    setAudioPosition(0);
    setAudioDuration(0);
    setCurrentPlayingIndex(null);
    setImages([]);
    if (sound) {
      sound.stopAsync();
      sound.unloadAsync();
      setSound(null);
    }
  };

  // Lecture audio pour un incident de la liste
  const playIncidentAudio = async (item: any, index: number) => {
    try {
      if (!item.audio) return;

      // stop son actuel si un autre joue
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
        if (currentPlayingIndex !== null) {
          incidentsList[currentPlayingIndex].isPlaying = false;
        }
      }

      const { sound: newSound, status } = await Audio.Sound.createAsync(
        { uri: item.audio },
        { shouldPlay: true, volume: 1.0 }
      );

      setSound(newSound);
      setCurrentPlayingIndex(index);
      item.isPlaying = true;
      item.audioDuration = status.durationMillis || 0;

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;

        item.audioPosition = status.positionMillis;
        item.isPlaying = status.isPlaying;
        setIncidentsList([...incidentsList]);

        if (status.didJustFinish) {
          item.isPlaying = false;
          item.audioPosition = 0;
          setIncidentsList([...incidentsList]);
          newSound.stopAsync();
        }
      });

      await newSound.playAsync();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? "#111" : "#fff" }]}
    >
      {/* Menu haut */}
      <View style={{ flexDirection: "row", marginBottom: 20 }}>
        <TouchableOpacity
          onPress={() => setActiveTab("form")}
          style={{
            flex: 1,
            padding: 12,
            backgroundColor: activeTab === "form" ? "green" : "#ccc",
            borderRadius: 8,
            marginRight: 5,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "bold" }}>
            Signaler un Incident
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab("list")}
          style={{
            flex: 1,
            padding: 12,
            backgroundColor: activeTab === "list" ? "green" : "#ccc",
            borderRadius: 8,
            marginLeft: 5,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "bold" }}>
            Liste des Incidents
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "form" ? (
        <>
          {/* Formulaire complet */}
          <View
            style={[
              styles.input,
              {
                height: 150,
                backgroundColor: isDark ? "#222" : "black",
                justifyContent: "center",
              },
            ]}
          >
            <Picker
              selectedValue={selectedType}
              onValueChange={(itemValue) => setSelectedType(itemValue)}
              dropdownIconColor={isDark ? "#fff" : "#000"}
              style={{ color: isDark ? "#fff" : "white" }}
            >
              <Picker.Item label="Sélectionner le type d'incident" value="" />
              <Picker.Item label="Incident électrique" value="electrique" />
              <Picker.Item label="Incident plomberie" value="plomberie" />
              <Picker.Item label="Autre" value="autre" />
            </Picker>
          </View>

          <View
            style={[
              styles.input,
              {
                height: 150,
                backgroundColor: isDark ? "#222" : "black",
                justifyContent: "center",
              },
            ]}
          >
            <Picker
              selectedValue={selectedBien}
              onValueChange={(itemValue) => setSelectedBien(itemValue)}
              dropdownIconColor={isDark ? "#fff" : "#000"}
              style={{ color: isDark ? "#fff" : "white" }}
            >
              <Picker.Item label="Sélectionner le bien concerné" value="" />
              <Picker.Item label="Appartement A" value="appartementA" />
              <Picker.Item label="Appartement B" value="appartementB" />
              <Picker.Item label="Appartement C" value="appartementC" />
            </Picker>
          </View>

          <TextInput
            style={[
              styles.textArea,
              {
                backgroundColor: isDark ? "#222" : "#f2f2f2",
                color: isDark ? "#fff" : "#000",
              },
            ]}
            placeholder="Décrivez le problème..."
            placeholderTextColor={isDark ? "#888" : "#666"}
            multiline
            numberOfLines={5}
            value={description}
            onChangeText={setDescription}
          />

          {/* Photos */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ color: isDark ? "#fff" : "#000", marginBottom: 5 }}>
              Ajouter des photos (maximum 2)
            </Text>
            <View style={{ flexDirection: "row" }}>
              {images.map((uri, idx) => (
                <Image
                  key={idx}
                  source={{ uri }}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 10,
                    marginRight: 10,
                  }}
                />
              ))}
              {images.length < 2 && (
                <TouchableOpacity
                  onPress={pickImage}
                  style={{
                    width: 80,
                    height: 80,
                    backgroundColor: "#ddd",
                    borderRadius: 10,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 30, color: "#555" }}>+</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Audio */}
          <View style={styles.audioContainer}>
            <TouchableOpacity
              style={[
                styles.audioBtn,
                { backgroundColor: recording ? "red" : "green" },
              ]}
              onPress={recording ? stopRecording : startRecording}
            >
              <MaterialIcons
                name={recording ? "stop" : "keyboard-voice"}
                size={28}
                color="#fff"
              />
            </TouchableOpacity>

            <View style={{ marginLeft: 10, flex: 1 }}>
              {recording && (
                <Text style={{ color: isDark ? "#fff" : "#000" }}>
                  Enregistrement: {recordDuration}s
                </Text>
              )}

              {audioUri && !recording && (
                <>
                  <Text
                    style={{ color: isDark ? "#fff" : "#000", marginBottom: 5 }}
                  >
                    Note vocale
                  </Text>
                  <TouchableOpacity
                    style={styles.playContainer}
                    onPress={playAudio}
                  >
                    <Text style={{ color: "blue", marginRight: 10 }}>
                      {isPlaying ? "⏸️" : "▶"}
                    </Text>
                    <View style={styles.progressBarBackground}>
                      <View
                        style={[
                          styles.progressBarForeground,
                          {
                            width: (audioPosition / (audioDuration || 1)) * 200,
                          },
                        ]}
                      />
                    </View>
                    <Text style={{ marginLeft: 10 }}>
                      {Math.floor(audioPosition / 1000)}s
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
            <Text style={styles.submitText}>Envoyer</Text>
          </TouchableOpacity>
        </>
      ) : (
        // LISTE DES INCIDENTS
        <View>
          {incidentsList.length === 0 ? (
            <Text
              style={{
                color: isDark ? "#fff" : "#000",
                textAlign: "center",
                marginTop: 20,
              }}
            >
              Aucun incident signalé.
            </Text>
          ) : (
            incidentsList.map((item, index) => (
              <View
                key={index}
                style={{
                  backgroundColor: isDark ? "#222" : "#f9f9f9",
                  padding: 15,
                  borderRadius: 10,
                  marginBottom: 10,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 3,
                  elevation: 2,
                }}
              >
                <Text
                  style={{
                    color: isDark ? "#fff" : "#000",
                    fontWeight: "bold",
                    fontSize: 16,
                  }}
                >
                  {item.type || "Incident"}
                </Text>
                <Text style={{ color: isDark ? "#ccc" : "#555" }}>
                  Bien: {item.bien || "-"}
                </Text>
                <Text
                  style={{ color: isDark ? "#ccc" : "#555", marginVertical: 5 }}
                >
                  {item.description || "Pas de description"}
                </Text>

                {/* Photos */}
                {item.images && item.images.length > 0 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginVertical: 10 }}
                  >
                    {item.images.map((uri: string, idx: number) => (
                      <Image
                        key={idx}
                        source={{ uri }}
                        style={{
                          width: 100,
                          height: 100,
                          borderRadius: 8,
                          marginRight: 10,
                        }}
                      />
                    ))}
                  </ScrollView>
                )}

                {item.audio && (
                  <TouchableOpacity
                    style={styles.playContainer}
                    onPress={() => playIncidentAudio(item, index)}
                  >
                    <Text style={{ color: "blue", marginRight: 10 }}>
                      {item.isPlaying ? "⏸️" : "▶"}
                    </Text>
                    <View style={styles.progressBarBackground}>
                      <View
                        style={[
                          styles.progressBarForeground,
                          {
                            width:
                              ((item.audioPosition || 0) /
                                (item.audioDuration || 1)) *
                              200,
                          },
                        ]}
                      />
                    </View>
                    <Text style={{ marginLeft: 10 }}>
                      {Math.floor((item.audioPosition || 0) / 1000)}s
                    </Text>
                  </TouchableOpacity>
                )}
                <Text
                  style={{
                    color: isDark ? "#888" : "#888",
                    fontSize: 12,
                    marginTop: 5,
                  }}
                >
                  {item.date}
                </Text>
              </View>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  input: { borderRadius: 10, marginBottom: 5, fontSize: 16 },
  textArea: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    marginTop: 10,
    fontSize: 16,
    textAlignVertical: "top",
    height: 150,
  },
  audioContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  audioBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  playContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
  },
  progressBarBackground: {
    width: 200,
    height: 8,
    backgroundColor: "#ccc",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarForeground: {
    height: 8,
    backgroundColor: "blue",
  },
  submitBtn: {
    backgroundColor: "green",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 50,
  },
  submitText: { color: "#fff", fontWeight: "bold", fontSize: 18 },
});
