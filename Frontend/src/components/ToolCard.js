import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const ToolCard = ({ icon, title, description, color, isActive, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(glowAnim, {
      toValue: isActive ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isActive]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: false,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1.02,
      friction: 4,
      useNativeDriver: false,
    }).start();
  };

  const handleHoverIn = () => {
    if (Platform.OS === "web") {
      Animated.spring(scaleAnim, {
        toValue: 1.04,
        friction: 4,
        useNativeDriver: false,
      }).start();
    }
  };

  const handleHoverOut = () => {
    if (Platform.OS === "web") {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: false,
      }).start();
    }
  };

  // Interpolated styles for glowing border/background
  const borderGlowColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(229, 231, 235, 0.4)", color],
  });

  const bgGlowColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255, 255, 255, 0.75)", `${color}08`],
  });

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        {
          transform: [{ scale: scaleAnim }],
          borderColor: borderGlowColor,
          backgroundColor: bgGlowColor,
        },
        isActive && {
          ...Platform.select({
            web: {
              boxShadow: `0px 8px 30px ${color}20`,
            },
            default: {
              shadowColor: color,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.2,
              shadowRadius: 15,
              elevation: 8,
            },
          }),
        },
      ]}
      // Web-specific hover events
      {...(Platform.OS === "web"
        ? {
            onMouseEnter: handleHoverIn,
            onMouseLeave: handleHoverOut,
          }
        : {})}
    >
      <TouchableOpacity
        style={styles.touchable}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <View style={styles.header}>
          <View style={[styles.iconWrapper, { backgroundColor: `${color}15` }]}>
            <MaterialCommunityIcons name={icon} size={28} color={color} />
          </View>
          {isActive && (
            <View style={[styles.activeIndicator, { backgroundColor: color }]}>
              <MaterialCommunityIcons name="creation" size={12} color="#fff" />
            </View>
          )}
        </View>

        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
        </View>

        {/* Bottom Accent line */}
        <View style={[styles.accentBar, { backgroundColor: color, opacity: isActive ? 1 : 0.2 }]} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: "48%",
    minWidth: 150,
    height: 150,
    borderRadius: 20,
    borderWidth: 1.5,
    marginBottom: 16,
    overflow: "hidden",
    ...Platform.select({
      web: {
        backdropFilter: "blur(20px)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      },
    }),
  },
  touchable: {
    flex: 1,
    padding: 16,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  activeIndicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  body: {
    marginTop: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  description: {
    fontSize: 11,
    color: "#6B7280",
    lineHeight: 15,
  },
  accentBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3.5,
  },
});

export default ToolCard;
