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
  ActivityIndicator,
  Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import aiService from "../services/aiService";

const { width: screenWidth } = Dimensions.get("window");
const isLargeScreen = Platform.OS === "web" && screenWidth >= 900;

const UploadLearningMaterial = ({ courseId, userId, onUploadComplete }) => {
  const [ytUrl, setYtUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingType, setProcessingType] = useState(null); // 'youtube' | 'pdf'
  const [processingProgress, setProcessingProgress] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const fileInputRef = useRef(null);

  // --- YouTube URL ---
  const handleAnalyzeVideo = async () => {
    if (!ytUrl.trim()) return;
    setIsProcessing(true);
    setProcessingType("youtube");
    setIsSuccess(false);
    setProcessingProgress(10);

    try {
      // 1. Fetch transcript (FREE)
      setProcessingProgress(35);
      const transResponse = await aiService.transcribeYouTube(ytUrl);
      const transcript = transResponse.data?.transcript || transResponse.transcript || "";

      if (!transcript) {
        throw new Error("No transcript found. Make sure the video has captions/subtitles enabled.");
      }

      setProcessingProgress(60);

      // 2. Generate Notes from transcript
      const notesResponse = await aiService.generateNotesFromText({
        text: transcript,
        title: "Notes from YouTube",
        course_id: courseId,
      });

      setProcessingProgress(80);

      // 3. Generate Quiz from transcript
      const quizResponse = await aiService.generateQuizFromText({
        text: transcript,
        course_id: courseId,
        num_questions: 5,
      });

      setProcessingProgress(95);

      let parsedQuiz = quizResponse.data?.quiz || quizResponse.data?.questions || [];
      if (typeof parsedQuiz === "string") {
        parsedQuiz = JSON.parse(parsedQuiz);
      }

      setProcessingProgress(100);
      setTimeout(() => {
        setIsProcessing(false);
        setIsSuccess(true);
        if (onUploadComplete) {
          onUploadComplete("processed", {
            notes: notesResponse.data?.notes || notesResponse.data?.summary || notesResponse.notes,
            points: notesResponse.data?.important_points || notesResponse.data?.keyPoints || [],
            quiz: parsedQuiz,
            transcript: transcript,
          });
        }
      }, 500);

    } catch (error) {
      console.error("YouTube processing error:", error);
      setIsProcessing(false);
      Alert.alert(
        "Error",
        "Failed to process YouTube URL: " + (error.message || error.error || "Unknown error")
      );
    }
  };

  // --- PDF Upload (Web only) ---
  const handleBrowsePDF = () => {
    if (Platform.OS === "web" && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile({
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
        uri: URL.createObjectURL(file),
        mimeType: "application/pdf",
        file,
      });
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleGenerateNotes = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setProcessingType("pdf");
    setIsSuccess(false);
    setProcessingProgress(10);

    try {
      // 1. Generate Notes from PDF
      setProcessingProgress(45);
      const notesResponse = await aiService.generateNotesFromFile({
        file: selectedFile,
        course_id: courseId,
      });

      setProcessingProgress(75);

      // 2. Generate Quiz from PDF
      const quizResponse = await aiService.generateQuizFromFile({
        file: selectedFile,
        course_id: courseId,
        num_questions: 5,
      });

      setProcessingProgress(95);

      let parsedQuiz = quizResponse.data?.quiz || quizResponse.data?.questions || [];
      if (typeof parsedQuiz === "string") {
        parsedQuiz = JSON.parse(parsedQuiz);
      }

      setProcessingProgress(100);
      setTimeout(() => {
        setIsProcessing(false);
        setIsSuccess(true);
        if (onUploadComplete) {
          onUploadComplete("processed", {
            notes: notesResponse.data?.notes || notesResponse.data?.summary || notesResponse.notes,
            points: notesResponse.data?.important_points || notesResponse.data?.keyPoints || [],
            quiz: parsedQuiz,
            transcript: notesResponse.data?.notes || notesResponse.data?.summary || "PDF processed successfully",
          });
        }
      }, 500);

    } catch (error) {
      console.error("PDF processing error:", error);
      setIsProcessing(false);
      Alert.alert(
        "Error",
        "Failed to process PDF: " + (error.message || error.error || "Unknown error")
      );
    }
  };

  // --- Drag & Drop (Web) ---
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e) => {
    if (Platform.OS === "web") {
      e.preventDefault();
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e) => {
    if (Platform.OS !== "web") return;
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile({
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
        uri: URL.createObjectURL(file),
        mimeType: "application/pdf",
        file,
      });
    }
  };

  const handleReset = () => {
    setIsSuccess(false);
    setYtUrl("");
    setSelectedFile(null);
    setProcessingProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // --- Processing Overlay ---
  if (isProcessing) {
    return (
      <View style={styles.outerWrapper}>
        <View style={styles.processingCard}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.processingTitle}>
            {processingType === "youtube"
              ? "Analyzing Video..."
              : "Processing PDF..."}
          </Text>
          <Text style={styles.processingSubtitle}>
            Generating notes, quiz, summary & enabling doubt solver
          </Text>
          <View style={styles.progressBarOuter}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${processingProgress}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>{processingProgress}%</Text>
        </View>
      </View>
    );
  }

  // --- Success State ---
  if (isSuccess) {
    return (
      <View style={styles.outerWrapper}>
        <View style={styles.successCard}>
          <View style={styles.successIconWrap}>
            <MaterialCommunityIcons
              name="check-circle"
              size={40}
              color="#10B981"
            />
          </View>
          <Text style={styles.successTitle}>
            Content processed successfully!
          </Text>
          <Text style={styles.successSubtitle}>
            AI has generated Notes, Quiz, Summary and enabled Doubt Solver.
          </Text>
          <View style={styles.successActions}>
            <TouchableOpacity
              style={styles.successPill}
              onPress={() => onUploadComplete && onUploadComplete("view", "notes")}
            >
              <MaterialCommunityIcons
                name="file-document-outline"
                size={16}
                color="#fff"
              />
              <Text style={styles.successPillText}>View Notes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.successPill}
              onPress={() => onUploadComplete && onUploadComplete("view", "quiz")}
            >
              <MaterialCommunityIcons
                name="checkbox-marked-outline"
                size={16}
                color="#fff"
              />
              <Text style={styles.successPillText}>Take Quiz</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.successPill, styles.outlinePill]}
              onPress={handleReset}
            >
              <MaterialCommunityIcons
                name="refresh"
                size={16}
                color="#6366F1"
              />
              <Text style={[styles.successPillText, { color: "#6366F1" }]}>
                Upload Another
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // --- Main Upload UI ---
  return (
    <View style={styles.outerWrapper}>
      {/* Section Title */}
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name="cloud-upload" size={22} color="#6366F1" />
        <Text style={styles.sectionTitle}>Upload Learning Material</Text>
      </View>
      <Text style={styles.emptyHint}>
        Upload PDF or paste YouTube URL to start AI learning.
      </Text>

      {/* Two Cards */}
      <View style={styles.cardsRow}>
        {/* LEFT: YouTube Card */}
        <View style={[styles.uploadCard, styles.ytCard]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconWrap, { backgroundColor: "#FEE2E2" }]}>
              <MaterialCommunityIcons name="youtube" size={26} color="#EF4444" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Paste YouTube URL</Text>
              <Text style={styles.cardDesc}>
                Video or Course Playlist link
              </Text>
            </View>
          </View>

          <View style={styles.ytInputGroup}>
            <MaterialCommunityIcons
              name="link-variant"
              size={18}
              color="#9CA3AF"
            />
            <TextInput
              style={styles.ytInput}
              placeholder="https://youtube.com/watch?v=..."
              placeholderTextColor="#9CA3AF"
              value={ytUrl}
              onChangeText={setYtUrl}
              autoCapitalize="none"
            />
            {ytUrl.length > 0 && (
              <TouchableOpacity onPress={() => setYtUrl("")}>
                <MaterialCommunityIcons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.featuresList}>
            <FeatureItem text="Fetch transcript automatically" />
            <FeatureItem text="Generate Notes + Quiz" />
            <FeatureItem text="Enable AI Doubt Solver" />
          </View>

          <TouchableOpacity
            style={[
              styles.actionBtn,
              styles.ytBtn,
              !ytUrl.trim() && styles.btnDisabled,
            ]}
            onPress={handleAnalyzeVideo}
            disabled={!ytUrl.trim()}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="shimmer" size={18} color="#fff" />
            <Text style={styles.actionBtnText}>Analyze Video</Text>
          </TouchableOpacity>
        </View>

        {/* RIGHT: PDF Card */}
        <View style={[styles.uploadCard, styles.pdfCard]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconWrap, { backgroundColor: "#DBEAFE" }]}>
              <MaterialCommunityIcons
                name="file-pdf-box"
                size={26}
                color="#3B82F6"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Upload PDF Notes</Text>
              <Text style={styles.cardDesc}>
                Drag & drop or browse files
              </Text>
            </View>
          </View>

          {/* Hidden file input (web only) */}
          {Platform.OS === "web" && (
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          )}

          {/* Dropzone / File Preview */}
          {!selectedFile ? (
            <TouchableOpacity
              style={[styles.dropzone, isDragOver && styles.dropzoneActive]}
              onPress={handleBrowsePDF}
              activeOpacity={0.85}
              {...(Platform.OS === "web"
                ? {
                    onDragOver: handleDragOver,
                    onDragLeave: handleDragLeave,
                    onDrop: handleDrop,
                  }
                : {})}
            >
              <View style={styles.dropIconWrap}>
                <MaterialCommunityIcons
                  name="cloud-upload-outline"
                  size={32}
                  color="#6366F1"
                />
              </View>
              <Text style={styles.dropTitle}>Drag & Drop PDF here</Text>
              <Text style={styles.dropSub}>
                or <Text style={styles.browseLink}>browse files</Text>
              </Text>
              <Text style={styles.dropHint}>PDF files up to 50MB</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.filePreview}>
              <View style={styles.fileIconBox}>
                <MaterialCommunityIcons
                  name="file-pdf-box"
                  size={24}
                  color="#EF4444"
                />
              </View>
              <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={1}>
                  {selectedFile.name}
                </Text>
                <Text style={styles.fileSize}>{selectedFile.size}</Text>
              </View>
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={handleRemoveFile}
              >
                <MaterialCommunityIcons name="close" size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.actionBtn,
              styles.pdfBtn,
              !selectedFile && styles.btnDisabled,
            ]}
            onPress={handleGenerateNotes}
            disabled={!selectedFile}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="shimmer" size={18} color="#fff" />
            <Text style={styles.actionBtnText}>Generate AI Notes</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// --- Feature checklist item ---
const FeatureItem = ({ text }) => (
  <View style={styles.featureItem}>
    <MaterialCommunityIcons name="check-circle" size={16} color="#10B981" />
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

// ==============================
// STYLES
// ==============================
const styles = StyleSheet.create({
  outerWrapper: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  emptyHint: {
    fontSize: 13,
    color: "#9CA3AF",
    marginBottom: 16,
    marginLeft: 30,
  },

  // Two-card row
  cardsRow: {
    flexDirection: isLargeScreen ? "row" : "column",
    gap: 14,
  },

  // Card common
  uploadCard: {
    flex: isLargeScreen ? 1 : undefined,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    boxShadow: "0px 4px 24px rgba(0, 0, 0, 0.06)",
    elevation: 4,
  },

  // Card header
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  cardIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1F2937",
  },
  cardDesc: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 1,
  },

  // YouTube input
  ytInputGroup: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "web" ? 0 : 2,
    gap: 8,
    marginBottom: 12,
  },
  ytInput: {
    flex: 1,
    fontSize: 14,
    color: "#1F2937",
    paddingVertical: 11,
    ...(Platform.OS === "web" ? { outlineStyle: "none" } : {}),
  },

  // Features list
  featuresList: {
    gap: 6,
    marginBottom: 14,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  featureText: {
    fontSize: 12.5,
    color: "#6B7280",
  },

  // Action buttons
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
  },
  ytBtn: {
    backgroundColor: "#EF4444",
    boxShadow: "0px 4px 14px rgba(239, 68, 68, 0.25)",
    elevation: 4,
  },
  pdfBtn: {
    backgroundColor: "#6366F1",
    boxShadow: "0px 4px 14px rgba(99, 102, 241, 0.25)",
    elevation: 4,
  },
  btnDisabled: {
    opacity: 0.45,
  },
  actionBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },

  // Dropzone
  dropzone: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#D1D5DB",
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FAFBFC",
    marginBottom: 14,
  },
  dropzoneActive: {
    borderColor: "#6366F1",
    backgroundColor: "#EEF2FF",
  },
  dropIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  dropTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 2,
  },
  dropSub: {
    fontSize: 13,
    color: "#9CA3AF",
  },
  browseLink: {
    color: "#6366F1",
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  dropHint: {
    fontSize: 11,
    color: "#D1D5DB",
    marginTop: 6,
  },

  // File preview
  filePreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  fileIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1F2937",
  },
  fileSize: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 1,
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
  },

  // Processing card
  processingCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    boxShadow: "0px 4px 24px rgba(0, 0, 0, 0.06)",
    elevation: 4,
  },
  processingTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginTop: 16,
  },
  processingSubtitle: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 4,
    textAlign: "center",
  },
  progressBarOuter: {
    width: "80%",
    maxWidth: 280,
    height: 6,
    borderRadius: 6,
    backgroundColor: "#E5E7EB",
    marginTop: 20,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 6,
    backgroundColor: "#6366F1",
  },
  progressText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6366F1",
    marginTop: 8,
  },

  // Success card
  successCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    boxShadow: "0px 4px 24px rgba(16, 185, 129, 0.08)",
    elevation: 4,
  },
  successIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#D1FAE5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#10B981",
    marginBottom: 4,
  },
  successSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 18,
  },
  successActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
  },
  successPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 100,
    backgroundColor: "#6366F1",
  },
  outlinePill: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  successPillText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
});

export default UploadLearningMaterial;
