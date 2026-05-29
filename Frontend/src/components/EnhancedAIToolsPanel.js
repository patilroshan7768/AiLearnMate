/**
 * EnhancedAIToolsPanel.js — Modern, Card-Based AI Tools Interface
 * Displays AI tools in a beautiful grid/card layout with animations
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  Animated,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const { width: screenWidth } = Dimensions.get("window");
const isLargeScreen = Platform.OS === "web" && screenWidth >= 1024;

const EnhancedAIToolsPanel = ({
  onSelectTool,
  activeToolTab,
  setActiveToolTab,
  tools = [
    {
      id: "notes",
      label: "AI Notes Generator",
      description: "Auto-generate comprehensive study notes",
      icon: "file-document-outline",
      color: "#FF6B6B",
      bgGradient: ["#FF6B6B", "#FF8E8E"],
    },
    {
      id: "quiz",
      label: "AI Quiz Generator",
      description: "Create interactive MCQ quizzes instantly",
      icon: "checkbox-marked-outline",
      color: "#4ECDC4",
      bgGradient: ["#4ECDC4", "#6FE0DA"],
    },
    {
      id: "transcribe",
      label: "Audio/Video to Text",
      description: "Convert lectures to text automatically",
      icon: "microphone-outline",
      color: "#45B7D1",
      bgGradient: ["#45B7D1", "#6FC7E0"],
    },
    {
      id: "doubt",
      label: "AI Doubt Solver",
      description: "Get instant answers to your questions",
      icon: "lightbulb-outline",
      color: "#FFA500",
      bgGradient: ["#FFA500", "#FFB84D"],
    },
  ],
}) => {
  const [scaleAnims] = useState(
    tools.reduce((acc, tool) => {
      acc[tool.id] = new Animated.Value(1);
      return acc;
    }, {}),
  );

  const handleToolPress = (toolId) => {
    // Scale animation
    Animated.sequence([
      Animated.timing(scaleAnims[toolId], {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnims[toolId], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setActiveToolTab(toolId);
    onSelectTool(toolId);
  };

  const containerStyle = isLargeScreen
    ? styles.gridContainerDesktop
    : styles.gridContainerMobile;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons
          name="lightbulb-multiple-outline"
          size={28}
          color="#FFA500"
        />
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>AI Learning Tools</Text>
          <Text style={styles.headerSubtitle}>
            Enhance your learning with AI
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal={!isLargeScreen}
        showsHorizontalScrollIndicator={false}
        scrollEnabled={!isLargeScreen}
        style={containerStyle}
        contentContainerStyle={styles.contentContainer}
      >
        {tools.map((tool) => {
          const isActive = activeToolTab === tool.id;
          const scaleValue = scaleAnims[tool.id];

          return (
            <Animated.View
              key={tool.id}
              style={[
                styles.toolCard,
                isActive && styles.toolCardActive,
                { transform: [{ scale: scaleValue }] },
              ]}
            >
              <TouchableOpacity
                style={[styles.touchable, isActive && styles.touchableActive]}
                onPress={() => handleToolPress(tool.id)}
                activeOpacity={0.85}
              >
                {/* Top Badge */}
                <View style={[styles.badge, { backgroundColor: tool.color }]}>
                  <MaterialCommunityIcons
                    name={tool.icon}
                    size={24}
                    color="#fff"
                  />
                </View>

                {/* Card Content */}
                <View style={styles.cardContent}>
                  <Text style={styles.toolLabel} numberOfLines={2}>
                    {tool.label}
                  </Text>
                  <Text style={styles.toolDescription} numberOfLines={2}>
                    {tool.description}
                  </Text>
                </View>

                {/* Active Indicator */}
                {isActive && (
                  <View
                    style={[
                      styles.activeIndicator,
                      { backgroundColor: tool.color },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="check"
                      size={16}
                      color="#fff"
                    />
                  </View>
                )}

                {/* Bottom Accent */}
                <View
                  style={[
                    styles.cardAccent,
                    {
                      backgroundColor: tool.color,
                      opacity: isActive ? 1 : 0.3,
                    },
                  ]}
                />
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </ScrollView>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <MaterialCommunityIcons
            name="lightning-bolt"
            size={20}
            color="#FFA500"
          />
          <Text style={styles.statText}>4 Tools Available</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="star" size={20} color="#FFD700" />
          <Text style={styles.statText}>AI Powered</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialCommunityIcons
            name="check-circle"
            size={20}
            color="#4ECDC4"
          />
          <Text style={styles.statText}>Always Ready</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f8f9fa",
    paddingBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  gridContainerMobile: {
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  gridContainerDesktop: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  contentContainer: {
    paddingHorizontal: 8,
    gap: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: isLargeScreen ? "flex-start" : "flex-start",
  },
  toolCard: {
    width: isLargeScreen ? "23%" : screenWidth * 0.85,
    marginHorizontal: 8,
    minHeight: 180,
    borderRadius: 16,
    elevation: 3,
    boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
  },
  toolCardActive: {
    elevation: 5,
    shadowOpacity: 0.15,
  },
  touchable: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    justifyContent: "space-between",
    borderWidth: 2,
    borderColor: "#f0f0f0",
    overflow: "hidden",
  },
  touchableActive: {
    borderColor: "#FFA500",
    backgroundColor: "#fffaf0",
  },
  badge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  cardContent: {
    flex: 1,
    marginBottom: 12,
  },
  toolLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  toolDescription: {
    fontSize: 12,
    color: "#666",
    lineHeight: 16,
  },
  activeIndicator: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardAccent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  statCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  statText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
    marginLeft: 8,
  },
});

export default EnhancedAIToolsPanel;
