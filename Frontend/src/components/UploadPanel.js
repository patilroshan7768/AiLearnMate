import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
  Platform,
  Alert,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";

const { width: screenWidth } = Dimensions.get("window");
const isLargeScreen = Platform.OS === "web" && screenWidth >= 1024;

const UploadPanel = ({
  courseId,
  userId,
  onUploadStart,
  onFileSelect,
  onUrlChange,
  youtubeUrl,
  selectedFile,
  onRemoveFile,
  onTriggerProcess,
  onTriggerYoutube,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const languages = [
    { code: "English", label: "English 🇬🇧" },
    { code: "Marathi", label: "Marathi 🚩" },
    { code: "Hindi", label: "Hindi 🇮🇳" },
    { code: "Tamil", label: "Tamil 🌾" },
    { code: "Telugu", label: "Telugu ☀️" },
    { code: "Bengali", label: "Bengali 🌸" },
    { code: "Gujarati", label: "Gujarati 🏮" },
    { code: "Kannada", label: "Kannada 🍂" },
    { code: "Malayalam", label: "Malayalam 🥥" },
    { code: "Punjabi", label: "Punjabi 🌾" }
  ];

  // Shimmer animation for the CTA buttons
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  const handleBrowseFile = async () => {

  // WEB
  if (Platform.OS === "web") {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
    return;
  }

  // MOBILE
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (!result.canceled) {

      const file = result.assets[0];

      onFileSelect({
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
        uri: file.uri,
        mimeType: file.mimeType,
        file,
      });
    }

  } catch (error) {
    Alert.alert(
      "Error",
      "Failed to pick document"
    );
  }
};

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      onFileSelect({
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
        uri: URL.createObjectURL(file),
        mimeType: "application/pdf",
        file,
      });
    } else if (file) {
      Alert.alert("Invalid File", "Please upload a valid PDF document.");
    }
  };

  const handleDragOver = (e) => {
    if (Platform.OS === "web") {
      e.preventDefault();
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    if (Platform.OS !== "web") return;
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/pdf") {
      onFileSelect({
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
        uri: URL.createObjectURL(file),
        mimeType: "application/pdf",
        file,
      });
    } else if (file) {
      Alert.alert("Invalid File", "Only PDF documents are supported for Drag & Drop.");
    }
  };

  const shimmerTranslateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-150, 150],
  });

  return (
    <View style={styles.container}>
      <View style={styles.cardHeader}>
        <MaterialCommunityIcons name="cloud-upload" size={24} color="#6366F1" />
        <Text style={styles.cardTitle}>Add Study Material</Text>
      </View>
      <Text style={styles.cardDesc}>
        Feed a PDF document or YouTube URL to automatically build notes, take custom quizzes, and ask questions.
      </Text>

      {/* Target Study Language Horizontal Scroller */}
      <View style={styles.languageContainer}>
        <View style={styles.langHeader}>
          <MaterialCommunityIcons name="translate" size={16} color="#6366F1" style={{ marginRight: 6 }} />
          <Text style={styles.langTitle}>Target Study Language</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.langChipsScroll}>
          {languages.map((lang) => {
            const isSel = selectedLanguage === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                style={[styles.langChip, isSel && styles.langChipActive]}
                onPress={() => setSelectedLanguage(lang.code)}
                activeOpacity={0.85}
              >
                <Text style={[styles.langChipText, isSel && styles.langChipTextActive]}>
                  {lang.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.panelsRow}>
        {/* YouTube Section */}
        <View style={styles.subCard}>
          <View style={styles.badgeRow}>
            <View style={[styles.badgeIcon, { backgroundColor: "#FEE2E2" }]}>
              <MaterialCommunityIcons name="youtube" size={24} color="#EF4444" />
            </View>
            <Text style={styles.badgeLabel}>Import from YouTube</Text>
          </View>

          <View style={styles.inputGroup}>
            <MaterialCommunityIcons name="link-variant" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.urlInput}
              placeholder="Paste video URL..."
              placeholderTextColor="#9CA3AF"
              value={youtubeUrl}
              onChangeText={onUrlChange}
              autoCapitalize="none"
            />
            {youtubeUrl.length > 0 && (
              <TouchableOpacity onPress={() => onUrlChange("")}>
                <MaterialCommunityIcons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.checklist}>
            <View style={styles.checkItem}>
              <MaterialCommunityIcons name="check-circle" size={14} color="#10B981" />
              <Text style={styles.checkText}>Transcribes speech automatically</Text>
            </View>
            <View style={styles.checkItem}>
              <MaterialCommunityIcons name="check-circle" size={14} color="#10B981" />
              <Text style={styles.checkText}>Builds study guide + flashcards</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.btn, styles.ytBtn, !youtubeUrl.trim() && styles.btnDisabled]}
            disabled={!youtubeUrl.trim()}
            onPress={() => onTriggerYoutube(selectedLanguage)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="star-four-points" size={18} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.btnText}>Analyze Video</Text>
          </TouchableOpacity>
        </View>

        {/* PDF Upload Section */}
        <View style={styles.subCard}>
          <View style={styles.badgeRow}>
            <View style={[styles.badgeIcon, { backgroundColor: "#DBEAFE" }]}>
              <MaterialCommunityIcons name="file-pdf-box" size={24} color="#2563EB" />
            </View>
            <Text style={styles.badgeLabel}>Upload PDF Document</Text>
          </View>

          {/* Web Hidden input */}
          {Platform.OS === "web" && (
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          )}

          {!selectedFile ? (
            <TouchableOpacity
              style={[styles.dropzone, isDragOver && styles.dropzoneActive]}
              onPress={handleBrowseFile}
              activeOpacity={0.85}
              {...(Platform.OS === "web"
                ? {
                    onDragOver: handleDragOver,
                    onDragLeave: handleDragLeave,
                    onDrop: handleDrop,
                  }
                : {})}
            >
              <View style={styles.dropzoneIconWrapper}>
                <MaterialCommunityIcons name="cloud-upload-outline" size={28} color="#6366F1" />
              </View>
              <Text style={styles.dropzoneTitle}>Drag & Drop PDF here</Text>
              <Text style={styles.dropzoneSubtitle}>
                or <Text style={styles.browseLink}>browse files</Text>
              </Text>
              <Text style={styles.dropzoneHint}>PDF documents up to 50MB</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.filePreview}>
              <View style={styles.filePreviewIconBox}>
                <MaterialCommunityIcons name="file-pdf-box" size={24} color="#EF4444" />
              </View>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.fileName} numberOfLines={1}>
                  {selectedFile.name}
                </Text>
                <Text style={styles.fileSize}>{selectedFile.size}</Text>
              </View>
              <TouchableOpacity style={styles.removeBtn} onPress={onRemoveFile}>
                <MaterialCommunityIcons name="trash-can-outline" size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={[styles.btn, styles.pdfBtn, !selectedFile && styles.btnDisabled]}
            disabled={!selectedFile}
            onPress={() => onTriggerProcess(selectedLanguage)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="lightning-bolt" size={18} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.btnText}>Generate Study Notes</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    borderColor: "rgba(229, 231, 235, 0.4)",
    marginBottom: 20,
    ...Platform.select({
      web: {
        backdropFilter: "blur(20px)",
        boxShadow: "0px 10px 30px rgba(0,0,0,0.03)",
      },
    }),
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1F2937",
    marginLeft: 8,
  },
  cardDesc: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
    marginBottom: 20,
  },
  panelsRow: {
    flexDirection: isLargeScreen ? "row" : "column",
    gap: 16,
  },
  subCard: {
    flex: 1,
    backgroundColor: "rgba(249, 250, 251, 0.6)",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(243, 244, 246, 0.6)",
    justifyContent: "space-between",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  badgeIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
    marginLeft: 10,
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  urlInput: {
    flex: 1,
    fontSize: 13.5,
    color: "#1F2937",
    paddingVertical: 12,
    paddingHorizontal: 8,
    ...Platform.select({
      web: { outlineStyle: "none" },
    }),
  },
  checklist: {
    gap: 8,
    marginBottom: 16,
  },
  checkItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkText: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 6,
  },
  dropzone: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#D1D5DB",
    borderRadius: 16,
    paddingVertical: 22,
    alignItems: "center",
    backgroundColor: "#fff",
    marginBottom: 12,
  },
  dropzoneActive: {
    borderColor: "#6366F1",
    backgroundColor: "#EEF2FF",
  },
  dropzoneIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  dropzoneTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#374151",
  },
  dropzoneSubtitle: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },
  browseLink: {
    color: "#6366F1",
    fontWeight: "700",
  },
  dropzoneHint: {
    fontSize: 10,
    color: "#9CA3AF",
    marginTop: 6,
  },
  filePreview: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFbeb",
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  filePreviewIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  fileName: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#1F2937",
  },
  fileSize: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 1,
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(239, 68, 68, 0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 14,
    elevation: 2,
    overflow: "hidden",
  },
  ytBtn: {
    backgroundColor: "#EF4444",
    ...Platform.select({
      web: { boxShadow: "0px 4px 12px rgba(239, 68, 68, 0.2)" },
    }),
  },
  pdfBtn: {
    backgroundColor: "#6366F1",
    ...Platform.select({
      web: { boxShadow: "0px 4px 12px rgba(99, 102, 241, 0.2)" },
    }),
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnText: {
    color: "#fff",
    fontSize: 13.5,
    fontWeight: "700",
  },
  languageContainer: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  langHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  langTitle: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#4B5563",
  },
  langChipsScroll: {
    paddingVertical: 4,
    gap: 8,
  },
  langChip: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "rgba(229, 231, 235, 0.8)",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 4,
    ...Platform.select({
      web: {
        transition: "all 0.2s ease",
        cursor: "pointer",
      },
    }),
  },
  langChipActive: {
    backgroundColor: "#EEF2FF",
    borderColor: "#6366F1",
  },
  langChipText: {
    fontSize: 12.5,
    color: "#6B7280",
    fontWeight: "700",
  },
  langChipTextActive: {
    color: "#4F46E5",
  },
});

export default UploadPanel;
