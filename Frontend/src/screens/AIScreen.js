import React, { useState, useEffect, useContext } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  Alert,
} from "react-native";
import { AuthContext } from "../context/AuthContext";
import courseService from "../services/courseService";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import AIToolsPanel from "../components/AIToolsPanel";
import AINotesGenerator from "../components/AINotesGenerator";
import AIQuizGenerator from "../components/AIQuizGenerator";
import AITranscriber from "../components/AITranscriber";
import AIDoubtSolver from "../components/AIDoubtSolver";
import UploadLearningMaterial from "../components/UploadLearningMaterial";

const { width: screenWidth } = Dimensions.get("window");
const isLargeScreen = Platform.OS === "web" && screenWidth >= 1024;

const AIScreen = ({ route }) => {
  const { user } = useContext(AuthContext);
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [activeToolTab, setActiveToolTab] = useState("notes");
  const [loading, setLoading] = useState(false);

  // Pre-generated shared states
  const [preGeneratedNotes, setPreGeneratedNotes] = useState(null);
  const [preGeneratedPoints, setPreGeneratedPoints] = useState([]);
  const [preGeneratedQuiz, setPreGeneratedQuiz] = useState(null);
  const [preGeneratedTranscript, setPreGeneratedTranscript] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (route?.params?.courseId) {
      setSelectedCourseId(route.params.courseId);
    }
  }, [route?.params?.courseId]);

  useEffect(() => {
    // Clear pre-generated states when course changes
    setPreGeneratedNotes(null);
    setPreGeneratedPoints([]);
    setPreGeneratedQuiz(null);
    setPreGeneratedTranscript(null);
  }, [selectedCourseId]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await courseService.getAllCourses();
      const allCourses = response.data?.courses || [];
      setCourses(allCourses);
      if (allCourses.length > 0 && !selectedCourseId) {
        setSelectedCourseId(allCourses[0].course_id || allCourses[0].id);
      }
    } catch (error) {
      console.error("Fetch Courses Error:", error);
      Alert.alert("Error", "Failed to load courses.");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = (type, data) => {
    if (type === "view") {
      // data = tab name like "notes" or "quiz"
      setActiveToolTab(data);
    } else if (type === "processed") {
      if (data.notes) {
        setPreGeneratedNotes(data.notes);
        if (data.points) setPreGeneratedPoints(data.points);
      }
      if (data.quiz) {
        setPreGeneratedQuiz(data.quiz);
      }
      if (data.transcript) {
        setPreGeneratedTranscript(data.transcript);
      }
      // After youtube/pdf upload completes, switch to notes tab with 100ms delay to avoid race conditions
      setTimeout(() => {
        setActiveToolTab("notes");
      }, 100);
    } else {
      setActiveToolTab("notes");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <MaterialCommunityIcons
            name="lightbulb-outline"
            size={28}
            color="#FFA500"
            style={{ marginRight: 10 }}
          />
          <Text style={styles.title}>AI Learning Tools</Text>
        </View>
        <Text style={styles.subtitle}>Focused tools for learning and productivity.</Text>
      </View>

      <ScrollView style={styles.toolArea} contentContainerStyle={styles.toolAreaContent}>
        {/* Course Pills */}
        

        <AIToolsPanel
  courseId={selectedCourseId}
  userId={user?.userId}
  activeToolTab={activeToolTab}
  setActiveToolTab={setActiveToolTab}
/>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#071120",
  },

  // HEADER
  header: {
    paddingTop: 58,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: "#071120",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },

  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  title: {
    fontSize: 30,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.8,
  },

  subtitle: {
    fontSize: 14,
    color: "#94A3B8",
    marginLeft: 38,
    lineHeight: 20,
  },

  // COURSE PILLS
  courseContainer: {
    paddingVertical: 16,
    paddingLeft: 16,
    backgroundColor: "#071120",
  },

  coursePill: {
    marginRight: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: "#111C2E",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  coursePillActive: {
    backgroundColor: "#6366F1",
    borderColor: "#6366F1",
  },

  courseText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#94A3B8",
  },

  courseTextActive: {
    color: "#FFFFFF",
  },

  // TOOL AREA
  toolArea: {
    flex: 1,
    paddingHorizontal: isLargeScreen ? 30 : 0,
  },

  toolAreaContent: {
    paddingBottom: 120,
  },

  // LOADING
  loadingContainer: {
    padding: 24,
    alignItems: "center",
  },

  loadingText: {
    fontSize: 15,
    color: "#94A3B8",
  },

  // TOOL WRAPPER
  toolContentWrapper: {
    flex: 1,
  },

  // EMPTY STATE
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 420,
    paddingHorizontal: 30,
  },

  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 24,
  },
});

export default AIScreen;
