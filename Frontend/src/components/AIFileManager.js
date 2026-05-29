/**
 * AIFileManager.js — Centralized File Management for AI Tools
 * Manages file uploads, conversions, and processing across all AI tools
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
  FlatList,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import FileUploadBox from "./FileUploadBox";

const { width: screenWidth } = Dimensions.get("window");

const AIFileManager = ({ onFileSelect, courseId, userId }) => {
  const [files, setFiles] = useState([]);
  const [processingFile, setProcessingFile] = useState(null);
  const [selectedFileForTool, setSelectedFileForTool] = useState(null);

  const handleFileSelected = useCallback(
    (file) => {
      // Check if file already exists
      const fileExists = files.some((f) => f.uri === file.uri);
      if (fileExists) {
        Alert.alert("Info", "This file is already uploaded");
        return;
      }

      // Add file to list
      const newFile = {
        ...file,
        id: Date.now(),
        uploadedAt: new Date(),
        size: file.size,
        type: file.mimeType,
      };

      setFiles((prev) => [newFile, ...prev]);
      setSelectedFileForTool(newFile);

      if (onFileSelect) {
        onFileSelect(newFile);
      }
    },
    [files, onFileSelect],
  );

  const handleRemoveFile = useCallback(
    (fileId) => {
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      if (selectedFileForTool?.id === fileId) {
        setSelectedFileForTool(null);
      }
    },
    [selectedFileForTool],
  );

  const handleClearAll = useCallback(() => {
    Alert.alert(
      "Clear All Files",
      "Are you sure you want to remove all files?",
      [
        { text: "Cancel", onPress: () => {} },
        {
          text: "Clear",
          onPress: () => {
            setFiles([]);
            setSelectedFileForTool(null);
          },
          style: "destructive",
        },
      ],
    );
  }, []);

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
    if (mimeType.includes("audio") || mimeType.includes("mpeg"))
      return "file-music";
    if (mimeType.includes("video")) return "file-video";
    if (mimeType.includes("word") || mimeType.includes("document"))
      return "file-document";
    if (mimeType.includes("sheet") || mimeType.includes("spreadsheet"))
      return "file-excel";
    return "file-outline";
  };

  const getFileColor = (mimeType) => {
    if (!mimeType) return "#999";
    if (mimeType.includes("pdf")) return "#FF6B6B";
    if (mimeType.includes("image")) return "#45B7D1";
    if (mimeType.includes("audio") || mimeType.includes("mpeg"))
      return "#FFA500";
    if (mimeType.includes("video")) return "#6F28D9";
    if (mimeType.includes("word") || mimeType.includes("document"))
      return "#4ECDC4";
    if (mimeType.includes("sheet") || mimeType.includes("spreadsheet"))
      return "#52B788";
    return "#999";
  };

  const renderFileItem = ({ item }) => (
    <View
      style={[
        styles.fileItem,
        selectedFileForTool?.id === item.id && styles.fileItemActive,
      ]}
    >
      <TouchableOpacity
        style={styles.fileItemContent}
        onPress={() => setSelectedFileForTool(item)}
      >
        <View
          style={[
            styles.fileIcon,
            { backgroundColor: getFileColor(item.type) + "20" },
          ]}
        >
          <MaterialCommunityIcons
            name={getFileIcon(item.type)}
            size={24}
            color={getFileColor(item.type)}
          />
        </View>
        <View style={styles.fileItemInfo}>
          <Text style={styles.fileName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.fileItemMeta}>
            {formatFileSize(item.size)} • {item.uploadedAt.toLocaleDateString()}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveFile(item.id)}
      >
        <MaterialCommunityIcons name="close" size={20} color="#FF6B6B" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <FileUploadBox
        title="📁 Upload Files"
        description="Upload documents, audio, or video files"
        acceptedTypes={[
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-powerpoint",
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          "text/plain",
          "audio/*",
          "video/*",
          "image/*",
        ]}
        onFileSelect={handleFileSelected}
        icon="cloud-upload-outline"
        color="#4ECDC4"
      />

      {files.length > 0 && (
        <View style={styles.filesSection}>
          <View style={styles.filesHeader}>
            <View>
              <Text style={styles.filesSectionTitle}>
                📋 Uploaded Files ({files.length})
              </Text>
            </View>
            {files.length > 0 && (
              <TouchableOpacity
                style={styles.clearAllButton}
                onPress={handleClearAll}
              >
                <MaterialCommunityIcons
                  name="delete-multiple"
                  size={16}
                  color="#FF6B6B"
                />
                <Text style={styles.clearAllText}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={files}
            renderItem={renderFileItem}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            nestedScrollEnabled={false}
          />
        </View>
      )}

      {files.length === 0 && (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="inbox-outline" size={48} color="#ccc" />
          <Text style={styles.emptyStateText}>No files uploaded yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Upload files to use with AI tools
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    padding: 16,
  },
  filesSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginTop: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  filesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  filesSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  clearAllButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#FF6B6B15",
    gap: 4,
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FF6B6B",
  },
  fileItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  fileItemActive: {
    backgroundColor: "#f9f9f9",
  },
  fileItemContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  fileIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  fileItemInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 2,
  },
  fileItemMeta: {
    fontSize: 12,
    color: "#999",
  },
  removeButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#999",
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: "#bbb",
    marginTop: 4,
  },
});

export default AIFileManager;
