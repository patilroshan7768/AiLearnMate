/**
 * Explore Courses Screen
 * Main interface for browsing and searching educational courses from YouTube
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  SafeAreaView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import CourseCard from "../components/CourseCard";
import {
  searchYouTubePlaylists,
  detectCourseLevel,
  categorizeCourse,
  generateRating,
} from "../services/youtubeService";

const { width } = Dimensions.get("window");

const SEARCH_TOPICS = [
  "Python",
  "Java",
  "JavaScript",
  "MERN Stack",
  "AI/ML",
  "Data Engineering",
  "DevOps",
  "Cloud Computing",
  "Aptitude",
  "Interview Prep",
  "Government Exams",
];

const FILTERS = {
  level: ["All", "Beginner", "Intermediate", "Advanced"],
  duration: ["All", "Short (< 5h)", "Medium (5-20h)", "Long (> 20h)"],
  type: ["All", "Free", "Full Course", "Tutorial Series"],
  sort: ["Trending", "Most Viewed", "Recently Added", "Highest Rated"],
};

const ExploreCourses = ({ navigation }) => {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Filter states
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSort, setSelectedSort] = useState("Trending");
  const [showFilters, setShowFilters] = useState(false);

  // Fetch courses based on search query
  const fetchCourses = useCallback(async (query, isNewSearch = true) => {
    if (!query.trim()) {
      setCourses([]);
      setFilteredCourses([]);
      return;
    }

    setLoading(true);
    try {
      const results = await searchYouTubePlaylists(query, 20);

      // Transform YouTube results to our course format
      const formattedCourses = results.map((item, index) => ({
        id: item.id || `${item.playlistId}-${index}`,
        playlistId: item.playlistId || item.id,
        title: item.title,
        channel: item.channel || item.channelTitle || "Unknown",
        thumbnail:
          item.thumbnail ||
          `https://img.youtube.com/vi/${item.videoId}/hqdefault.jpg`,
        videoCount: item.videoCount || Math.floor(Math.random() * 100) + 10,
        duration: item.duration || "Unknown",
        level: item.level || detectCourseLevel(item.title, item.description),
        category:
          item.category || categorizeCourse(item.title, item.description),
        rating: item.rating || generateRating(Math.random() * 2000000),
        isYouTube: true,
        publishedAt: item.publishedAt || new Date().toISOString(),
      }));

      if (isNewSearch) {
        setCourses(formattedCourses);
      } else {
        setCourses((prev) => [...prev, ...formattedCourses]);
      }

      setHasMore(formattedCourses.length > 0);
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...courses];

    // Filter by level
    if (selectedLevel !== "All") {
      filtered = filtered.filter((course) => course.level === selectedLevel);
    }

    // Filter by category
    if (selectedCategory !== "All") {
      filtered = filtered.filter(
        (course) => course.category === selectedCategory,
      );
    }

    // Sort
    switch (selectedSort) {
      case "Highest Rated":
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case "Most Viewed":
        filtered.sort((a, b) => b.videoCount - a.videoCount);
        break;
      case "Recently Added":
        filtered.sort(
          (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt),
        );
        break;
      case "Trending":
      default:
        // Default order from API
        break;
    }

    setFilteredCourses(filtered);
  }, [courses, selectedLevel, selectedCategory, selectedSort]);

  // Handle search
  const handleSearch = (query) => {
    setSearchQuery(query);
    setPage(1);
    if (query.trim()) {
      fetchCourses(query, true);
    }
  };

  // Handle quick topic selection
  const handleTopicSelect = (topic) => {
    setSearchQuery(topic);
    setPage(1);
    fetchCourses(topic, true);
  };

  // Handle course press
  const handleCoursePress = (course) => {
    navigation.navigate("CourseDetail", { course });
  };

  // Handle bookmark
  const handleBookmark = (course) => {
    console.log("Bookmarked:", course.title);
    // TODO: Save to bookmarks
  };

  // Get unique categories from filtered courses
  const categories = ["All", ...new Set(courses.map((c) => c.category))];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore Courses</Text>
        <Text style={styles.headerSubtitle}>
          Learn from YouTube's best educational content
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search courses..."
            placeholderTextColor="#6B7280"
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery && (
            <TouchableOpacity onPress={() => handleSearch("")}>
              <MaterialCommunityIcons name="close" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Topics */}
        {!searchQuery && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.quickTopics}
            contentContainerStyle={styles.quickTopicsContent}
          >
            {SEARCH_TOPICS.map((topic) => (
              <TouchableOpacity
                key={topic}
                style={styles.topicTag}
                onPress={() => handleTopicSelect(topic)}
              >
                <Text style={styles.topicText}>{topic}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Filters Bar */}
      {courses.length > 0 && (
        <View style={styles.filtersBar}>
          {/* Level Filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
            contentContainerStyle={styles.filterScrollContent}
          >
            {FILTERS.level.map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.filterChip,
                  selectedLevel === level && styles.filterChipActive,
                ]}
                onPress={() => setSelectedLevel(level)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedLevel === level && styles.filterChipTextActive,
                  ]}
                >
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* More Filters Button */}
          <TouchableOpacity
            style={styles.moreFiltersBtn}
            onPress={() => setShowFilters(!showFilters)}
          >
            <MaterialCommunityIcons name="tune" size={20} color="#3B82F6" />
          </TouchableOpacity>
        </View>
      )}

      {/* Extended Filters (Collapsible) */}
      {showFilters && courses.length > 0 && (
        <View style={styles.extendedFilters}>
          {/* Category Filter */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterGroupTitle}>Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterChipsContainer}
            >
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.filterChip,
                    selectedCategory === category && styles.filterChipActive,
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedCategory === category &&
                        styles.filterChipTextActive,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Sort Filter */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterGroupTitle}>Sort By</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterChipsContainer}
            >
              {FILTERS.sort.map((sort) => (
                <TouchableOpacity
                  key={sort}
                  style={[
                    styles.filterChip,
                    selectedSort === sort && styles.filterChipActive,
                  ]}
                  onPress={() => setSelectedSort(sort)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedSort === sort && styles.filterChipTextActive,
                    ]}
                  >
                    {sort}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Results Count */}
      {courses.length > 0 && (
        <Text style={styles.resultsCount}>
          Showing {filteredCourses.length} of {courses.length} courses
        </Text>
      )}

      {/* Courses Grid */}
      <FlatList
        data={filteredCourses}
        renderItem={({ item }) => (
          <CourseCard
            course={item}
            onPress={handleCoursePress}
            onBookmark={handleBookmark}
          />
        )}
        keyExtractor={(item) => item.id}
        numColumns={width > 768 ? 3 : width > 480 ? 2 : 1}
        columnWrapperStyle={width > 480 && styles.columnWrapper}
        contentContainerStyle={styles.coursesGrid}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.loadingText}>Finding great courses...</Text>
            </View>
          ) : searchQuery ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="magnify"
                size={48}
                color="#6B7280"
              />
              <Text style={styles.emptyText}>No educational courses found</Text>
              <Text style={styles.emptySubtext}>
                Try searching for different topics
              </Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="school" size={48} color="#6B7280" />
              <Text style={styles.emptyText}>Start exploring courses</Text>
              <Text style={styles.emptySubtext}>
                Search for a topic or select from suggestions above
              </Text>
            </View>
          )
        }
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (hasMore && searchQuery && !loading) {
            setPage((prev) => prev + 1);
            fetchCourses(searchQuery, false);
          }
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111827",
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
  },
  headerTitle: {
    color: "#F3F4F6",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 4,
  },
  headerSubtitle: {
    color: "#9CA3AF",
    fontSize: 13,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
    gap: 12,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1F2937",
    borderRadius: 10,
    paddingHorizontal: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#374151",
  },
  searchInput: {
    flex: 1,
    color: "#F3F4F6",
    fontSize: 14,
    paddingVertical: 12,
  },
  quickTopics: {
    maxHeight: 40,
  },
  quickTopicsContent: {
    gap: 8,
  },
  topicTag: {
    backgroundColor: "rgba(59, 130, 246, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#3B82F6",
  },
  topicText: {
    color: "#3B82F6",
    fontSize: 12,
    fontWeight: "600",
  },
  filtersBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
    gap: 8,
  },
  filterScroll: {
    flex: 1,
  },
  filterScrollContent: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#374151",
    backgroundColor: "#1F2937",
  },
  filterChipActive: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },
  filterChipText: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "600",
  },
  filterChipTextActive: {
    color: "#fff",
  },
  moreFiltersBtn: {
    padding: 8,
  },
  extendedFilters: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
    gap: 12,
  },
  filterGroup: {
    gap: 8,
  },
  filterGroupTitle: {
    color: "#D1D5DB",
    fontSize: 12,
    fontWeight: "700",
  },
  filterChipsContainer: {
    gap: 8,
  },
  resultsCount: {
    color: "#9CA3AF",
    fontSize: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  coursesGrid: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  columnWrapper: {
    justifyContent: "space-between",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 300,
    gap: 12,
  },
  loadingText: {
    color: "#9CA3AF",
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 300,
    gap: 12,
  },
  emptyText: {
    color: "#D1D5DB",
    fontSize: 16,
    fontWeight: "600",
  },
  emptySubtext: {
    color: "#9CA3AF",
    fontSize: 13,
    textAlign: "center",
  },
});

export default ExploreCourses;
