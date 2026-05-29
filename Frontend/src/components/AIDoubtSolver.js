import React, { useState, useRef, useEffect } from "react";
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
  KeyboardAvoidingView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import aiService from "../services/aiService";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const isLargeScreen = Platform.OS === "web" && screenWidth >= 1024;

const AIDoubtSolver = ({ courseId, userId }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      text: "Hello! 👋 I'm your AI Doubt Solver. Ask me any question about your studies, and I'll provide step-by-step, beginner-friendly explanations. What do you want to learn about today?",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [messageCount, setMessageCount] = useState(1);
  const scrollViewRef = useRef();

  const [copiedMessageId, setCopiedMessageId] = useState(null);

  const handleCopyMessage = (text, id) => {
    if (Platform.OS === "web") {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedMessageId(id);
        setTimeout(() => setCopiedMessageId(null), 2000);
      });
    } else {
      setCopiedMessageId(id);
      setTimeout(() => setCopiedMessageId(null), 2000);
      Alert.alert("Success", "Answer copied to clipboard!");
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSendMessage = async () => {
    const question = inputText.trim();
    if (!question) return;
    if (loading) return;

    // Add user message
    const userMessageId = messageCount + 1;
    setMessages((prev) => [
      ...prev,
      {
        id: userMessageId,
        role: "user",
        text: question,
        timestamp: new Date(),
      },
    ]);

    setInputText("");
    setMessageCount(userMessageId);
    setLoading(true);

    try {
      const response = await aiService.solveDoubt({
        question,
        course_id: courseId,
        user_id: userId,
      });

      let answerText = "";
      if (response && response.data) {
        answerText =
          response.data.answer ||
          response.data.explanation ||
          response.data.reply ||
          "Unable to generate answer";
      } else if (response && response.answer) {
        answerText = response.answer;
      }

      const assistantMessageId = userMessageId + 1;
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          role: "assistant",
          text: answerText,
          timestamp: new Date(),
        },
      ]);
      setMessageCount(assistantMessageId);
    } catch (error) {
      console.error("Doubt solver error:", error);
      const errorMessageId = messageCount + 2;
      setMessages((prev) => [
        ...prev,
        {
          id: errorMessageId,
          role: "assistant",
          text: "Sorry, I encountered an error processing your question. Please try again or rephrase your question.",
          timestamp: new Date(),
          isError: true,
        },
      ]);
      setMessageCount(errorMessageId);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    Alert.alert("Clear Chat", "Are you sure you want to clear all messages?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: () => {
          setMessages([
            {
              id: 1,
              role: "assistant",
              text: "Hello! 👋 I'm your AI Doubt Solver. Ask me any question about your studies, and I'll provide step-by-step, beginner-friendly explanations. What do you want to learn about today?",
              timestamp: new Date(),
            },
          ]);
          setMessageCount(1);
        },
      },
    ]);
  };

  const handleSuggestedQuestion = (question) => {
    setInputText(question);
    // Automatically send after a short delay
    setTimeout(() => {
      setInputText(question);
      // Trigger send
      handleSendMessage();
    }, 100);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>💡 AI Doubt Solver</Text>
          <Text style={styles.headerSubtitle}>
            Ask any question - Get instant step-by-step answers
          </Text>
        </View>
        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleClearChat}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="delete-outline"
            size={18}
            color="#FFA500"
          />
        </TouchableOpacity>
      </View>

      {/* Messages Area */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={true}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageRow,
              message.role === "user"
                ? styles.userMessageRow
                : styles.assistantMessageRow,
            ]}
          >
            {message.role === "assistant" && (
              <View style={styles.assistantAvatarContainer}>
                <MaterialCommunityIcons
                  name="robot-outline"
                  size={20}
                  color="#FFA500"
                />
              </View>
            )}

            <View
              style={[
                styles.messageBubble,
                message.role === "user"
                  ? styles.userBubble
                  : styles.assistantBubble,
                message.isError && styles.errorBubble,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  message.role === "user" && styles.userMessageText,
                ]}
              >
                {message.text}
              </Text>
              
              <View style={styles.bubbleFooter}>
                <Text style={[styles.timestamp, message.role === "user" && { color: "rgba(255,255,255,0.7)" }]}>
                  {message.timestamp?.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
                {message.role === "assistant" && (
                  <TouchableOpacity
                    style={styles.copyMessageButton}
                    onPress={() => handleCopyMessage(message.text, message.id)}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons
                      name={copiedMessageId === message.id ? "check-circle" : "content-copy"}
                      size={12}
                      color={copiedMessageId === message.id ? "#10B981" : "#FFA500"}
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {message.role === "user" && (
              <View style={styles.userAvatarContainer}>
                <MaterialCommunityIcons
                  name="account-circle"
                  size={20}
                  color="#45B7D1"
                />
              </View>
            )}
          </View>
        ))}

        {loading && (
          <View style={styles.loadingRow}>
            <View style={styles.assistantAvatarContainer}>
              <MaterialCommunityIcons
                name="robot-outline"
                size={20}
                color="#FFA500"
              />
            </View>
            <View style={[styles.messageBubble, styles.assistantBubble]}>
              <ActivityIndicator size="small" color="#FFA500" />
              <Text style={styles.loadingText}>AI is thinking...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Suggested Questions - Show when no questions asked yet */}
      {messages.length === 1 && !loading && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>Try asking:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.suggestionsScroll}
          >
            <TouchableOpacity
              style={styles.suggestionChip}
              onPress={() =>
                handleSuggestedQuestion("How do photosynthesis works?")
              }
            >
              <MaterialCommunityIcons name="leaf" size={16} color="#4ECDC4" />
              <Text style={styles.suggestionText}>Photosynthesis</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.suggestionChip}
              onPress={() =>
                handleSuggestedQuestion("Explain Newton's first law of motion")
              }
            >
              <MaterialCommunityIcons name="motion" size={16} color="#45B7D1" />
              <Text style={styles.suggestionText}>Physics Laws</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.suggestionChip}
              onPress={() =>
                handleSuggestedQuestion(
                  "What is algebra and how to solve equations?",
                )
              }
            >
              <MaterialCommunityIcons
                name="calculator"
                size={16}
                color="#FF6B6B"
              />
              <Text style={styles.suggestionText}>Algebra</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Ask your question here..."
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            editable={!loading}
            placeholderTextColor="#999"
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || loading) && styles.sendButtonDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={!inputText.trim() || loading}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <MaterialCommunityIcons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
        <Text style={styles.charCount}>{inputText.length}/500</Text>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#999",
  },
  clearButton: {
    padding: 8,
    marginLeft: 12,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  messageRow: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "flex-end",
  },
  userMessageRow: {
    justifyContent: "flex-end",
  },
  assistantMessageRow: {
    justifyContent: "flex-start",
  },
  assistantAvatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFF3E0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    marginBottom: 2,
  },
  userAvatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E0F7F6",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    marginBottom: 2,
  },
  messageBubble: {
    maxWidth: "85%",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  assistantBubble: {
    backgroundColor: "#FFF3E0",
    borderTopLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: "#45B7D1",
    borderTopRightRadius: 4,
  },
  errorBubble: {
    backgroundColor: "#FFE0E0",
  },
  messageText: {
    fontSize: 13,
    color: "#333",
    lineHeight: 18,
  },
  userMessageText: {
    color: "#fff",
  },
  timestamp: {
    fontSize: 10,
    color: "#999",
  },
  bubbleFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
    width: "100%",
    gap: 8,
  },
  copyMessageButton: {
    padding: 2,
    marginLeft: 6,
  },
  loadingRow: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "flex-end",
  },
  loadingText: {
    fontSize: 13,
    color: "#999",
    marginLeft: 8,
    fontStyle: "italic",
  },
  suggestionsContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  suggestionsTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  suggestionsScroll: {
    marginHorizontal: -4,
  },
  suggestionChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  suggestionText: {
    fontSize: 12,
    color: "#333",
    fontWeight: "500",
    marginLeft: 6,
  },
  inputContainer: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 13,
    color: "#333",
    borderWidth: 1,
    borderColor: "#ddd",
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#45B7D1",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  charCount: {
    fontSize: 10,
    color: "#999",
    marginLeft: 12,
    marginTop: 4,
  },
});

export default AIDoubtSolver;
