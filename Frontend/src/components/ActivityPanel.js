import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const ActivityPanel = ({ activities = [], onSelectActivity }) => {
  // Map tools to their styling/visuals
  const getToolMeta = (toolId) => {
    switch (toolId) {
      case "notes":
        return { label: "Notes Generator", icon: "file-document-outline", color: "#FF6B6B" };
      case "quiz":
        return { label: "Quiz Generator", icon: "checkbox-marked-outline", color: "#4ECDC4" };
      case "transcribe":
        return { label: "Transcriber", icon: "microphone-outline", color: "#45B7D1" };
      case "doubt":
        return { label: "Doubt Solver", icon: "lightbulb-outline", color: "#FFA500" };
      case "summary":
        return { label: "Summary Generator", icon: "shimmer", color: "#9333EA" };
      case "analyzer":
        return { label: "Transcript Analyzer", icon: "chart-bar", color: "#10B981" };
      default:
        return { label: "AI Process", icon: "lightning-bolt", color: "#6366F1" };
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="history" size={22} color="#1F2937" />
        <Text style={styles.title}>Recent Activity</Text>
      </View>
      <Text style={styles.subtitle}>Click any recent session to reload its workspace instantly.</Text>

      {activities.length === 0 ? (
        <View style={styles.empty}>
          <MaterialCommunityIcons name="clock-outline" size={28} color="#D1D5DB" />
          <Text style={styles.emptyText}>No recent activity logs.</Text>
        </View>
      ) : (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {activities.map((item, index) => {
            const meta = getToolMeta(item.toolId);
            return (
              <TouchableOpacity
                key={item.id || index}
                style={styles.activityCard}
                onPress={() => onSelectActivity(item)}
                activeOpacity={0.8}
              >
                <View style={[styles.iconBox, { backgroundColor: `${meta.color}15` }]}>
                  <MaterialCommunityIcons name={meta.icon} size={20} color={meta.color} />
                </View>

                <View style={styles.info}>
                  <View style={styles.topRow}>
                    <Text style={styles.toolLabel}>{meta.label}</Text>
                    <Text style={styles.timeText}>{item.time || "Just now"}</Text>
                  </View>
                  <Text style={styles.descText} numberOfLines={1}>
                    {item.fileName || item.description || "Processed content"}
                  </Text>
                </View>

                <MaterialCommunityIcons name="chevron-right" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "rgba(229, 231, 235, 0.4)",
    maxHeight: 280,
    ...Platform.select({
      web: {
        backdropFilter: "blur(20px)",
        boxShadow: "0px 10px 30px rgba(0,0,0,0.03)",
      },
    }),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1F2937",
    marginLeft: 6,
  },
  subtitle: {
    fontSize: 11.5,
    color: "#6B7280",
    lineHeight: 16,
    marginBottom: 12,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 6,
  },
  emptyText: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  scroll: {
    flex: 1,
  },
  activityCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "rgba(229, 231, 235, 0.6)",
    borderRadius: 14,
    padding: 10,
    marginBottom: 8,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  info: {
    flex: 1,
    marginRight: 8,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  toolLabel: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#1F2937",
  },
  timeText: {
    fontSize: 10,
    color: "#9CA3AF",
  },
  descText: {
    fontSize: 11.5,
    color: "#6B7280",
  },
});

export default ActivityPanel;
