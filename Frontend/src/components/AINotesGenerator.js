import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
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

const AINotesGenerator = ({ courseId, userId, initialNotes, initialPoints }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generatedNotes, setGeneratedNotes] = useState(initialNotes || null);
  const [importantPoints, setImportantPoints] = useState(initialPoints || []);
  const [fileType, setFileType] = useState(null);

  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    if (initialNotes) {
      setGeneratedNotes(initialNotes);
    } else {
      setGeneratedNotes(null);
    }
    if (initialPoints) {
      setImportantPoints(initialPoints);
    } else {
      setImportantPoints([]);
    }
  }, [initialNotes, initialPoints]);

  const handleCopyNotes = () => {
    if (!generatedNotes) return;
    
    if (Platform.OS === "web") {
      navigator.clipboard.writeText(generatedNotes).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      Alert.alert("Success", "Notes copied to clipboard!");
    }
  };

  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-powerpoint",
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          "text/plain",
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const file = result.assets[0];
        setSelectedFile(file);
        setFileType(file.mimeType);
        setGeneratedNotes(null);
        setImportantPoints([]);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick file: " + error.message);
    }
  };

  const handleGenerateNotes = async () => {
    if (!selectedFile) {
      return Alert.alert("Error", "Please select a file first");
    }

    setLoading(true);
    try {
      const response = await aiService.generateNotesFromFile({
        file: selectedFile,
        course_id: courseId,
      });

      if (response && response.data) {
        setGeneratedNotes(response.data.notes || response.data.summary);
        setImportantPoints(
          response.data.important_points || response.data.keyPoints || [],
        );
      }
    } catch (error) {
      console.error("Notes generation error:", error);
      Alert.alert(
        "Error",
        "Failed to generate notes: " + (error.message || "Unknown error"),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadNotes = async () => {
    if (!generatedNotes) return;

    try {
      const fileName = `notes_${Date.now()}.txt`;
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, generatedNotes);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "text/plain",
          dialogTitle: "Share Generated Notes",
        });
      } else {
        Alert.alert("Success", "Notes saved to: " + fileUri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to download notes: " + error.message);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📄 AI Notes Generator</Text>
        <Text style={styles.description}>
          Upload your PDF, PPT, DOCX, or text files and let AI generate concise
          notes and key points.
        </Text>

        {/* File Selection */}
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
            color={selectedFile ? "#4ECDC4" : "#666"}
          />
          <Text style={styles.uploadButtonText}>
            {selectedFile
              ? selectedFile.name
              : "Select Document (PDF, DOCX, PPT)"}
          </Text>
        </TouchableOpacity>

        {selectedFile && (
          <Text style={styles.fileInfo}>
            Size: {(selectedFile.size / 1024).toFixed(2)} KB
          </Text>
        )}

        {/* Generate Notes Button */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.generateButton,
            loading && styles.buttonDisabled,
          ]}
          onPress={handleGenerateNotes}
          disabled={loading || !selectedFile}
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <MaterialCommunityIcons name="auto-fix" size={20} color="#fff" />
              <Text style={styles.buttonText}>Generate Notes with AI</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Generated Notes Display */}
        {generatedNotes && (
          <View style={styles.resultsSection}>
            <Text style={styles.resultsTitle}>✨ Generated Notes</Text>
            <View style={styles.notesBox}>
              <Text style={styles.notesText}>{generatedNotes}</Text>
            </View>

            {/* Important Points */}
            {importantPoints && importantPoints.length > 0 && (
              <View style={styles.pointsSection}>
                <Text style={styles.pointsTitle}>🎯 Important Points</Text>
                {importantPoints.map((point, idx) => (
                  <View key={idx} style={styles.pointItem}>
                    <Text style={styles.pointBullet}>•</Text>
                    <Text style={styles.pointText}>{point}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Action Buttons Row */}
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.copyButton,
                  copied && styles.copiedButton,
                ]}
                onPress={handleCopyNotes}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={copied ? "check-circle" : "content-copy"}
                  size={18}
                  color="#fff"
                />
                <Text style={styles.buttonText}>
                  {copied ? "Copied!" : "Copy Notes"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.downloadButton]}
                onPress={handleDownloadNotes}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="download" size={18} color="#fff" />
                <Text style={styles.buttonText}>Download Notes</Text>
              </TouchableOpacity>
            </View>
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
    borderColor: "#4ECDC4",
    backgroundColor: "#f0fffe",
  },
  uploadButtonText: {
    marginLeft: 12,
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
    flex: 1,
  },
  fileInfo: {
    fontSize: 12,
    color: "#999",
    marginBottom: 12,
    marginLeft: 4,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    marginVertical: 8,
    flex: 1,
  },
  generateButton: {
    backgroundColor: "#FF6B6B",
    flex: 0,
    width: "100%",
  },
  actionButtonsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
    width: "100%",
  },
  copyButton: {
    backgroundColor: "#6366F1",
  },
  copiedButton: {
    backgroundColor: "#10B981",
  },
  downloadButton: {
    backgroundColor: "#4ECDC4",
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
  notesBox: {
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#FF6B6B",
  },
  notesText: {
    fontSize: 13,
    color: "#555",
    lineHeight: 20,
  },
  pointsSection: {
    marginTop: 12,
  },
  pointsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  pointItem: {
    flexDirection: "row",
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  pointBullet: {
    fontSize: 16,
    color: "#4ECDC4",
    marginRight: 8,
    fontWeight: "bold",
  },
  pointText: {
    flex: 1,
    fontSize: 13,
    color: "#555",
    lineHeight: 18,
  },
});

export default AINotesGenerator;
