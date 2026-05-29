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
import { MaterialCommunityIcons } from "@expo/vector-icons";
import aiService from "../services/aiService";

const { width: screenWidth } = Dimensions.get("window");
const isLargeScreen = Platform.OS === "web" && screenWidth >= 1024;

const AIQuizGenerator = ({ courseId, userId, initialQuiz }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [loading, setLoading] = useState(false);
  const [quizData, setQuizData] = useState(initialQuiz || null);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);
  const [useFile, setUseFile] = useState(false);

  React.useEffect(() => {
    if (initialQuiz) {
      setQuizData(initialQuiz);
    } else {
      setQuizData(null);
    }
    setSelectedAnswers({});
    setSubmitted(false);
    setScore(null);
  }, [initialQuiz]);

  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "text/plain",
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.length > 0) {
        setSelectedFile(result.assets[0]);
        setUseFile(true);
        setQuizData(null);
        setSelectedAnswers({});
        setSubmitted(false);
        setScore(null);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick file: " + error.message);
    }
  };

  const handleGenerateQuiz = async () => {
    const content = useFile ? selectedFile : noteText;

    if (!content) {
      return Alert.alert(
        "Error",
        useFile ? "Please select a file first" : "Please enter notes first",
      );
    }

    setLoading(true);
    try {
      let response;
      if (useFile && selectedFile) {
        response = await aiService.generateQuizFromFile({
          file: selectedFile,
          course_id: courseId,
          num_questions: 20,
        });
      } else {
        response = await aiService.generateQuizFromText({
          text: noteText,
          course_id: courseId,
          num_questions: 20,
        });
      }

      if (response && response.data) {
        let questions = response.data.quiz || response.data.questions || [];

        if (typeof questions === "string") {
          questions = JSON.parse(questions);
        }

        setQuizData(questions);
        setSelectedAnswers({});
        setSubmitted(false);
        setScore(null);
      }
    } catch (error) {
      console.error("Quiz generation error:", error);
      Alert.alert(
        "Error",
        "Failed to generate quiz: " + (error.message || "Unknown error"),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnswer = (questionIdx, option) => {
    if (submitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIdx]: option,
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
    if (!quizData || quizData.length === 0) return;

    let correctCount = 0;
    quizData.forEach((q, idx) => {
      if (isAnswerCorrect(q, selectedAnswers[idx])) {
        correctCount++;
      }
    });

    const percentScore = Math.round((correctCount / quizData.length) * 100);
    setScore({
      correct: correctCount,
      total: quizData.length,
      percentage: percentScore,
    });
    setSubmitted(true);
  };

  const handleResetQuiz = () => {
    setSelectedAnswers({});
    setSubmitted(false);
    setScore(null);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📝 AI Quiz Generator</Text>
        <Text style={styles.description}>
          Upload notes or paste text, and AI will create MCQ quiz questions
          instantly.
        </Text>

        {/* Input Type Selector */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleButton, !useFile && styles.toggleButtonActive]}
            onPress={() => {
              setUseFile(false);
              setQuizData(null);
              setSelectedAnswers({});
              setSubmitted(false);
            }}
          >
            <Text
              style={[
                styles.toggleButtonText,
                !useFile && styles.toggleButtonTextActive,
              ]}
            >
              📝 Paste Text
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, useFile && styles.toggleButtonActive]}
            onPress={() => {
              setUseFile(true);
              setQuizData(null);
              setSelectedAnswers({});
              setSubmitted(false);
            }}
          >
            <Text
              style={[
                styles.toggleButtonText,
                useFile && styles.toggleButtonTextActive,
              ]}
            >
              📄 Upload File
            </Text>
          </TouchableOpacity>
        </View>

        {/* Input Area */}
        {useFile ? (
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
              {selectedFile ? selectedFile.name : "Select Notes File"}
            </Text>
          </TouchableOpacity>
        ) : (
          <TextInput
            style={styles.textInput}
            placeholder="Paste your notes or study material here..."
            value={noteText}
            onChangeText={setNoteText}
            multiline
            numberOfLines={6}
            editable={!loading}
          />
        )}

        {/* Generate Button */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.generateButton,
            loading && styles.buttonDisabled,
          ]}
          onPress={handleGenerateQuiz}
          disabled={
            loading || (!useFile && !noteText) || (useFile && !selectedFile)
          }
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <MaterialCommunityIcons name="auto-fix" size={20} color="#fff" />
              <Text style={styles.buttonText}>Generate Quiz</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Quiz Display */}
        {quizData && quizData.length > 0 && (
          <View style={styles.resultsSection}>
            <View style={styles.quizHeader}>
              <Text style={styles.resultsTitle}>✨ AI Generated Quiz</Text>
              <Text style={styles.quizMeta}>{quizData.length} Questions</Text>
            </View>

            {/* Quiz Questions */}
            {quizData.map((question, qIdx) => {
              const options = question.options || question.choices || [];
              const correctAnswerVal = getCorrectOption(question);
              const isAnswered = selectedAnswers[qIdx] !== undefined;
              const isCorrect = isAnswered && isAnswerCorrect(question, selectedAnswers[qIdx]);

              return (
                <View key={qIdx} style={styles.questionCard}>
                  <Text style={styles.questionNumber}>Q{qIdx + 1}</Text>
                  <Text style={styles.questionText}>
                    {question.question || question.text}
                  </Text>

                  <View style={styles.optionsContainer}>
                    {options.map((option, oIdx) => {
                      const isSelected = selectedAnswers[qIdx] === option;
                      let optionStyle = styles.option;
                      let optionTextStyle = styles.optionText;

                      if (submitted && isSelected) {
                        optionStyle = isCorrect
                          ? styles.optionCorrect
                          : styles.optionWrong;
                        optionTextStyle = styles.optionTextSelected;
                      } else if (
                        submitted &&
                        option === correctAnswerVal &&
                        !isCorrect
                      ) {
                        optionStyle = styles.optionCorrect;
                        optionTextStyle = styles.optionTextSelected;
                      } else if (isSelected && !submitted) {
                        optionStyle = styles.optionSelected;
                        optionTextStyle = styles.optionTextSelected;
                      }

                      return (
                        <TouchableOpacity
                          key={oIdx}
                          style={optionStyle}
                          onPress={() => handleSelectAnswer(qIdx, option)}
                          disabled={submitted}
                          activeOpacity={0.7}
                        >
                          <Text style={optionTextStyle}>{option}</Text>
                          {submitted && option === correctAnswerVal && (
                            <MaterialCommunityIcons
                              name="check-circle"
                              size={18}
                              color="#4ECDC4"
                            />
                          )}
                          {submitted && isSelected && !isCorrect && (
                            <MaterialCommunityIcons
                              name="close-circle"
                              size={18}
                              color="#FF6B6B"
                            />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              );
            })}

            {/* Score Display */}
            {submitted && score && (
              <View style={styles.scoreContainer}>
                <View style={styles.scoreCircle}>
                  <Text style={styles.scorePercentage}>
                    {score.percentage}%
                  </Text>
                </View>
                <Text style={styles.scoreText}>
                  You got {score.correct} out of {score.total} correct!
                </Text>
                <Text
                  style={[
                    styles.scoreMessage,
                    score.percentage >= 70 ? styles.scoreGood : styles.scoreBad,
                  ]}
                >
                  {score.percentage >= 70
                    ? "🎉 Great Job!"
                    : "📚 Keep Studying!"}
                </Text>

                <TouchableOpacity
                  style={[styles.actionButton, styles.resetButton]}
                  onPress={handleResetQuiz}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name="refresh"
                    size={20}
                    color="#fff"
                  />
                  <Text style={styles.buttonText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Submit Button */}
            {!submitted && (
              <TouchableOpacity
                style={[styles.actionButton, styles.submitButton]}
                onPress={handleSubmitQuiz}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="check-bold"
                  size={20}
                  color="#fff"
                />
                <Text style={styles.buttonText}>Submit Quiz</Text>
              </TouchableOpacity>
            )}
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
    backgroundColor: "#4ECDC4",
    borderColor: "#4ECDC4",
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
  textInput: {
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    fontSize: 13,
    color: "#333",
    maxHeight: 150,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    marginVertical: 8,
  },
  generateButton: {
    backgroundColor: "#4ECDC4",
  },
  submitButton: {
    backgroundColor: "#45B7D1",
  },
  resetButton: {
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
  quizHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  quizMeta: {
    fontSize: 12,
    color: "#999",
    backgroundColor: "#f5f5f5",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  questionCard: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  questionNumber: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4ECDC4",
    marginBottom: 6,
  },
  questionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
    lineHeight: 20,
  },
  optionsContainer: {
    gap: 8,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#f9f9f9",
  },
  optionSelected: {
    backgroundColor: "#e0f7f6",
    borderColor: "#4ECDC4",
    borderWidth: 2,
  },
  optionCorrect: {
    backgroundColor: "#d4edda",
    borderColor: "#4ECDC4",
  },
  optionWrong: {
    backgroundColor: "#f8d7da",
    borderColor: "#FF6B6B",
  },
  optionText: {
    flex: 1,
    fontSize: 13,
    color: "#555",
  },
  optionTextSelected: {
    color: "#333",
    fontWeight: "500",
  },
  scoreContainer: {
    alignItems: "center",
    marginTop: 20,
    paddingVertical: 20,
    backgroundColor: "#f0fffe",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d4edda",
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#4ECDC4",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  scorePercentage: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#fff",
  },
  scoreText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 8,
    fontWeight: "500",
  },
  scoreMessage: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  scoreGood: {
    color: "#4ECDC4",
  },
  scoreBad: {
    color: "#FF6B6B",
  },
});

export default AIQuizGenerator;
