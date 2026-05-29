import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const ErrorFallback = ({ message, suggestion, onRetry }) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <MaterialCommunityIcons name="alert-circle-outline" size={36} color="#EF4444" />
      </View>
      <Text style={styles.title}>Caption Extraction Failed</Text>
      <Text style={styles.message}>
        {message || "This video does not contain subtitles/captions."}
      </Text>
      <Text style={styles.suggestion}>
        {suggestion || "Try another video with captions enabled."}
      </Text>

      {onRetry && (
        <TouchableOpacity style={styles.retryBtn} onPress={onRetry} activeOpacity={0.8}>
          <MaterialCommunityIcons name="refresh" size={18} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.retryBtnText}>Upload Another</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(255, 255, 255, 0.75)",
    borderRadius: 24,
    padding: 32,
    borderWidth: 1.5,
    borderColor: "rgba(239, 68, 68, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      web: {
        backdropFilter: "blur(20px)",
        boxShadow: "0px 10px 30px rgba(239, 68, 68, 0.05)",
      },
    }),
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 16.5,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 13.5,
    fontWeight: "600",
    color: "#DC2626",
    textAlign: "center",
    marginBottom: 4,
    paddingHorizontal: 12,
  },
  suggestion: {
    fontSize: 12.5,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6366F1",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    ...Platform.select({
      web: {
        boxShadow: "0px 4px 12px rgba(99, 102, 241, 0.2)",
      },
    }),
  },
  retryBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
});

export default ErrorFallback;
