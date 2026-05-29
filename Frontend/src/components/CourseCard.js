/**
 * Reusable Course Card Component
 * Fully Mobile Optimized
 */

import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const CARD_WIDTH = (width - 36) / 2;

const CourseCard = ({ course, onPress, onBookmark }) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    onBookmark?.(course);
  };

  const getLevelColor = (level) => {
    switch (level) {
      case "Beginner":
        return "#10B981";
      case "Intermediate":
        return "#F59E0B";
      case "Advanced":
        return "#EF4444";
      default:
        return "#6366F1";
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress?.(course)}
      activeOpacity={0.92}
    >
      {/* Thumbnail */}
      <View style={styles.thumbnailContainer}>
        {imageLoading && (
          <ActivityIndicator
            size="small"
            color="#8B5CF6"
            style={styles.loadingIndicator}
          />
        )}

        <Image
          source={{ uri: course.thumbnail }}
          style={styles.thumbnail}
          onLoadEnd={() => setImageLoading(false)}
        />

        <View style={styles.overlay} />

        {/* Bookmark */}
        <TouchableOpacity
          style={styles.bookmarkButton}
          onPress={handleBookmark}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name={isBookmarked ? "bookmark" : "bookmark-outline"}
            size={18}
            color="#fff"
          />
        </TouchableOpacity>

        {/* Level */}
        <View
          style={[
            styles.levelBadge,
            { backgroundColor: getLevelColor(course.level) },
          ]}
        >
          <Text style={styles.levelText}>
            {course.level || "Course"}
          </Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text numberOfLines={1} style={styles.channel}>
          {course.channel}
        </Text>

        <Text numberOfLines={2} style={styles.title}>
          {course.title}
        </Text>

        {course.description && (
          <Text numberOfLines={2} style={styles.description}>
            {course.description}
          </Text>
        )}

        {/* Bottom */}
        <View style={styles.bottomSection}>
          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <MaterialCommunityIcons
                name="play-circle-outline"
                size={13}
                color="#A5B4FC"
              />
              <Text style={styles.statText}>
                {course.videoCount || 0}
              </Text>
            </View>

            {course.duration && (
              <View style={styles.stat}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={13}
                  color="#A5B4FC"
                />
                <Text style={styles.statText}>
                  {course.duration}
                </Text>
              </View>
            )}
          </View>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => onPress?.(course)}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons
                name="play-circle"
                size={14}
                color="#fff"
              />

              <Text
                style={styles.ctaButtonText}
                numberOfLines={1}
              >
                Start
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.youtubeButton}>
              <MaterialCommunityIcons
                name="youtube"
                size={22}
                color="#FF4D4D"
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    backgroundColor: "#0B1220",
    borderRadius: 22,
    overflow: "hidden",
    marginBottom: 18,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.12)",

    shadowColor: "#8B5CF6",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,

    elevation: 6,
  },

  thumbnailContainer: {
    width: "100%",
    height: 115,
    backgroundColor: "#111827",
    position: "relative",
  },

  thumbnail: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.15)",
  },

  loadingIndicator: {
    position: "absolute",
    top: "45%",
    left: "45%",
    zIndex: 10,
  },

  bookmarkButton: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5,
  },

  levelBadge: {
    position: "absolute",
    left: 10,
    bottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },

  levelText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
  },

  content: {
    padding: 12,
    minHeight: 190,
  },

  channel: {
    color: "#8B5CF6",
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 6,
    textTransform: "uppercase",
  },

  title: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 21,
    minHeight: 42,
  },

  description: {
    color: "#94A3B8",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
    minHeight: 34,
  },

  bottomSection: {
    marginTop: 10,
  },

  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 10,
  },

  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  statText: {
    color: "#CBD5E1",
    fontSize: 11,
    fontWeight: "600",
  },

  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  ctaButton: {
    flex: 1,
    marginRight: 10,
    backgroundColor: "#6D5FFD",
    borderRadius: 14,
    height: 42,

    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#6D5FFD",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,

    elevation: 5,
  },

  ctaButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 5,
  },

  youtubeButton: {
    width: 52,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(127,29,29,0.35)",
    borderWidth: 1,
    borderColor: "rgba(255,0,0,0.25)",

    justifyContent: "center",
    alignItems: "center",
  },
});

export default CourseCard;