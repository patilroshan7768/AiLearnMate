import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const TranscriptViewer = ({ text, onCopy, onDownload }) => {
  const [keywordSearch, setKeywordSearch] = useState("");

  const renderHighlightedText = (fullText, search) => {
    if (!search.trim()) return <Text style={styles.bodyText}>{fullText}</Text>;

    const parts = fullText.split(new RegExp(`(${search})`, "gi"));
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

  const wordCount = text ? text.split(/\s+/).length : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={styles.title}>🎙️ Smart Transcript Panel</Text>
          <Text style={styles.subtitle}>Complete Video/Audio Words Transcript</Text>
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => onCopy(text)}>
            <MaterialCommunityIcons name="content-copy" size={16} color="#6366F1" />
            <Text style={styles.actionBtnText}>Copy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => onDownload(text)}>
            <MaterialCommunityIcons name="download" size={16} color="#6366F1" />
            <Text style={styles.actionBtnText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Input */}
      <View style={styles.searchBar}>
        <MaterialCommunityIcons name="magnify" size={18} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search transcript keywords..."
          placeholderTextColor="#9CA3AF"
          value={keywordSearch}
          onChangeText={setKeywordSearch}
        />
        {keywordSearch.length > 0 && (
          <TouchableOpacity onPress={() => setKeywordSearch("")}>
            <MaterialCommunityIcons name="close" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.transcriptScroll} showsVerticalScrollIndicator={true}>
        <View style={styles.transcriptBox}>
          {renderHighlightedText(text, keywordSearch)}
        </View>
      </ScrollView>

      {/* Info Stats bar */}
      <View style={styles.infoBox}>
        <MaterialCommunityIcons name="information-outline" size={16} color="#45B7D1" />
        <Text style={styles.infoText}>Word count: {wordCount} words</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(229, 231, 235, 0.6)",
    padding: 16,
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  title: {
    fontSize: 15.5,
    fontWeight: "800",
    color: "#1F2937",
  },
  subtitle: {
    fontSize: 11.5,
    color: "#6B7280",
    marginTop: 2,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
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
  actionBtnText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#6366F1",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
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
  transcriptScroll: {
    maxHeight: 300,
    marginBottom: 12,
  },
  transcriptBox: {
    backgroundColor: "#FAFBFD",
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: "#45B7D1",
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
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#EEF8FB",
    borderRadius: 10,
    gap: 8,
  },
  infoText: {
    fontSize: 12,
    color: "#45B7D1",
    fontWeight: "600",
  },
});

export default TranscriptViewer;
