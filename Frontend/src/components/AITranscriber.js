import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
  Platform,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import aiService from "../services/aiService";

const { width: screenWidth } = Dimensions.get("window");
const isLargeScreen = Platform.OS === "web" && screenWidth >= 1024;

const AITranscriber = ({ courseId, userId, initialTranscript }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [transcript, setTranscript] = useState(initialTranscript || null);
  const [inputType, setInputType] = useState("file"); // 'file' or 'youtube'

  React.useEffect(() => {
    if (initialTranscript) {
      setTranscript(initialTranscript);
    } else {
      setTranscript(null);
    }
  }, [initialTranscript]);

  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["audio/*", "video/*", "application/octet-stream"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.length > 0) {
        setSelectedFile(result.assets[0]);
        setTranscript(null);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick file: " + error.message);
    }
  };

  const handleTranscribe = async () => {
    if (inputType === "file" && !selectedFile) {
      return Alert.alert("Error", "Please select an audio or video file");
    }
    if (inputType === "youtube" && !youtubeUrl) {
      return Alert.alert("Error", "Please enter a YouTube video URL");
    }

    setLoading(true);
    try {
      let response;

      if (inputType === "youtube") {
        // YouTube transcription via AI service
        response = await aiService.transcribeYouTube(youtubeUrl);
      } else {
        // Local file transcription
        response = await aiService.transcribeAudioFile(selectedFile);
      }

      if (
        response &&
        (response.data?.transcription || response.transcription)
      ) {
        setTranscript(response.data?.transcription || response.transcription);
      }
    } catch (error) {
      console.error("Transcription error:", error);
      Alert.alert(
        "Error",
        "Failed to transcribe: " + (error.message || "Unknown error"),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTranscript = async () => {
    if (!transcript) return;

    try {
      const fileName = `transcript_${Date.now()}.txt`;
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, transcript);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "text/plain",
          dialogTitle: "Share Transcript",
        });
      } else {
        Alert.alert("Success", "Transcript saved to: " + fileUri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to download transcript: " + error.message);
    }
  };

  const handleCopyTranscript = () => {
    if (transcript) {
      // For web, copy to clipboard
      if (Platform.OS === "web") {
        navigator.clipboard.writeText(transcript).then(() => {
          Alert.alert("Success", "Transcript copied to clipboard!");
        });
      } else {
        Alert.alert("Note", "Use the download option to save the transcript");
      }
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎙️ Audio/Video to Text</Text>
        <Text style={styles.description}>
          Upload lecture audio/video or YouTube link and AI converts speech to
          text instantly.
        </Text>

        {/* Input Type Selector */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              inputType === "file" && styles.toggleButtonActive,
            ]}
            onPress={() => {
              setInputType("file");
              setTranscript(null);
            }}
          >
            <Text
              style={[
                styles.toggleButtonText,
                inputType === "file" && styles.toggleButtonTextActive,
              ]}
            >
              📁 Upload File
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              inputType === "youtube" && styles.toggleButtonActive,
            ]}
            onPress={() => {
              setInputType("youtube");
              setTranscript(null);
            }}
          >
            <Text
              style={[
                styles.toggleButtonText,
                inputType === "youtube" && styles.toggleButtonTextActive,
              ]}
            >
              ▶️ YouTube Link
            </Text>
          </TouchableOpacity>
        </View>

        {/* Input Area */}
        {inputType === "file" ? (
          <TouchableOpacity
            style={[
              styles.uploadButton,
              selectedFile && styles.uploadButtonActive,
            ]}
            onPress={handleFilePick}
            disabled={loading}
          >
            <MaterialCommunityIcons
              name={selectedFile ? "file-check" : "cloud-upload-outline"}
              size={24}
              color={selectedFile ? "#45B7D1" : "#666"}
            />
            <Text style={styles.uploadButtonText}>
              {selectedFile
                ? `${selectedFile.name} (${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)`
                : "Select Audio or Video File"}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.urlInputContainer}>
            <MaterialCommunityIcons name="youtube" size={20} color="#FF0000" />
            <TextInput
              style={styles.urlInput}
              placeholder="https://www.youtube.com/watch?v=..."
              value={youtubeUrl}
              onChangeText={setYoutubeUrl}
              editable={!loading}
              placeholderTextColor="#999"
            />
          </View>
        )}

        {/* Transcribe Button */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.transcribeButton,
            loading && styles.buttonDisabled,
          ]}
          onPress={handleTranscribe}
          disabled={
            loading ||
            (!inputType === "file" && !selectedFile) ||
            (!inputType === "youtube" && !youtubeUrl)
          }
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <MaterialCommunityIcons
                name="text-to-speech"
                size={20}
                color="#fff"
              />
              <Text style={styles.buttonText}>Transcribe Now</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Transcript Display */}
        {transcript && (
          <View style={styles.resultsSection}>
            <Text style={styles.resultsTitle}>📝 Transcript</Text>
            <View style={styles.transcriptBox}>
              <Text style={styles.transcriptText}>{transcript}</Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtonsGroup}>
              <TouchableOpacity
                style={[styles.actionButton, styles.downloadButton]}
                onPress={handleDownloadTranscript}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="download"
                  size={20}
                  color="#fff"
                />
                <Text style={styles.buttonText}>Download Transcript</Text>
              </TouchableOpacity>

              {Platform.OS === "web" && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.copyButton]}
                  onPress={handleCopyTranscript}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name="content-copy"
                    size={20}
                    color="#fff"
                  />
                  <Text style={styles.buttonText}>Copy Text</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Transcript Info */}
            <View style={styles.infoBox}>
              <MaterialCommunityIcons
                name="information-outline"
                size={16}
                color="#45B7D1"
              />
              <Text style={styles.infoText}>
                Word count: {transcript.split(/\s+/).length}
              </Text>
            </View>
          </View>
        )}

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingSection}>
            <ActivityIndicator size="large" color="#45B7D1" />
            <Text style={styles.loadingText}>Transcribing your media...</Text>
            <Text style={styles.loadingSubtext}>
              This may take a moment depending on file size
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  contentContainer: {
    paddingVertical: 12,
    paddingHorizontal: isLargeScreen ? 24 : 16,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.05)",
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  description: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
    lineHeight: 20,
  },
  toggleContainer: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 8,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#f5f5f5",
    alignItems: "center",
  },
  toggleButtonActive: {
    backgroundColor: "#45B7D1",
    borderColor: "#45B7D1",
  },
  toggleButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#666",
  },
  toggleButtonTextActive: {
    color: "#fff",
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#ddd",
    borderStyle: "dashed",
    marginBottom: 12,
  },
  uploadButtonActive: {
    borderColor: "#45B7D1",
    backgroundColor: "#eef8fb",
  },
  uploadButtonText: {
    marginLeft: 12,
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
    flex: 1,
  },
  urlInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 12,
  },
  urlInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    color: "#333",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    marginVertical: 8,
  },
  transcribeButton: {
    backgroundColor: "#45B7D1",
  },
  downloadButton: {
    backgroundColor: "#4ECDC4",
    flex: 1,
    marginRight: 8,
  },
  copyButton: {
    backgroundColor: "#45B7D1",
    flex: 1,
    marginLeft: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 8,
  },
  resultsSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  transcriptBox: {
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    borderLeftWidth: 4,
    borderLeftColor: "#45B7D1",
    maxHeight: 300,
  },
  transcriptText: {
    fontSize: 13,
    color: "#555",
    lineHeight: 20,
  },
  actionButtonsGroup: {
    flexDirection: "row",
    marginBottom: 12,
    gap: 8,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#eef8fb",
    borderRadius: 8,
    gap: 8,
  },
  infoText: {
    fontSize: 12,
    color: "#45B7D1",
    fontWeight: "500",
  },
  loadingSection: {
    marginTop: 20,
    paddingVertical: 30,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
});

export default AITranscriber;
