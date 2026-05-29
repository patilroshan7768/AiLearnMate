/**
 * CoursesScreen.js — YouTube Educational Hub
 * Auto-loads featured playlists grouped by category.
 * Search returns only educational playlists via backend YouTube API.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Linking,
  Alert,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const { width } = Dimensions.get('window');
const CARD_WIDTH =
  width > 900
    ? (width - 90) / 4
    : width > 600
    ? (width - 72) / 3
    : (width - 44) / 2;

// ─── Quick Topic Chips ───────────────────────────────────────────────────────
const TOPICS = [
  { label: '🐍 Python',       query: 'Python' },
  { label: '🌐 Web Dev',      query: 'Web Development' },
  { label: '🤖 AI / ML',      query: 'Machine Learning' },
  { label: '☕ Java',          query: 'Java' },
  { label: '📊 Data Science', query: 'Data Science' },
  { label: '⚙️ DevOps',       query: 'DevOps' },
  { label: '☁️ Cloud',        query: 'Cloud Computing' },
  { label: '🎯 Interview',    query: 'Interview Preparation' },
  { label: '🧩 DSA',          query: 'Data Structures Algorithms' },
  { label: '📱 React Native', query: 'React Native' },
  { label: '🗄️ SQL',          query: 'SQL Database' },
  { label: '🔒 Cyber Sec',    query: 'Cybersecurity' },
];

// ─── Level badge color map ───────────────────────────────────────────────────
const LEVEL_COLORS = {
  Beginner:     { bg: '#052e16', text: '#4ade80', border: '#166534' },
  Intermediate: { bg: '#1c1917', text: '#fb923c', border: '#78350f' },
  Advanced:     { bg: '#2d1b69', text: '#a78bfa', border: '#4c1d95' },
  Complete:     { bg: '#0c1a33', text: '#60a5fa', border: '#1e40af' },
  'All Levels': { bg: '#1a1a2e', text: '#94a3b8', border: '#334155' },
};

// ─── Category emoji map ──────────────────────────────────────────────────────
const getCatEmoji = (label = '') => {
  const l = label.toLowerCase();
  if (l.includes('python'))         return '🐍';
  if (l.includes('web'))            return '🌐';
  if (l.includes('data science'))   return '📊';
  if (l.includes('ai') || l.includes('ml') || l.includes('machine')) return '🤖';
  if (l.includes('java') && !l.includes('javascript')) return '☕';
  if (l.includes('devops'))         return '⚙️';
  if (l.includes('aptitude') || l.includes('interview')) return '🎯';
  if (l.includes('cloud'))          return '☁️';
  if (l.includes('javascript'))     return '✨';
  return '📚';
};

// ─── Detect level from title ─────────────────────────────────────────────────
const detectLevel = (title = '', desc = '') => {
  const t = `${title} ${desc}`.toLowerCase();
  if (t.includes('beginner') || t.includes('basic') || t.includes('intro') || t.includes('start')) return 'Beginner';
  if (t.includes('intermediate')) return 'Intermediate';
  if (t.includes('advanced') || t.includes('expert') || t.includes('masterclass')) return 'Advanced';
  if (t.includes('complete') || t.includes('full') || t.includes('crash course')) return 'Complete';
  return 'All Levels';
};

// ─── Main Component ──────────────────────────────────────────────────────────
const CoursesScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery]         = useState('');
  const [isSearchMode, setIsSearchMode]       = useState(false);
  const [searchResults, setSearchResults]     = useState([]);
  const [featuredData, setFeaturedData]       = useState([]);
  const [loading, setLoading]                 = useState(false);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [bookmarks, setBookmarks]             = useState([]);
  const [activeFilter, setActiveFilter]       = useState('All');

  const searchDebounce = useRef(null);
  const scrollRef = useRef(null);

  const FILTERS = ['All', 'Beginner', 'Intermediate', 'Advanced', 'Complete'];

  // ── Load bookmarks from storage ────────────────────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem('course_bookmarks').then(raw => {
      if (raw) setBookmarks(JSON.parse(raw));
    });
    loadFeaturedCategories();
  }, []);

  // ── Fetch featured categories from backend ─────────────────────────────────
  const loadFeaturedCategories = async () => {
    setFeaturedLoading(true);
    try {
      const res = await api.get('/search/featured');
      setFeaturedData(res.data?.data || []);
    } catch (err) {
      console.warn('Featured load failed:', err.message);
      setFeaturedData([]);
    } finally {
      setFeaturedLoading(false);
    }
  };

  // ── Search handler with debounce ───────────────────────────────────────────
  const handleSearchChange = (text) => {
    setSearchQuery(text);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    if (!text.trim()) {
      setIsSearchMode(false);
      setSearchResults([]);
      return;
    }
    searchDebounce.current = setTimeout(() => {
      performSearch(text.trim());
    }, 600);
  };

  const performSearch = async (query) => {
    setIsSearchMode(true);
    setLoading(true);
    try {
      const res = await api.get(`/search?query=${encodeURIComponent(query)}`);
      setSearchResults(res.data?.data || []);
    } catch (err) {
      console.warn('Search failed:', err.message);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickTopic = (query) => {
    setSearchQuery(query);
    performSearch(query);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsSearchMode(false);
    setSearchResults([]);
  };

  // ── Apply level filter to search results ───────────────────────────────────
  const filteredResults = activeFilter === 'All'
    ? searchResults
    : searchResults.filter(pl => detectLevel(pl.title, pl.description) === activeFilter);

  // ── Bookmark toggle ────────────────────────────────────────────────────────
  const toggleBookmark = async (playlist) => {
    const exists = bookmarks.some(b => b.playlistId === playlist.playlistId);
    let updated;
    if (exists) {
      updated = bookmarks.filter(b => b.playlistId !== playlist.playlistId);
    } else {
      updated = [...bookmarks, { playlistId: playlist.playlistId, title: playlist.title, thumbnail: playlist.thumbnail, channel: playlist.channel }];
      Alert.alert('Bookmarked! 🔖', `"${playlist.title}" saved to bookmarks.`);
    }
    setBookmarks(updated);
    await AsyncStorage.setItem('course_bookmarks', JSON.stringify(updated));
  };

  // ── Open playlist on YouTube ───────────────────────────────────────────────
  const openOnYouTube = (playlistId) => {
    const url = `https://www.youtube.com/playlist?list=${playlistId}`;
    Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open YouTube'));
  };

  // ── Start Learning → navigate to detail ───────────────────────────────────
  const startLearning = (playlist) => {
    navigation.navigate('CourseDetail', {
      course: {
        ...playlist,
        id: playlist.playlistId,
        isYouTube: true,
      }
    });
  };

  // ── Render a single playlist card ─────────────────────────────────────────
  const renderPlaylistCard = ({ item: playlist, isSmall }) => {
    const isBookmarked = bookmarks.some(b => b.playlistId === playlist.playlistId);
    const level = detectLevel(playlist.title, playlist.description);
    const levelStyle = LEVEL_COLORS[level] || LEVEL_COLORS['All Levels'];
    const thumb = playlist.thumbnail || `https://img.youtube.com/vi/${playlist.playlistId}/hqdefault.jpg`;

    return (
      <TouchableOpacity
        style={[styles.card, isSmall && styles.cardSmall]}
        onPress={() => startLearning(playlist)}
        activeOpacity={0.88}
      >
        {/* Thumbnail */}
        <View style={styles.cardThumbWrap}>
          <Image
            source={{ uri: thumb }}
            style={styles.cardThumb}
            resizeMode="cover"
            defaultSource={{ uri: 'https://via.placeholder.com/320x180/0f172a/6366f1?text=Course' }}
          />
          {/* Bookmark icon overlay */}
          <TouchableOpacity
            style={[styles.bookmarkBtn, isBookmarked && styles.bookmarkBtnActive]}
            onPress={() => toggleBookmark(playlist)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
              size={16}
              color={isBookmarked ? '#fff' : 'rgba(255,255,255,0.85)'}
            />
          </TouchableOpacity>
          {/* Level badge */}
          <View style={[styles.levelBadge, { backgroundColor: levelStyle.bg, borderColor: levelStyle.border }]}>
            <Text style={[styles.levelBadgeText, { color: levelStyle.text }]}>{level}</Text>
          </View>
        </View>

        {/* Card Details */}
        <View style={styles.cardBody}>
          <Text style={styles.channelLabel} numberOfLines={1}>{playlist.channel || 'YouTube'}</Text>
          <Text style={styles.cardTitle} numberOfLines={2}>{playlist.title}</Text>
          {!!playlist.description && (
            <Text style={styles.cardDesc} numberOfLines={2}>{playlist.description}</Text>
          )}

          {/* Actions */}
          <View style={styles.cardActions}>
            <TouchableOpacity style={styles.startBtn} onPress={() => startLearning(playlist)}>
              <Ionicons name="play-circle" size={15} color="#fff" />
              <Text style={styles.startBtnText}>Start Learning</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ytBtn} onPress={() => openOnYouTube(playlist.playlistId)}>
              <MaterialCommunityIcons name="youtube" size={18} color="#ff4444" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ── Render a featured category row ─────────────────────────────────────────
  const renderCategoryRow = ({ item: cat }) => {
    if (!cat.playlists || cat.playlists.length === 0) return null;
    return (
      <View style={styles.categorySection}>
        <View style={styles.categoryHeader}>
          <Text style={styles.categoryTitle}>{getCatEmoji(cat.category)} {cat.category}</Text>
          <TouchableOpacity onPress={() => handleQuickTopic(cat.category)}>
            <Text style={styles.seeAllText}>See all →</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {cat.playlists.map(pl => (
            <View key={pl.playlistId} style={styles.cardHorizontalWrap}>
              {renderPlaylistCard({ item: pl, isSmall: true })}
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  // ── Skeleton loader ─────────────────────────────────────────────────────────
  const SkeletonCard = () => (
    <View style={[styles.card, styles.skeletonCard]}>
      <View style={styles.skeletonThumb} />
      <View style={styles.cardBody}>
        <View style={styles.skeletonLine} />
        <View style={[styles.skeletonLine, { width: '70%', marginTop: 6 }]} />
        <View style={[styles.skeletonLine, { width: '50%', marginTop: 6 }]} />
      </View>
    </View>
  );

  const SkeletonRow = () => (
    <View style={styles.categorySection}>
      <View style={[styles.skeletonLine, { width: 140, height: 18, marginBottom: 14 }]} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
        <SkeletonCard /><SkeletonCard /><SkeletonCard />
      </ScrollView>
    </View>
  );

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#070a13" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerBadge}>🎓 YouTube Educational Hub</Text>
          <Text style={styles.headerTitle}>Explore Courses</Text>
          <Text style={styles.headerSub}>Free educational playlists from expert creators</Text>
        </View>
      </View>

      {/* ── Search Bar ── */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Python, Java, AI, DevOps..."
            placeholderTextColor="#475569"
            value={searchQuery}
            onChangeText={handleSearchChange}
            returnKeyType="search"
            onSubmitEditing={() => searchQuery.trim() && performSearch(searchQuery.trim())}
          />
          {!!searchQuery && (
            <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color="#64748b" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Quick Topic Chips ── */}
      {!isSearchMode && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScroll}
          contentContainerStyle={styles.chipsContent}
        >
          {TOPICS.map(t => (
            <TouchableOpacity key={t.query} style={styles.chip} onPress={() => handleQuickTopic(t.query)}>
              <Text style={styles.chipText}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* ── SEARCH MODE ── */}
      {isSearchMode ? (
        <View style={{ flex: 1 }}>
          {/* Level filter bar */}
          <View style={styles.filterBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterBarContent}>
              {FILTERS.map(f => (
                <TouchableOpacity
                  key={f}
                  style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
                  onPress={() => setActiveFilter(f)}
                >
                  <Text style={[styles.filterChipText, activeFilter === f && styles.filterChipTextActive]}>{f}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.backBtn} onPress={clearSearch}>
              <Ionicons name="arrow-back" size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Result count */}
          {!loading && (
            <Text style={styles.resultCount}>
              {filteredResults.length} playlists for "{searchQuery}"
            </Text>
          )}

          {loading ? (
            <View style={styles.loadingCenter}>
              <ActivityIndicator size="large" color="#6366f1" />
              <Text style={styles.loadingText}>Searching YouTube playlists...</Text>
            </View>
          ) : filteredResults.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyTitle}>No playlists found</Text>
              <Text style={styles.emptySub}>Try different keywords or browse trending topics</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={clearSearch}>
                <Text style={styles.retryBtnText}>← Browse Featured</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
  data={filteredResults}
  keyExtractor={(item, i) => item.playlistId || String(i)}
  renderItem={({ item }) => (
    <View style={styles.searchCardWrap}>
      {renderPlaylistCard({ item, isSmall: true })}
    </View>
  )}
  numColumns={2}
  columnWrapperStyle={styles.gridRow}
  contentContainerStyle={styles.gridContent}
  showsVerticalScrollIndicator={false}
/>
          )}
        </View>
      ) : (
        /* ── FEATURED MODE ── */
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.featuredContent}
        >
          {featuredLoading ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : featuredData.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📡</Text>
              <Text style={styles.emptyTitle}>Could not load courses</Text>
              <Text style={styles.emptySub}>Make sure the backend server is running on port 3000</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={loadFeaturedCategories}>
                <Text style={styles.retryBtnText}>↺ Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Section heading */}
              <View style={styles.sectionTopRow}>
                <Text style={styles.sectionMainTitle}>🔥 Featured Categories</Text>
                <Text style={styles.sectionMainSub}>Curated playlists from top educators</Text>
              </View>

              <FlatList
                data={featuredData}
                keyExtractor={(item, i) => item.key || item.category || String(i)}
                renderItem={renderCategoryRow}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050816',
  },

  // HEADER
  header: {
  paddingHorizontal: 20,
  paddingTop: Platform.OS === 'android' ? 52 : 18,
  paddingBottom: 14,
  backgroundColor: '#081120',
  borderBottomWidth: 1,
  borderBottomColor: 'rgba(255,255,255,0.05)',
},

  headerTextWrap: {
    gap: 4,
  },

  headerBadge: {
    color: '#ff5c5c',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
  },

  headerTitle: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 40,
  },

  headerSub: {
    color: '#94a3b8',
    fontSize: 15,
    marginTop: 2,
    lineHeight: 22,
  },

  // SEARCH
  searchWrap: {
    paddingHorizontal: 18,
    paddingVertical: 16,
  },

  searchCardWrap: {
  width: CARD_WIDTH,
  marginBottom: 16,
},

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0b1324',
    borderRadius: 18,
    paddingHorizontal: 16,
    height: 58,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.18)',
  },

  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
  },

  // CHIPS
  chipsScroll: {
    maxHeight: 62,
  },

  chipsContent: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 10,
    alignItems: 'center',
  },

  chip: {
    backgroundColor: '#101935',
    borderRadius: 30,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.25)',
  },

  chipText: {
    color: '#c7d2fe',
    fontSize: 14,
    fontWeight: '700',
  },

  // SECTION TOP
  sectionTopRow: {
    paddingHorizontal: 18,
    marginTop: 10,
    marginBottom: 8,
  },

  sectionMainTitle: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 36,
  },

  sectionMainSub: {
    color: '#94a3b8',
    fontSize: 15,
    marginTop: 6,
  },

  // CATEGORY
  categorySection: {
    marginTop: 18,
  },

  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginBottom: 14,
  },

  categoryTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },

  seeAllText: {
    color: '#7c83ff',
    fontSize: 15,
    fontWeight: '700',
  },

  categoryRow: {
    paddingLeft: 18,
    paddingRight: 8,
    paddingBottom: 4,
  },

  cardHorizontalWrap: {
  width: CARD_WIDTH,
  marginRight: 12,
},

  // CARD
  card: {
    backgroundColor: '#0d1528',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },

  cardSmall: {
  width: CARD_WIDTH,
  minHeight: 320,
},

  cardThumbWrap: {
    position: 'relative',
    aspectRatio: 16 / 9,
    backgroundColor: '#111827',
  },

  cardThumb: {
    width: '100%',
    height: '100%',
  },

  bookmarkBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  bookmarkBtnActive: {
    backgroundColor: '#6366f1',
  },

  levelBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
  },

  levelBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },

  // CARD BODY
  // CARD BODY
cardBody: {
  padding: 14,
  minHeight: 210,
  justifyContent: 'space-between',
},

channelLabel: {
  color: '#818cf8',
  fontSize: 11,
  fontWeight: '800',
  marginBottom: 6,
  textTransform: 'uppercase',
},

cardTitle: {
  color: '#ffffff',
  fontSize: 16,
  fontWeight: '800',
  lineHeight: 22,
  minHeight: 48,
},

cardDesc: {
  color: '#94a3b8',
  fontSize: 12,
  lineHeight: 18,
  marginTop: 6,
  minHeight: 38,
},

// ACTIONS
cardActions: {
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: 16,
},

startBtn: {
  flex: 1,
  height: 42,
  borderRadius: 14,
  backgroundColor: '#6D5FFD',

  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',

  marginRight: 10,

  shadowColor: '#6D5FFD',
  shadowOffset: {
    width: 0,
    height: 4,
  },
  shadowOpacity: 0.25,
  shadowRadius: 8,

  elevation: 5,
},

startBtnText: {
  color: '#FFFFFF',
  fontSize: 13,
  fontWeight: '700',
  marginLeft: 5,
},

ytBtn: {
  width: 46,
  height: 42,
  borderRadius: 14,

  backgroundColor: 'rgba(127,29,29,0.35)',
  borderWidth: 1,
  borderColor: 'rgba(255,0,0,0.25)',

  alignItems: 'center',
  justifyContent: 'center',
},

  // GRID
  gridRow: {
  justifyContent: 'space-between',
  paddingHorizontal: 16,
},

  gridContent: {
    paddingTop: 12,
    paddingBottom: 120,
  },

  // FILTERS
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  filterBarContent: {
    gap: 10,
    alignItems: 'center',
  },

  filterChip: {
    backgroundColor: '#101935',
    borderRadius: 30,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  filterChipActive: {
    backgroundColor: '#6366f1',
  },

  filterChipText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '700',
  },

  filterChipTextActive: {
    color: '#fff',
  },

  backBtn: {
    marginLeft: 12,
  },

  // RESULT
  resultCount: {
    color: '#94a3b8',
    fontSize: 14,
    paddingHorizontal: 18,
    marginBottom: 10,
  },

  // LOADING
  loadingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },

  loadingText: {
    marginTop: 14,
    color: '#94a3b8',
    fontSize: 15,
  },

  // EMPTY
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 30,
  },

  emptyIcon: {
    fontSize: 56,
    marginBottom: 12,
  },

  emptyTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },

  emptySub: {
    color: '#94a3b8',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 22,
  },

  retryBtn: {
    marginTop: 20,
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },

  retryBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },

  // SKELETON
  skeletonCard: {
    backgroundColor: '#111827',
  },

  skeletonThumb: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#1e293b',
  },

  skeletonLine: {
    height: 12,
    backgroundColor: '#1e293b',
    borderRadius: 20,
  },

  featuredContent: {
    paddingBottom: 120,
  },
});

export default CoursesScreen;
