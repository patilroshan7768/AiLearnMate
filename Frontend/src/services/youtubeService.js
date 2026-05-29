/**
 * YouTube API Service
 * Handles all YouTube API calls for fetching educational playlists and courses
 */

import axios from "axios";
import api from "./api";

// Educational keywords to filter content
const EDUCATIONAL_KEYWORDS = [
  "course",
  "tutorial",
  "learn",
  "programming",
  "python",
  "java",
  "javascript",
  "react",
  "node",
  "database",
  "sql",
  "html",
  "css",
  "web development",
  "data science",
  "machine learning",
  "ai",
  "artificial intelligence",
  "devops",
  "cloud",
  "aws",
  "azure",
  "docker",
  "kubernetes",
  "mern",
  "stack",
  "full stack",
  "backend",
  "frontend",
  "interview",
  "preparation",
  "aptitude",
  "dsa",
  "algorithms",
  "competitive programming",
  "coding",
  "development",
  "git",
  "github",
  "version control",
  "linux",
  "unix",
  "networking",
  "security",
  "cybersecurity",
  "data engineering",
  "big data",
  "spark",
  "hadoop",
  "government exam",
  "upsc",
  "ssc",
];

// Non-educational keywords to exclude
const EXCLUDE_KEYWORDS = [
  "music",
  "song",
  "entertainment",
  "movie",
  "shorts",
  "clip",
  "vlog",
  "gaming",
  "stream",
  "live",
  "trending",
  "comedy",
  "meme",
  "funny",
  "viral",
  "random",
];

const PLAYLIST_TYPE = "playlist";

/**
 * Check if a title/description contains educational content
 */
const isEducational = (title = "", description = "") => {
  const text = `${title} ${description}`.toLowerCase();

  // Check if it has educational keywords
  const hasEducationalKeyword = EDUCATIONAL_KEYWORDS.some((keyword) =>
    text.includes(keyword.toLowerCase()),
  );

  // Check if it has exclusion keywords
  const hasExclusionKeyword = EXCLUDE_KEYWORDS.some((keyword) =>
    text.includes(keyword.toLowerCase()),
  );

  return hasEducationalKeyword && !hasExclusionKeyword;
};

/**
 * Search for educational playlists on YouTube
 * @param {string} query - Search query
 * @param {number} maxResults - Maximum number of results
 * @returns {Promise<Array>} Array of playlist objects
 */
/**
 * Search for educational playlists via our backend (which calls YouTube API)
 * @param {string} query - Search query
 * @param {number} maxResults - Maximum number of results (handled server-side)
 * @returns {Promise<Array>} Array of playlist objects
 */
export const searchYouTubePlaylists = async (query, maxResults = 20) => {
  try {
    const response = await api.get(
      `/search?query=${encodeURIComponent(query)}`,
    );
    const data = response.data?.data || [];
    return data.slice(0, maxResults);
  } catch (error) {
    console.error(
      "Error searching YouTube playlists via backend:",
      error.message,
    );
    return [];
  }
};

/**
 * Fetch featured categories from backend
 * @returns {Promise<Array>} Array of { category, playlists[] } objects
 */
export const fetchFeaturedCategories = async () => {
  try {
    const response = await api.get("/search/featured");
    return response.data?.data || [];
  } catch (error) {
    console.error("Error fetching featured categories:", error.message);
    return [];
  }
};

/**
 * Get detailed information about a playlist
 * @param {string} playlistId - YouTube Playlist ID
 * @returns {Promise<Object>} Detailed playlist object with video count and duration
 */
export const getPlaylistDetails = async (playlistId) => {
  try {
    const apiKey = process.env.REACT_APP_YOUTUBE_API_KEY;
    if (!apiKey) {
      console.error("YouTube API key not configured");
      return null;
    }

    // Get playlist info
    const playlistResponse = await axios.get(
      "https://www.googleapis.com/youtube/v3/playlists",
      {
        params: {
          part: "snippet,contentDetails",
          id: playlistId,
          key: apiKey,
        },
      },
    );

    const playlist = playlistResponse.data.items[0];
    if (!playlist) return null;

    // Get playlist items
    const itemsResponse = await axios.get(
      "https://www.googleapis.com/youtube/v3/playlistItems",
      {
        params: {
          part: "snippet",
          playlistId,
          maxResults: 50,
          key: apiKey,
        },
      },
    );

    const items = itemsResponse.data.items || [];
    const videoCount = items.length;

    return {
      id: playlistId,
      title: playlist.snippet.title,
      description: playlist.snippet.description,
      thumbnail:
        playlist.snippet.thumbnails.high?.url ||
        playlist.snippet.thumbnails.medium?.url,
      channelTitle: playlist.snippet.channelTitle,
      channelId: playlist.snippet.channelId,
      videoCount,
      publishedAt: playlist.snippet.publishedAt,
      videos: items.map((item, index) => ({
        title: item.snippet.title,
        videoId: item.snippet.resourceId.videoId,
        position: index + 1,
        thumbnail: item.snippet.thumbnails.default?.url,
      })),
    };
  } catch (error) {
    console.error("Error fetching playlist details:", error);
    return null;
  }
};

/**
 * Get video statistics (duration, views, etc.)
 * @param {string} videoId - YouTube Video ID
 * @returns {Promise<Object>} Video statistics
 */
export const getVideoStats = async (videoId) => {
  try {
    const apiKey = process.env.REACT_APP_YOUTUBE_API_KEY;
    if (!apiKey) return null;

    const response = await axios.get(
      "https://www.googleapis.com/youtube/v3/videos",
      {
        params: {
          part: "contentDetails,statistics",
          id: videoId,
          key: apiKey,
        },
      },
    );

    const video = response.data.items[0];
    if (!video) return null;

    return {
      duration: video.contentDetails.duration,
      viewCount: video.statistics.viewCount,
      likeCount: video.statistics.likeCount,
      commentCount: video.statistics.commentCount,
    };
  } catch (error) {
    console.error("Error fetching video stats:", error);
    return null;
  }
};

/**
 * Convert ISO 8601 duration to readable format
 * @param {string} duration - ISO 8601 duration string
 * @returns {string} Readable duration
 */
export const parseDuration = (duration) => {
  if (!duration) return "0m";

  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return "0m";

  const hours = parseInt(match[1]) || 0;
  const minutes = parseInt(match[2]) || 0;
  const seconds = parseInt(match[3]) || 0;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

/**
 * Calculate total playlist duration
 * @param {Array} videos - Array of video objects with duration
 * @returns {string} Total duration in readable format
 */
export const calculatePlaylistDuration = async (videos) => {
  try {
    let totalSeconds = 0;

    for (const video of videos) {
      const stats = await getVideoStats(video.videoId);
      if (stats) {
        const duration = stats.duration;
        const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
        if (match) {
          const hours = parseInt(match[1]) || 0;
          const minutes = parseInt(match[2]) || 0;
          const seconds = parseInt(match[3]) || 0;
          totalSeconds += hours * 3600 + minutes * 60 + seconds;
        }
      }
    }

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  } catch (error) {
    console.error("Error calculating playlist duration:", error);
    return "N/A";
  }
};

/**
 * Detect course level based on title and description
 * @param {string} title - Course title
 * @param {string} description - Course description
 * @returns {string} Level (Beginner, Intermediate, Advanced)
 */
export const detectCourseLevel = (title = "", description = "") => {
  const text = `${title} ${description}`.toLowerCase();

  if (
    text.includes("beginner") ||
    text.includes("basic") ||
    text.includes("introduction") ||
    text.includes("intro")
  ) {
    return "Beginner";
  }
  if (
    text.includes("intermediate") ||
    text.includes("advance") ||
    text.includes("expert")
  ) {
    return "Advanced";
  }
  if (
    text.includes("complete") ||
    text.includes("full") ||
    text.includes("master")
  ) {
    return "Complete";
  }

  return "All Levels";
};

/**
 * Categorize course based on keywords
 * @param {string} title - Course title
 * @param {string} description - Course description
 * @returns {string} Category
 */
export const categorizeCourse = (title = "", description = "") => {
  const text = `${title} ${description}`.toLowerCase();

  const categories = {
    "Web Development": [
      "web",
      "html",
      "css",
      "javascript",
      "react",
      "angular",
      "vue",
      "nodejs",
      "node",
    ],
    "Mobile Development": [
      "mobile",
      "android",
      "ios",
      "react native",
      "flutter",
      "swift",
      "kotlin",
    ],
    Python: ["python", "django", "flask", "fastapi"],
    Java: ["java", "spring", "jpa"],
    "Data Science": [
      "data science",
      "machine learning",
      "ai",
      "artificial intelligence",
      "deep learning",
      "nlp",
      "opencv",
    ],
    DevOps: ["devops", "docker", "kubernetes", "ci/cd", "jenkins", "gitlab"],
    Cloud: ["aws", "azure", "gcp", "cloud computing", "cloud"],
    Database: ["database", "sql", "mongodb", "postgresql", "mysql", "nosql"],
    "Competitive Programming": [
      "competitive programming",
      "dsa",
      "algorithms",
      "coding",
      "interview",
    ],
    "Government Exams": ["government", "exam", "upsc", "ssc", "aptitude"],
  };

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      return category;
    }
  }

  return "Programming";
};

/**
 * Generate mock rating based on views
 * @param {number} viewCount - View count
 * @returns {number} Rating 0-5
 */
export const generateRating = (viewCount = 0) => {
  // Higher views = higher rating (3.5 to 5.0)
  if (viewCount > 1000000) return 4.9;
  if (viewCount > 500000) return 4.7;
  if (viewCount > 100000) return 4.5;
  if (viewCount > 50000) return 4.3;
  if (viewCount > 10000) return 4.1;
  return 3.8;
};

/**
 * Featured educational playlists (curated list)
 * This can be updated manually or via admin panel
 */
export const getFeaturedPlaylists = () => {
  return [
    {
      id: "PLu0W_9lSL7qEdGj1qCWSpLXpzmMl6k5KI",
      title: "Python for Beginners",
      channel: "Telusko",
      thumbnail: "https://img.youtube.com/vi/BBWyXo-3JGQ/hqdefault.jpg",
      level: "Beginner",
      category: "Python",
      rating: 4.8,
      videoCount: 92,
      isYouTube: true,
      isFeatured: true,
    },
    // Add more featured playlists as needed
  ];
};
export const getPlaylistVideos = async (playlistId) => {
  try {

    const response = await api.get(
      `/search/playlist/${playlistId}`
    );

    return response.data?.data || [];

  } catch (error) {

    console.error(
      "Error fetching playlist videos:",
      error.message
    );

    return [];
  }
};

export default {
  searchYouTubePlaylists,
  getPlaylistVideos,
  getPlaylistDetails,
  getVideoStats,
  parseDuration,
  calculatePlaylistDuration,
  detectCourseLevel,
  categorizeCourse,
  generateRating,
  getFeaturedPlaylists,
};
