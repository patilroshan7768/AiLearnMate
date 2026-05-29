import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
  Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import ToolCard from "./ToolCard";
import UploadPanel from "./UploadPanel";
import ProcessingLoader from "./ProcessingLoader";
import ResultsPanel from "./ResultsPanel";
import ActivityPanel from "./ActivityPanel";
import aiService from "../services/aiService";

const { width: screenWidth } = Dimensions.get("window");
const isLargeScreen = Platform.OS === "web" && screenWidth >= 1024;

const AIToolsSection = ({
  courseId,
  userId,
  activeToolTab = "notes",
  setActiveToolTab,
}) => {
  // 6 Premium AI Workspaces
  const tools = [
    {
      id: "notes",
      title: "AI Notes Generator",
      description: "Auto-generate structured reference & study notes.",
      icon: "file-document-outline",
      color: "#FF6B6B",
    },
    {
      id: "summary",
      title: "AI Summary Generator",
      description: "Extract executive takeaway bullet points & highlights.",
      icon: "star-four-points",
      color: "#9333EA",
    },
    {
      id: "quiz",
      title: "AI Quiz Generator",
      description: "Generate interactive MCQ checks from content.",
      icon: "checkbox-marked-outline",
      color: "#4ECDC4",
    },
    {
      id: "transcribe",
      title: "Audio/Video to Text",
      description: "Convert video lectures or audio to clean transcripts.",
      icon: "microphone-outline",
      color: "#45B7D1",
    },
    {
      id: "doubt",
      title: "AI Doubt Solver",
      description: "Ask questions and get instant structured clarifications.",
      icon: "lightbulb-outline",
      color: "#FFA500",
    },
    {
      id: "flashcards",
      title: "AI Flashcards Generator",
      description: "Revision flashcards for key terms & definitions.",
      icon: "cards-outline",
      color: "#EC4899",
    },
  ];

  // Selected tool ID
  const [selectedTool, setSelectedTool] = useState(activeToolTab || "notes");

  // Sync with prop if it changes externally
  useEffect(() => {
    if (activeToolTab) {
      setSelectedTool(activeToolTab);
    }
  }, [activeToolTab]);

  // Upload/File States
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [captionError, setCaptionError] = useState(null);

  // Processing & Progression States
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("uploading"); // 'uploading'|'extracting'|'thinking'|'generating'|'completed'
  const [processingProgress, setProcessingProgress] = useState(0);

  // Results State Store (caches result for each tool)
  const [resultsCache, setResultsCache] = useState({
    notes: null,
    quiz: null,
    transcribe: null,
    summary: null,
    flashcards: null,
  });

  // Doubt Chat messages log
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      role: "assistant",
      text: "Hello! 👋 I'm your premium Study Assistant. Ask me any question, clarify complex terms, or review concepts from your uploaded materials.",
      timestamp: new Date(),
    },
  ]);
  const [loadingChat, setLoadingChat] = useState(false);

  // Recent activities list
  const [activities, setActivities] = useState([]);

  // File picker handler
  const handleFileSelect = (fileData) => {
    setSelectedFile(fileData);
    setYoutubeUrl(""); // Clear other input
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  // Add recent activity item
  const logActivity = (toolId, fileName) => {
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const newAct = {
      id: Date.now().toString(),
      toolId,
      fileName,
      time,
      data: resultsCache[toolId],
    };
    setActivities((prev) => [newAct, ...prev.slice(0, 9)]);
  };

  const handleRetry = () => {
    setYoutubeUrl("");
    setSelectedFile(null);
    setCaptionError(null);
    setResultsCache({
      notes: null,
      quiz: null,
      transcribe: null,
      summary: null,
      flashcards: null,
    });
  };

  // Process Youtube Url Trigger
  const handleAnalyzeYoutube = async (selectedLang = "English") => {
    const cleanedUrl = youtubeUrl.trim().replace(/^[-+*\s]+/, "");
    if (!cleanedUrl) return;

    // Validate YouTube URL
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = cleanedUrl.match(regExp);
    const videoId = (match && match[2].length === 11) ? match[2] : null;

    if (!videoId) {
      Alert.alert("Invalid Link", "Please enter a valid YouTube video URL.");
      return;
    }

    setIsProcessing(true);
    setCaptionError(null); // Reset captions extraction error

    try {
      // 1. Validating YouTube Link
      setProcessingStatus("validating");
      setProcessingProgress(10);
      await new Promise(r => setTimeout(r, 400));

      // 2. Fetching Captions
      setProcessingStatus("fetching");
      setProcessingProgress(25);
      await new Promise(r => setTimeout(r, 400));

      // 3. Extracting Transcript
      setProcessingStatus("extracting");
      setProcessingProgress(40);
      const transRes = await aiService.transcribeYouTube(cleanedUrl);
      
      if (transRes && transRes.success === false) {
        throw new Error(transRes.message || transRes.error || "Failed to extract transcript.");
      }

      const transcript = transRes.data?.transcript || transRes.transcript || transRes.data?.transcription || transRes.transcription || "";

      if (!transcript || transcript.trim().length === 0) {
        throw new Error("This video does not contain subtitles/captions.");
      }

      setResultsCache((prev) => ({
        ...prev,
        transcribe: transcript,
      }));

      // 4. Parallel AI processing for notes, quiz, summary, and flashcards (lightning-fast)
      setProcessingStatus("generating");
      setProcessingProgress(60);

      const [notesSettled, quizSettled, summarySettled, flashcardsSettled] = await Promise.allSettled([
        aiService.generateNotesFromText({
          text: transcript,
          title: "YouTube Study Guide",
          course_id: courseId,
          language: selectedLang,
        }),
        aiService.generateQuizFromText({
          text: transcript,
          course_id: courseId,
          num_questions: 20,
          language: selectedLang,
        }),
        aiService.summarize(transcript),
        aiService.generateFlashcardsFromText({
          text: transcript,
          course_id: courseId,
          count: 10,
          language: selectedLang,
        })
      ]);

      // Extract results from settled promises
      let generatedNotes = "";
      if (notesSettled.status === "fulfilled") {
        const notesRes = notesSettled.value;
        generatedNotes = notesRes.data?.data?.notes || notesRes.data?.notes || notesRes.data?.summary || notesRes.notes || "";
      } else {
        console.error("Notes generation failed:", notesSettled.reason);
        generatedNotes = "Notes generation failed due to AI API traffic. You can try regenerating by selecting 'AI Notes Generator' later.";
      }

      let questions = [];
      if (quizSettled.status === "fulfilled") {
        const quizRes = quizSettled.value;
        if (quizRes && quizRes.success !== false) {
          questions = quizRes.data?.data?.quiz || quizRes.data?.quiz || quizRes.data?.data?.questions || quizRes.data?.questions || [];
          if (typeof questions === "string") {
            questions = JSON.parse(questions);
          }
        }
      } else {
        console.error("Quiz generation failed:", quizSettled.reason);
      }

      let generatedSummary = "";
      if (summarySettled.status === "fulfilled") {
        const summaryRes = summarySettled.value;
        generatedSummary = summaryRes.data?.data?.summary || summaryRes.data?.summary || "";
      } else {
        console.error("Summary generation failed:", summarySettled.reason);
        generatedSummary = "AI Summary generation could not be completed at this time.";
      }

      let generatedFlashcards = [];
      if (flashcardsSettled.status === "fulfilled") {
        const flashcardsRes = flashcardsSettled.value;
        if (flashcardsRes && flashcardsRes.success !== false) {
          generatedFlashcards = flashcardsRes.data?.flashcards || flashcardsRes.flashcards || [];
        }
      } else {
        console.error("Flashcards generation failed:", flashcardsSettled.reason);
      }

      const updatedCache = {
        notes: generatedNotes,
        quiz: questions,
        transcribe: transcript,
        summary: generatedSummary,
        flashcards: generatedFlashcards,
      };

      setResultsCache(updatedCache);

      // 7. Completed
      setProcessingStatus("completed");
      setProcessingProgress(100);

      // Finish up
      setTimeout(() => {
        setIsProcessing(false);
        // Default to notes view
        setSelectedTool("notes");
        if (setActiveToolTab) setActiveToolTab("notes");

        // Log activities
        const sourceTitle = "YouTube Video Upload";
        logActivity("notes", sourceTitle);
      }, 500);

    } catch (err) {
      console.error("Youtube caption extraction failed:", err);
      setIsProcessing(false);
      const errMsg = err.error || err.message || (err.data && (err.data.error || err.data.message)) || "This video does not contain subtitles/captions.";
      setCaptionError(errMsg);
    }
  };

  // Process Local PDF document trigger
  const handleAnalyzePDF = async (selectedLang = "English") => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setProcessingStatus("generating");
    setProcessingProgress(30);

    try {
      // 1. Parallel execution for Notes, Quiz, and Flashcards (lightning-fast)
      const [notesSettled, quizSettled, flashcardsSettled] = await Promise.allSettled([
        aiService.generateNotesFromFile({
          file: selectedFile,
          course_id: courseId,
          language: selectedLang,
        }),
        aiService.generateQuizFromFile({
          file: selectedFile,
          course_id: courseId,
          num_questions: 20,
          language: selectedLang,
        }),
        aiService.generateFlashcardsFromFile({
          file: selectedFile,
          course_id: courseId,
          count: 10,
          language: selectedLang,
        })
      ]);

      let generatedNotes = "";
      if (notesSettled.status === "fulfilled") {
        const notesRes = notesSettled.value;
        generatedNotes = notesRes.data?.data?.notes || notesRes.data?.notes || notesRes.data?.summary || notesRes.notes || "";
      } else {
        console.error("PDF notes generation failed:", notesSettled.reason);
        generatedNotes = "Notes generation failed. You can try selecting 'AI Notes Generator' to retry.";
      }

      let questions = [];
      if (quizSettled.status === "fulfilled") {
        const quizRes = quizSettled.value;
        questions = quizRes.data?.data?.quiz || quizRes.data?.quiz || quizRes.data?.data?.questions || quizRes.data?.questions || [];
        if (typeof questions === "string") {
          questions = JSON.parse(questions);
        }
      } else {
        console.error("PDF quiz generation failed:", quizSettled.reason);
      }

      let generatedFlashcards = [];
      if (flashcardsSettled.status === "fulfilled") {
        const flashcardsRes = flashcardsSettled.value;
        generatedFlashcards = flashcardsRes.data?.data?.flashcards || flashcardsRes.data?.flashcards || [];
      } else {
        console.error("PDF flashcards generation failed:", flashcardsSettled.reason);
      }

      // 2. Generate Summary Takeaway from generatedNotes (if available)
      let generatedSummary = "";
      if (generatedNotes) {
        try {
          const summaryRes = await aiService.summarize(generatedNotes);
          generatedSummary = summaryRes.data?.data?.summary || summaryRes.data?.summary || "";
        } catch (summaryErr) {
          console.error("PDF summary generation failed:", summaryErr.message);
          generatedSummary = "AI Summary generation could not be completed at this time.";
        }
      }

      const updatedCache = {
        notes: generatedNotes,
        quiz: questions,
        transcribe: generatedNotes, // Fallback PDF text
        summary: generatedSummary,
        flashcards: generatedFlashcards,
      };

      setResultsCache(updatedCache);

      setProcessingStatus("completed");
      setProcessingProgress(100);

      setTimeout(() => {
        setIsProcessing(false);
        setSelectedTool("notes");
        if (setActiveToolTab) setActiveToolTab("notes");
        logActivity("notes", selectedFile.name);
      }, 500);

    } catch (err) {
      console.error("PDF processing failed:", err);
      setIsProcessing(false);
      const errMsg = err.error || err.message || (err.data && (err.data.error || err.data.message)) || "An error occurred while building the workspace.";
      Alert.alert("Upload Failed", errMsg);
    }
  };

  // Doubt solver chat trigger
  const handleSendMessage = async (text) => {
    if (!text.trim() || loadingChat) return;

    // Add user message to log
    const userMsg = {
      id: Date.now().toString(),
      role: "user",
      text,
      timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setLoadingChat(true);

    try {
      const res = await aiService.solveDoubt({
        question: text,
        course_id: courseId,
        user_id: userId,
        context: resultsCache.notes,
      });

      const explanation = res.data?.answer || res.data?.explanation || res.answer || "I could not formulate an answer. Please rephrase.";
      const assistantMsg = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: explanation,
        timestamp: new Date(),
      };

      setChatMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error("Chat explanation failed:", err);
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          text: "Sorry, I had an issue connecting to the reasoning model. Let me check again in a bit.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoadingChat(false);
    }
  };

  const handleClearChat = () => {
    setChatMessages([
      {
        id: 1,
        role: "assistant",
        text: "Hello! 👋 I'm your premium Study Assistant. Ask me any question, clarify complex terms, or review concepts from your uploaded materials.",
        timestamp: new Date(),
      },
    ]);
  };

  // Select a recent activity log to reload in results Cache
  const handleSelectActivity = (act) => {
    setSelectedTool(act.toolId);
    if (setActiveToolTab) setActiveToolTab(act.toolId);
  };

  const currentToolColor = tools.find((t) => t.id === selectedTool)?.color || "#6366F1";

  return (
    <View style={styles.dashboardContainer}>
      <View style={isLargeScreen ? styles.desktopGrid : styles.mobileStack}>
        {/* LEFT COLUMN: Controls Panel */}
        <View style={isLargeScreen ? styles.leftColumn : styles.mobileColumn}>
          {/* AI Tools Grid Selection */}
          <View style={styles.gridSection}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="creation" size={20} color="#6366F1" />
              <Text style={styles.sectionTitle}>Select AI Tool Workspace</Text>
            </View>
            <View style={styles.cardsWrap}>
              {tools.map((tool) => (
                <ToolCard
                  key={tool.id}
                  icon={tool.icon}
                  title={tool.title}
                  description={tool.description}
                  color={tool.color}
                  isActive={selectedTool === tool.id}
                  onPress={() => {
                    setSelectedTool(tool.id);
                    if (setActiveToolTab) setActiveToolTab(tool.id);
                  }}
                />
              ))}
            </View>
          </View>

          {/* Dynamic Content Upload Panel */}
          <UploadPanel
            courseId={courseId}
            userId={userId}
            youtubeUrl={youtubeUrl}
            selectedFile={selectedFile}
            onUrlChange={setYoutubeUrl}
            onFileSelect={handleFileSelect}
            onRemoveFile={handleRemoveFile}
            onTriggerProcess={handleAnalyzePDF}
            onTriggerYoutube={handleAnalyzeYoutube}
          />

          {/* Activity Panel Logs */}
          <ActivityPanel activities={activities} onSelectActivity={handleSelectActivity} />
        </View>

        {/* RIGHT COLUMN: Interactive Workspaces Output */}
        <View style={isLargeScreen ? styles.rightColumn : styles.mobileColumn}>
          {isProcessing ? (
            <ProcessingLoader status={processingStatus} progress={processingProgress} />
          ) : (
            <ResultsPanel
              toolId={selectedTool}
              data={resultsCache[selectedTool]}
              chatMessages={chatMessages}
              onSendMessage={handleSendMessage}
              loadingChat={loadingChat}
              onClearChat={handleClearChat}
              onCopy={(copiedText) => console.log("Copied text log length:", copiedText.length)}
              onDownload={() => console.log("File download export triggered.")}
              captionError={captionError}
              onRetry={handleRetry}
            />
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  dashboardContainer: {
    paddingVertical: 12,
  },
  desktopGrid: {
    flexDirection: "row",
    gap: 20,
    width: "100%",
  },
  mobileStack: {
    flexDirection: "column",
    gap: 16,
    width: "100%",
  },
  leftColumn: {
    width: "48%",
    maxWidth: 580,
  },
  rightColumn: {
    flex: 1,
  },
  mobileColumn: {
    width: "100%",
  },
  gridSection: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 24,
    padding: 16,
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1F2937",
  },
  cardsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
});

export default AIToolsSection;
