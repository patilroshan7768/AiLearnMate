import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
  Alert,
  FlatList,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import ErrorFallback from "./ErrorFallback";
import TranscriptViewer from "./TranscriptViewer";
import * as Clipboard from "expo-clipboard";

const ResultsPanel = ({
  toolId,
  data,
  onCopy,
  onDownload,
  // Doubt solver specific props
  chatMessages = [],
  onSendMessage,
  loadingChat = false,
  onClearChat,
  suggestedQuestions = [
    "What is the key takeaway of this content?",
    "Can you explain this like I'm 5?",
    "Give me 3 practical examples of this concept.",
  ],
  captionError = null,
  onRetry = null,
}) => {
  const [copied, setCopied] = useState(false);
  const [keywordSearch, setKeywordSearch] = useState("");
  const chatScrollRef = useRef(null);

  // Quiz interactive states
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(null);

  // Doubt Input state
  const [chatInput, setChatInput] = useState("");

  // Flashcard states
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    setCurrentFlashcardIndex(0);
    setIsFlipped(false);
  }, [data, toolId]);

  useEffect(() => {
    setTimeout(() => {
      chatScrollRef.current?.scrollToEnd({
        animated: true,
      });
    }, 200);
  }, [chatMessages]);

  // Copy helper
  const handleCopyText = async (textToCopy) => {
    if (!textToCopy) return;

    await Clipboard.setStringAsync(textToCopy);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);

    Alert.alert("Copied", "Copied to clipboard successfully!");
  };

  // Local Download helper (web-safe text downloader)
  const handleDownloadFile = async (textToDownload, fileType = "txt") => {
    if (!textToDownload) return;
    const title = toolId ? toolId.toUpperCase() : "EXPORT";
    const fileName = `${title}_${Date.now()}.${fileType}`;

    if (Platform.OS === "web") {
      const element = document.createElement("a");
      const file = new Blob([textToDownload], { type: "text/plain" });
      element.href = URL.createObjectURL(file);
      element.download = fileName;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      if (onDownload) onDownload();
    } else {
      try {
        const fileUri = FileSystem.documentDirectory + fileName;
        await FileSystem.writeAsStringAsync(fileUri, textToDownload);
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: "text/plain",
            dialogTitle: `Export AI ${title}`,
          });
        } else {
          Alert.alert("Success", `File saved at: ${fileUri}`);
        }
        if (onDownload) onDownload();
      } catch (error) {
        Alert.alert("Error", `Export failed: ${error.message}`);
      }
    }
  };

  // Interactive Quiz Functions
  const handleSelectQuizOption = (qIdx, option) => {
    if (quizSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [qIdx]: option,
    }));
  };

  const isAnswerCorrect = (q, selectedOption) => {
    if (selectedOption === undefined || selectedOption === null) return false;
    const options = q.options || q.choices || [];

    // 1. Match string answer
    if (q.answer !== undefined && String(selectedOption).toLowerCase().trim() === String(q.answer).toLowerCase().trim()) {
      return true;
    }
    if (q.correct_answer !== undefined && String(selectedOption).toLowerCase().trim() === String(q.correct_answer).toLowerCase().trim()) {
      return true;
    }

    // 2. Match by index
    if (typeof q.correctAnswer === "number" && q.correctAnswer >= 0 && q.correctAnswer < options.length) {
      if (options[q.correctAnswer] === selectedOption) return true;
    }
    if (typeof q.correct_answer === "number" && q.correct_answer >= 0 && q.correct_answer < options.length) {
      if (options[q.correct_answer] === selectedOption) return true;
    }

    return false;
  };

  const getCorrectOption = (q) => {
    const options = q.options || q.choices || [];
    if (typeof q.correctAnswer === "number" && q.correctAnswer >= 0 && q.correctAnswer < options.length) {
      return options[q.correctAnswer];
    }
    if (typeof q.correct_answer === "number" && q.correct_answer >= 0 && q.correct_answer < options.length) {
      return options[q.correct_answer];
    }
    if (q.answer !== undefined) {
      const matched = options.find(opt => String(opt).toLowerCase().trim() === String(q.answer).toLowerCase().trim());
      if (matched) return matched;
    }
    if (q.correct_answer !== undefined) {
      const matched = options.find(opt => String(opt).toLowerCase().trim() === String(q.correct_answer).toLowerCase().trim());
      if (matched) return matched;
    }
    return q.answer || q.correct_answer;
  };

  const handleSubmitQuiz = () => {
    if (!data || !Array.isArray(data)) return;

    console.log("QUIZ DATA", data);
    let correctCount = 0;
    data.forEach((q, idx) => {
      if (isAnswerCorrect(q, selectedAnswers[idx])) {
        correctCount++;
      }
    });

    const finalPercent = Math.round((correctCount / data.length) * 100);
    setQuizScore({
      correct: correctCount,
      total: data.length,
      percentage: finalPercent,
    });
    setQuizSubmitted(true);
  };

  const handleResetQuiz = () => {
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
  };

  // Chat/Doubt solver send triggers
  const handleSendChat = () => {
    const text = chatInput.trim();
    if (!text || loadingChat) return;
    onSendMessage(text);
    setChatInput("");
  };

  const handleSuggestedPrompt = (prompt) => {
    onSendMessage(prompt);
  };

  // Keyword highlighting logic for transcripts
  const renderHighlightedText = (text, search) => {
    if (!search.trim()) return <Text style={styles.bodyText}>{text}</Text>;

    const parts = text.split(new RegExp(`(${search})`, "gi"));
    return (
      <Text style={styles.bodyText}>
        {parts.map((part, index) =>
          part.toLowerCase() === search.toLowerCase() ? (
            <Text key={index} style={styles.highlightText}>
              {part}
            </Text>
          ) : (
            part
          )
        )}
      </Text>
    );
  };

  // Layout Render Routing
  const renderContent = () => {
    if (captionError) {
      return (
        <ErrorFallback
          message={captionError}
          suggestion="Try another video with captions enabled."
          onRetry={onRetry}
        />
      );
    }

    if (!data && toolId !== "doubt") {
      return (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="lightning-bolt-outline" size={42} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Workspace Empty</Text>
          <Text style={styles.emptySubtitle}>Upload a file or video first to extract data and feed the AI.</Text>
        </View>
      );
    }

    switch (toolId) {
      case "notes":
        return (
          <ScrollView contentContainerStyle={styles.scrollPadding}>
            <View style={styles.workspaceHeader}>
              <View>
                <Text style={styles.workspaceTitle}>✨ AI Generated Study Notes</Text>
                <Text style={styles.workspaceSubtitle}>Notion-Style Smart Reference Guide</Text>
              </View>
              <View style={styles.actionRowFloating}>
                <TouchableOpacity style={styles.actionBtnSmall} onPress={() => handleCopyText(data)}>
                  <MaterialCommunityIcons name={copied ? "check-circle" : "content-copy"} size={16} color={copied ? "#10B981" : "#6366F1"} />
                  <Text style={[styles.actionBtnSmallText, copied && { color: "#10B981" }]}>{copied ? "Copied" : "Copy"}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.notionCard}>
              <Text style={styles.notionText}>{data}</Text>
            </View>
          </ScrollView>
        );

      case "quiz":
        const questionsList = Array.isArray(data) ? data : [];
        return (
          <ScrollView contentContainerStyle={styles.scrollPadding}>
            <View style={styles.workspaceHeader}>
              <View>
                <Text style={styles.workspaceTitle}>📝 Interactive Practice Quiz</Text>
                <Text style={styles.workspaceSubtitle}>Test your content mastery instantly</Text>
              </View>
              {quizSubmitted && (
                <TouchableOpacity style={styles.actionBtnSmall} onPress={handleResetQuiz}>
                  <MaterialCommunityIcons name="refresh" size={16} color="#6366F1" />
                  <Text style={styles.actionBtnSmallText}>Retake</Text>
                </TouchableOpacity>
              )}
            </View>

            {questionsList.map((q, qIdx) => {
              const options = q.options || q.choices || [];
              const correctAnsVal = getCorrectOption(q);
              const isAnswered = selectedAnswers[qIdx] !== undefined;
              const isCorrect = isAnswered && isAnswerCorrect(q, selectedAnswers[qIdx]);

              return (
                <View key={qIdx} style={styles.quizCard}>
                  <View style={styles.quizCardHeader}>
                    <Text style={styles.quizCardNumber}>QUESTION {qIdx + 1}</Text>
                    {quizSubmitted && (
                      <MaterialCommunityIcons
                        name={isCorrect ? "check-circle" : "close-circle"}
                        size={20}
                        color={isCorrect ? "#10B981" : "#EF4444"}
                      />
                    )}
                  </View>
                  <Text style={styles.quizQuestion}>{q.question || q.text}</Text>

                  <View style={styles.quizOptions}>
                    {options.map((option, oIdx) => {
                      const isSelected = selectedAnswers[qIdx] === option;
                      let optionBg = "#fff";
                      let optionBorder = "rgba(229, 231, 235, 0.8)";
                      let optionTextColor = "#374151";

                      if (quizSubmitted) {
                        if (option === correctAnsVal) {
                          optionBg = "#ECFDF5";
                          optionBorder = "#10B981";
                          optionTextColor = "#047857";
                        } else if (isSelected) {
                          optionBg = "#FEF2F2";
                          optionBorder = "#EF4444";
                          optionTextColor = "#B91C1C";
                        }
                      } else if (isSelected) {
                        optionBg = "#EEF2FF";
                        optionBorder = "#6366F1";
                        optionTextColor = "#4F46E5";
                      }

                      return (
                        <TouchableOpacity
                          key={oIdx}
                          style={[styles.quizOptionBtn, { backgroundColor: optionBg, borderColor: optionBorder }]}
                          onPress={() => handleSelectQuizOption(qIdx, option)}
                          disabled={quizSubmitted}
                        >
                          <Text style={[styles.quizOptionText, { color: optionTextColor }]}>{option}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              );
            })}

            {/* Score Ring / Block */}
            {quizSubmitted && quizScore && (
              <View style={styles.scoreContainer}>
                <View style={styles.scoreBadge}>
                  <Text style={styles.scoreNumber}>{quizScore.percentage}%</Text>
                </View>
                <Text style={styles.scoreTitle}>Quiz Completed!</Text>
                <Text style={styles.scoreSub}>
                  You answered {quizScore.correct} out of {quizScore.total} questions correctly.
                </Text>
                <TouchableOpacity style={styles.scoreRetryBtn} onPress={handleResetQuiz}>
                  <Text style={styles.scoreRetryBtnText}>Reset & Try Again</Text>
                </TouchableOpacity>
              </View>
            )}

            {!quizSubmitted && questionsList.length > 0 && (
              <TouchableOpacity style={styles.quizSubmitBtn} onPress={handleSubmitQuiz}>
                <Text style={styles.quizSubmitBtnText}>Submit Answers</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        );

      case "transcribe":
        return (
          <TranscriptViewer
            text={data}
            onCopy={handleCopyText}
            onDownload={handleDownloadFile}
          />
        );

      case "doubt":
        return (
          <View style={styles.chatWorkspace}>
            <View style={[styles.workspaceHeader, { paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: "rgba(229,231,235,0.4)", paddingBottom: 12 }]}>
              <View>
                <Text style={styles.workspaceTitle}>💡 AI Study Assistant (Doubt Solver)</Text>
                <Text style={styles.workspaceSubtitle}>Ask questions, clarify concepts, learn step-by-step</Text>
              </View>
              {chatMessages.length > 1 && (
                <TouchableOpacity style={styles.actionBtnSmall} onPress={onClearChat}>
                  <MaterialCommunityIcons name="delete-sweep-outline" size={16} color="#EF4444" />
                  <Text style={[styles.actionBtnSmallText, { color: "#EF4444" }]}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>

            <ScrollView
  nestedScrollEnabled={true}
  ref={chatScrollRef}
  style={styles.chatScroll}
  contentContainerStyle={styles.chatScrollContent}
>
              {chatMessages.map((msg, index) => {
                const isAI = msg.role === "assistant";
                return (
                  <View key={msg.id || index} style={[styles.chatRow, isAI ? styles.chatRowAI : styles.chatRowUser]}>
                    {isAI && (
                      <View style={styles.chatAvatarAI}>
                        <MaterialCommunityIcons name="robot" size={16} color="#6366F1" />
                      </View>
                    )}
                    <View style={[styles.chatBubble, isAI ? styles.chatBubbleAI : styles.chatBubbleUser]}>
                      <Text style={[styles.chatBubbleText, isAI ? styles.chatTextAI : styles.chatTextUser]}>
                        {msg.text || msg.content}
                      </Text>
                      {isAI && (
                        <TouchableOpacity
                          style={styles.chatCopyIcon}
                          onPress={() => handleCopyText(msg.text || msg.content)}
                        >
                          <MaterialCommunityIcons name="content-copy" size={12} color="#9CA3AF" />
                        </TouchableOpacity>
                      )}
                    </View>
                    {!isAI && (
                      <View style={styles.chatAvatarUser}>
                        <MaterialCommunityIcons name="account" size={16} color="#fff" />
                      </View>
                    )}
                  </View>
                );
              })}

              {loadingChat && (
                <View style={[styles.chatRow, styles.chatRowAI]}>
                  <View style={styles.chatAvatarAI}>
                    <MaterialCommunityIcons name="robot" size={16} color="#6366F1" />
                  </View>
                  <View style={[styles.chatBubble, styles.chatBubbleAI, styles.chatBubbleTyping]}>
                    <ActivityIndicator size="small" color="#6366F1" style={{ marginRight: 6 }} />
                    <Text style={[styles.chatBubbleText, styles.chatTextAI, { fontStyle: "italic" }]}>
                      AI is generating explanation...
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Suggestions Chips */}
            {chatMessages.length <= 1 && (
              <View style={styles.suggestionsWrapper}>
                <Text style={styles.suggestionsTitle}>💡 Quick Prompts:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionsScroll}>
                  {suggestedQuestions.map((q, idx) => (
                    <TouchableOpacity key={idx} style={styles.suggestChip} onPress={() => handleSuggestedPrompt(q)}>
                      <Text style={styles.suggestChipText}>{q}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Chat Input Field */}
            <View style={styles.chatInputContainer}>
              <TextInput
                style={styles.chatInputText}
                placeholder="Ask AI your homework question..."
                placeholderTextColor="#9CA3AF"
                value={chatInput}
                onChangeText={setChatInput}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[styles.chatSendBtn, (!chatInput.trim() || loadingChat) && styles.chatSendBtnDisabled]}
                onPress={handleSendChat}
                disabled={!chatInput.trim() || loadingChat}
              >
                <MaterialCommunityIcons name="send" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        );

      case "summary":
        return (
          <ScrollView contentContainerStyle={styles.scrollPadding}>
            <View style={styles.workspaceHeader}>
              <View>
                <Text style={styles.workspaceTitle}>📋 Exec Summaries & Key Lessons</Text>
                <Text style={styles.workspaceSubtitle}>Short, high-level summary takeaways</Text>
              </View>
              <View style={styles.actionRowFloating}>
                <TouchableOpacity style={styles.actionBtnSmall} onPress={() => handleCopyText(data)}>
                  <MaterialCommunityIcons name={copied ? "check-circle" : "content-copy"} size={16} color={copied ? "#10B981" : "#6366F1"} />
                  <Text style={[styles.actionBtnSmallText, copied && { color: "#10B981" }]}>{copied ? "Copied" : "Copy"}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.summaryCard}>
              <View style={styles.summaryHeaderBadge}>
                <MaterialCommunityIcons name="star-four-points" size={16} color="#F59E0B" />
                <Text style={styles.summaryHeaderBadgeText}>Structured Summary Digest</Text>
              </View>
              <Text style={styles.summaryBodyText}>{data}</Text>
            </View>
          </ScrollView>
        );

      case "flashcards":
        let flashcardsList = [];
        if (Array.isArray(data)) {
          flashcardsList = data;
        } else if (data && typeof data === "object") {
          flashcardsList = data.flashcards || data.data?.flashcards || data.cards || [];
        }

        if (flashcardsList.length === 0) {
          return (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="cards-outline" size={42} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>Workspace Empty</Text>
              <Text style={styles.emptySubtitle}>Upload a file or video first to automatically build revision flashcards.</Text>
            </View>
          );
        }

        const currentCard = flashcardsList[currentFlashcardIndex] || {};

        return (
          <View style={styles.flashcardsWorkspace}>
            <View style={[styles.workspaceHeader, { paddingHorizontal: 20 }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.workspaceTitle}>🎴 Premium Revision Flashcards</Text>
                <Text style={styles.workspaceSubtitle}>Flip cards to review key terminology & concepts</Text>
              </View>
              <Text style={styles.flashcardProgressBadge}>
                {currentFlashcardIndex + 1} / {flashcardsList.length}
              </Text>
            </View>

            <View style={styles.flashcardContainer}>
              <TouchableOpacity
                activeOpacity={0.9}
                style={[
                  styles.flashcardMain,
                  isFlipped ? styles.flashcardBackStyle : styles.flashcardFrontStyle
                ]}
                onPress={() => setIsFlipped(!isFlipped)}
              >
                <MaterialCommunityIcons
                  name={isFlipped ? "checkbox-marked-circle-outline" : "help-circle-outline"}
                  size={32}
                  color={isFlipped ? "#EC4899" : "#6366F1"}
                  style={styles.flashcardIcon}
                />

                <Text style={styles.flashcardSideLabel}>
                  {isFlipped ? "ANSWER / EXPLANATION" : "QUESTION / KEY TERM"}
                </Text>

                <Text style={[styles.flashcardText, isFlipped ? styles.flashcardTextBack : styles.flashcardTextFront]}>
                  {isFlipped ? (currentCard.back || currentCard.answer) : (currentCard.front || currentCard.question)}
                </Text>

                <View style={styles.flipPrompt}>
                  <MaterialCommunityIcons name="swap-horizontal" size={14} color="#9CA3AF" />
                  <Text style={styles.flipPromptText}>Tap card to flip</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.flashcardControls}>
              <TouchableOpacity
                style={[styles.flashcardControlBtn, currentFlashcardIndex === 0 && styles.flashcardControlBtnDisabled]}
                disabled={currentFlashcardIndex === 0}
                onPress={() => {
                  setIsFlipped(false);
                  setCurrentFlashcardIndex(prev => prev - 1);
                }}
              >
                <MaterialCommunityIcons name="chevron-left" size={20} color={currentFlashcardIndex === 0 ? "#D1D5DB" : "#6366F1"} />
                <Text style={[styles.flashcardControlText, currentFlashcardIndex === 0 && { color: "#D1D5DB" }]}>Prev</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.flashcardControlBtn, currentFlashcardIndex === flashcardsList.length - 1 && styles.flashcardControlBtnDisabled]}
                disabled={currentFlashcardIndex === flashcardsList.length - 1}
                onPress={() => {
                  setIsFlipped(false);
                  setCurrentFlashcardIndex(prev => prev + 1);
                }}
              >
                <Text style={[styles.flashcardControlText, currentFlashcardIndex === flashcardsList.length - 1 && { color: "#D1D5DB" }]}>Next</Text>
                <MaterialCommunityIcons name="chevron-right" size={20} color={currentFlashcardIndex === flashcardsList.length - 1 ? "#D1D5DB" : "#6366F1"} />
              </TouchableOpacity>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return <View style={styles.container}>{renderContent()}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "rgba(229, 231, 235, 0.4)",
    overflow: "hidden",
    minHeight: 400,
    ...Platform.select({
      web: {
        backdropFilter: "blur(20px)",
        boxShadow: "0px 10px 30px rgba(0,0,0,0.03)",
      },
    }),
  },
  scrollPadding: {
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    minHeight: 400,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#374151",
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12.5,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 4,
    lineHeight: 18,
  },
  workspaceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  workspaceTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1F2937",
  },
  workspaceSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  actionRowFloating: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtnSmall: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "rgba(229,231,235,0.8)",
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
  },
  actionBtnSmallText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#6366F1",
  },
  notionCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(229, 231, 235, 0.6)",
    padding: 18,
  },
  notionText: {
    fontSize: 13.5,
    color: "#374151",
    lineHeight: 22,
  },
  quizCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(229, 231, 235, 0.6)",
    padding: 16,
    marginBottom: 16,
  },
  quizCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  quizCardNumber: {
    fontSize: 10,
    fontWeight: "800",
    color: "#6366F1",
    letterSpacing: 0.5,
  },
  quizQuestion: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
    lineHeight: 20,
    marginBottom: 14,
  },
  quizOptions: {
    gap: 8,
  },
  quizOptionBtn: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
    alignItems: "flex-start",
  },
  quizOptionText: {
    fontSize: 13,
    fontWeight: "500",
  },
  quizSubmitBtn: {
    backgroundColor: "#6366F1",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  quizSubmitBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  scoreContainer: {
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: 18,
    padding: 20,
    marginTop: 12,
  },
  scoreBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  scoreNumber: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
  },
  scoreTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#065F46",
    marginBottom: 4,
  },
  scoreSub: {
    fontSize: 12.5,
    color: "#047857",
    textAlign: "center",
    marginBottom: 16,
  },
  scoreRetryBtn: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#10B981",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  scoreRetryBtnText: {
    color: "#10B981",
    fontSize: 12,
    fontWeight: "700",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "rgba(229, 231, 235, 0.8)",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#1F2937",
    paddingVertical: 10,
    paddingHorizontal: 8,
    ...Platform.select({
      web: { outlineStyle: "none" },
    }),
  },
  transcriptBox: {
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(229, 231, 235, 0.6)",
    padding: 16,
    maxHeight: 400,
  },
  bodyText: {
    fontSize: 13.5,
    color: "#4B5563",
    lineHeight: 22,
  },
  highlightText: {
    backgroundColor: "#FDE68A",
    color: "#92400E",
    fontWeight: "700",
  },
  chatWorkspace: {
  height: 600,
  overflow: "hidden",
},
  chatScroll: {
  height: 400,
},
  chatScrollContent: {
    padding: 16,
  },
  chatRow: {
    flexDirection: "row",
    marginBottom: 14,
    width: "100%",
  },
  chatRowAI: {
    justifyContent: "flex-start",
  },
  chatRowUser: {
    justifyContent: "flex-end",
  },
  chatAvatarAI: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    alignSelf: "flex-end",
  },
  chatAvatarUser: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#6366F1",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
    alignSelf: "flex-end",
  },
  chatBubble: {
    maxWidth: "80%",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    position: "relative",
  },
  chatBubbleAI: {
    backgroundColor: "#EEF2FF",
    borderBottomLeftRadius: 4,
  },
  chatBubbleUser: {
    backgroundColor: "#6366F1",
    borderBottomRightRadius: 4,
  },
  chatBubbleTyping: {
    flexDirection: "row",
    alignItems: "center",
  },
  chatBubbleText: {
    fontSize: 13,
    lineHeight: 18,
  },
  chatTextAI: {
    color: "#374151",
  },
  chatTextUser: {
    color: "#fff",
  },
  chatCopyIcon: {
    alignSelf: "flex-end",
    marginTop: 6,
  },
  suggestionsWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(229,231,235,0.4)",
  },
  suggestionsTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9CA3AF",
    marginBottom: 6,
  },
  suggestionsScroll: {
    flexDirection: "row",
  },
  suggestChip: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "rgba(229,231,235,0.8)",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  suggestChipText: {
    fontSize: 11.5,
    color: "#6B7280",
    fontWeight: "500",
  },
  chatInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(229,231,235,0.4)",
    backgroundColor: "#fff",
  },
  chatInputText: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: "#1F2937",
    maxHeight: 80,
    marginRight: 10,
    ...Platform.select({
      web: { outlineStyle: "none" },
    }),
  },
  chatSendBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#6366F1",
    justifyContent: "center",
    alignItems: "center",
  },
  chatSendBtnDisabled: {
    backgroundColor: "#A5B4FC",
  },
  summaryCard: {
    backgroundColor: "#FFFBEB",
    borderWidth: 1.5,
    borderColor: "#FEF3C7",
    borderRadius: 18,
    padding: 18,
  },
  summaryHeaderBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignSelf: "flex-start",
    marginBottom: 12,
    gap: 4,
  },
  summaryHeaderBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#D97706",
  },
  summaryBodyText: {
    fontSize: 13.5,
    color: "#92400E",
    lineHeight: 22,
  },
  analyzerGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  analyzerStatCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "rgba(229,231,235,0.6)",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#9CA3AF",
    marginTop: 6,
    marginBottom: 2,
  },
  statVal: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#374151",
  },
  analyzerDetailCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(229,231,235,0.6)",
    padding: 16,
  },
  analyzerDetailHeader: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 8,
  },
  analyzerDetailText: {
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 20,
  },
  flashcardsWorkspace: {
    flex: 1,
    paddingVertical: 10,
    justifyContent: "space-between",
    minHeight: 400,
  },
  flashcardProgressBadge: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#EC4899",
    backgroundColor: "#FCE7F3",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  flashcardContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    marginVertical: 10,
  },
  flashcardMain: {
    width: "100%",
    maxWidth: 480,
    height: 240,
    borderRadius: 24,
    borderWidth: 2,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    backgroundColor: "#fff",
    ...Platform.select({
      web: {
        boxShadow: "0px 15px 35px rgba(0,0,0,0.06)",
        cursor: "pointer",
      },
    }),
  },
  flashcardFrontStyle: {
    borderColor: "rgba(99, 102, 241, 0.4)",
    backgroundColor: "#F8FAFC",
  },
  flashcardBackStyle: {
    borderColor: "rgba(236, 72, 153, 0.4)",
    backgroundColor: "#FFFDFD",
  },
  flashcardIcon: {
    marginBottom: 12,
  },
  flashcardSideLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#9CA3AF",
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  flashcardText: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  flashcardTextFront: {
    color: "#1F2937",
  },
  flashcardTextBack: {
    color: "#4B5563",
  },
  flipPrompt: {
    position: "absolute",
    bottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  flipPromptText: {
    fontSize: 10.5,
    fontWeight: "600",
    color: "#9CA3AF",
  },
  flashcardControls: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginTop: 10,
  },
  flashcardControlBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "rgba(229, 231, 235, 0.8)",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 20,
    gap: 4,
  },
  flashcardControlBtnDisabled: {
    backgroundColor: "#F3F4F6",
    borderColor: "#E5E7EB",
  },
  flashcardControlText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6366F1",
  },
});

export default ResultsPanel;
