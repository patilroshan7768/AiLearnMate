import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const ProcessingLoader = ({ status = "thinking", progress = 0 }) => {
  const isYoutube = ["validating", "fetching"].includes(status) || status === "validating" || status === "fetching";

  // Map steps to human-friendly indicators
  const steps = isYoutube
    ? [
        { key: "validating", label: "Validating YouTube Link", icon: "link" },
        { key: "fetching", label: "Fetching Captions", icon: "cloud-download" },
        { key: "extracting", label: "Extracting Transcript", icon: "file-search" },
        { key: "thinking", label: "AI Processing", icon: "brain" },
        { key: "generating", label: "Generating Results", icon: "auto-fix" },
        { key: "completed", label: "Completed", icon: "check-all" },
      ]
    : [
        { key: "uploading", label: "Uploading Material", icon: "cloud-upload" },
        { key: "extracting", label: "Extracting Content Text", icon: "file-search" },
        { key: "thinking", label: "AI Brainstorming", icon: "brain" },
        { key: "generating", label: "Generating Premium Workspace", icon: "auto-fix" },
        { key: "completed", label: "Workspace Fully Prepared", icon: "check-all" },
      ];

  // Helper to determine step states: 'done' | 'active' | 'pending'
  const getStepState = (stepKey, currentStatus) => {
    const statusOrder = isYoutube
      ? ["validating", "fetching", "extracting", "thinking", "generating", "completed"]
      : ["uploading", "extracting", "thinking", "generating", "completed"];
    const currentIdx = statusOrder.indexOf(currentStatus);
    const stepIdx = statusOrder.indexOf(stepKey);

    if (currentIdx > stepIdx) return "done";
    if (currentIdx === stepIdx) return "active";
    return "pending";
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ActivityIndicator size="large" color="#6366F1" style={{ marginBottom: 12 }} />
        <Text style={styles.title}>AI Engine Processing...</Text>
        <Text style={styles.subtitle}>Our AI is currently reviewing, indexing, and modeling your source file.</Text>
      </View>

      {/* Main Progress Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>{progress}% complete</Text>
      </View>

      {/* Progressive Steps */}
      <View style={styles.stepsContainer}>
        {steps.map((step, index) => {
          const state = getStepState(step.key, status);

          let circleBgColor = "rgba(243, 244, 246, 0.8)";
          let iconColor = "#9CA3AF";
          let labelStyle = styles.stepLabelPending;
          let isCurrent = false;

          if (state === "done") {
            circleBgColor = "#D1FAE5";
            iconColor = "#10B981";
            labelStyle = styles.stepLabelDone;
          } else if (state === "active") {
            circleBgColor = "#EEF2FF";
            iconColor = "#6366F1";
            labelStyle = styles.stepLabelActive;
            isCurrent = true;
          }

          return (
            <View key={step.key} style={styles.stepRow}>
              {/* Step indicator circle */}
              <View style={[styles.stepCircle, { backgroundColor: circleBgColor }, isCurrent && styles.activeCircle]}>
                {state === "done" ? (
                  <MaterialCommunityIcons name="check" size={16} color="#10B981" />
                ) : (
                  <MaterialCommunityIcons name={step.icon} size={16} color={iconColor} />
                )}
              </View>

              {/* Step title */}
              <View style={styles.stepInfo}>
                <Text style={labelStyle}>{step.label}</Text>
                {isCurrent && (
                  <Text style={styles.stepLiveTag}>Running AI Agent...</Text>
                )}
              </View>

              {/* Step connection line (drawn except for last) */}
              {index < steps.length - 1 && (
                <View
                  style={[
                    styles.verticalLine,
                    {
                      backgroundColor: state === "done" ? "#10B981" : "rgba(229, 231, 235, 0.5)",
                    },
                  ]}
                />
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(255, 255, 255, 0.75)",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1.5,
    borderColor: "rgba(229, 231, 235, 0.4)",
    alignItems: "center",
    ...Platform.select({
      web: {
        backdropFilter: "blur(20px)",
        boxShadow: "0px 10px 30px rgba(0,0,0,0.03)",
      },
    }),
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12.5,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  progressSection: {
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
    marginBottom: 28,
  },
  progressBarBg: {
    width: "100%",
    height: 8,
    borderRadius: 8,
    backgroundColor: "rgba(229, 231, 235, 0.6)",
    overflow: "hidden",
    marginBottom: 8,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 8,
    backgroundColor: "#6366F1",
  },
  progressText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#6366F1",
  },
  stepsContainer: {
    width: "100%",
    maxWidth: 320,
    alignItems: "flex-start",
    paddingLeft: 8,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    position: "relative",
    width: "100%",
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  activeCircle: {
    borderWidth: 2,
    borderColor: "#6366F1",
  },
  stepInfo: {
    marginLeft: 14,
    flex: 1,
  },
  stepLabelPending: {
    fontSize: 13,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  stepLabelActive: {
    fontSize: 13,
    color: "#6366F1",
    fontWeight: "700",
  },
  stepLabelDone: {
    fontSize: 13,
    color: "#10B981",
    fontWeight: "600",
  },
  stepLiveTag: {
    fontSize: 10,
    color: "#6366F1",
    fontWeight: "700",
    marginTop: 2,
  },
  verticalLine: {
    position: "absolute",
    left: 15,
    top: 32,
    width: 2.5,
    height: 22,
    zIndex: 1,
  },
});

export default ProcessingLoader;
