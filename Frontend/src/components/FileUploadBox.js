/**
 * FileUploadBox.js — Universal File Upload Container for AI Tools
 * Provides a beautiful, reusable file upload component with drag-drop support
 */

import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
  Alert,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const { width: screenWidth } = Dimensions.get("window");

const FileUploadBox = ({
  title = "📁 Upload File",
  description = "Select a file to get started",
  acceptedTypes = ["*/*"],
  onFileSelect,
  onClear,
  selectedFile,
  loading = false,
  icon = "cloud-upload-outline",
  color = "#4ECDC4",
  maxSize = 50 * 1024 * 1024, // 50MB default
}) => {
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: acceptedTypes,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const file = result.assets[0];

        // Check file size
        if (file.size && file.size > maxSize) {
          Alert.alert(
            "File Too Large",
            `File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`,
          );
          return;
        }

        if (onFileSelect) {
          onFileSelect(file);
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick file: " + error.message);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const getFileIcon = (mimeType) => {
    if (!mimeType) return "file-outline";
    if (mimeType.includes("pdf")) return "file-pdf-box";
    if (mimeType.includes("image")) return "file-image";
    if (mimeType.includes("audio")) return "file-music";
    if (mimeType.includes("video")) return "file-video";
    if (mimeType.includes("word") || mimeType.includes("document"))
      return "file-document";
    if (mimeType.includes("sheet") || mimeType.includes("spreadsheet"))
      return "file-excel";
    return "file-outline";
  };

  return (
    <View style={[styles.container, { borderColor: color }]}>
      <View style={[styles.header, { backgroundColor: color + "15" }]}>
        <MaterialCommunityIcons name={icon} size={28} color={color} />
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
      </View>

      {!selectedFile ? (
        <TouchableOpacity
          style={[
            styles.uploadArea,
            dragging && styles.uploadAreaDragging,
            { borderColor: color },
          ]}
          onPress={handleFilePick}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="large" color={color} />
          ) : (
            <>
              <MaterialCommunityIcons
                name="cloud-upload-outline"
                size={48}
                color={color}
                style={{ opacity: 0.8 }}
              />
              <Text style={[styles.uploadText, { color }]}>
                Tap to select a file
              </Text>
              <Text style={styles.uploadSubText}>or drag & drop (for web)</Text>
              <Text style={styles.acceptedText}>
                Accepted: {acceptedTypes.join(", ")}
              </Text>
            </>
          )}
        </TouchableOpacity>
      ) : (
        <View style={styles.fileInfo}>
          <View style={styles.fileRow}>
            <View
              style={[
                styles.fileIconContainer,
                { backgroundColor: color + "20" },
              ]}
            >
              <MaterialCommunityIcons
                name={getFileIcon(selectedFile.mimeType)}
                size={32}
                color={color}
              />
            </View>
            <View style={styles.fileDetails}>
              <Text style={styles.fileName} numberOfLines={1}>
                {selectedFile.name}
              </Text>
              <Text style={styles.fileSize}>
                {formatFileSize(selectedFile.size)}
              </Text>
            </View>
          </View>

          <View style={styles.fileActions}>
            {onClear && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={onClear}
                disabled={loading}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={20}
                  color="#FF6B6B"
                />
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 2,
    overflow: "hidden",
    marginBottom: 16,
    backgroundColor: "#fff",
    elevation: 2,
    boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  description: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  uploadArea: {
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    margin: 16,
    backgroundColor: "#f9f9f9",
    minHeight: 200,
  },
  uploadAreaDragging: {
    opacity: 0.7,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
  },
  uploadSubText: {
    fontSize: 13,
    color: "#999",
    marginTop: 4,
  },
  acceptedText: {
    fontSize: 12,
    color: "#aaa",
    marginTop: 8,
  },
  fileInfo: {
    padding: 16,
  },
  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  fileIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  fileDetails: {
    flex: 1,
    marginLeft: 12,
  },
  fileName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  fileSize: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  fileActions: {
    flexDirection: "row",
    gap: 8,
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FF6B6B",
    backgroundColor: "#FF6B6B15",
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FF6B6B",
    marginLeft: 4,
  },
});

export default FileUploadBox;
