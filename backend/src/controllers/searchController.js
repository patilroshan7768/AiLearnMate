const { searchYoutubePlaylists, fetchFeaturedPlaylists } = require('../utils/youtubeSearch');
const YoutubeCache = require("../models/YoutubeCache");

// ─── Helper: Format a raw YouTube playlist item into a clean response object ──
const formatPlaylist = (item) => ({
    id: item.id.playlistId,
    playlistId: item.id.playlistId,
    title: item.snippet.title,
    thumbnail:
        item.snippet.thumbnails?.maxres?.url ||
        item.snippet.thumbnails?.high?.url ||
        item.snippet.thumbnails?.medium?.url ||
        item.snippet.thumbnails?.default?.url ||
        '',
    channel: item.snippet.channelTitle,
    channelId: item.snippet.channelId,
    description: item.snippet.description,
    publishedAt: item.snippet.publishedAt,
    youtubePlaylistUrl: `https://www.youtube.com/playlist?list=${item.id.playlistId}`
});

// ─── SEARCH: Search educational playlists by query ───────────────────────────
const searchCourses = async (req, res) => {
    try {
        const { query } = req.query;

        if (!query || query.trim().length === 0) {
            return res.status(400).json({ error: "Search query is required" });
        }

        console.log(`🔍 Searching YouTube playlists for: "${query}"`);

        const rawResults = await searchYoutubePlaylists(query);

        // If API returned nothing (quota/key issue), return empty success
        if (!rawResults || rawResults.length === 0) {
            return res.json({ success: true, count: 0, query, data: [] });
        }

        // STRICT FILTERING: Must have thumbnail and title must mention the query
        const filteredResults = rawResults.filter(item => {
            const title = item.snippet?.title || '';
            const description = item.snippet?.description || '';
            const thumbnails = item.snippet?.thumbnails;

            // A. Must have a thumbnail
            if (!thumbnails || (!thumbnails.high && !thumbnails.medium && !thumbnails.default)) {
                return false;
            }

            // B. Query keyword must appear in title or description (whole word)
            const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`\\b${escapedQuery}\\b`, 'i');
            if (!regex.test(title) && !regex.test(description)) return false;

            // C. Avoid "Java" matching pure "JavaScript" results
            const qLower = query.toLowerCase();
            const tLower = title.toLowerCase();
            if (qLower === 'java' && tLower.includes('javascript') && !/\bjava\b/i.test(title)) return false;

            // D. Avoid entertainment/music keywords
            const badWords = ['music', 'song', 'vlog', 'funny', 'comedy', 'gaming', 'reaction', 'prank'];
            if (badWords.some(w => tLower.includes(w))) return false;

            return true;
        });

        console.log(`Search: "${query}" | Raw: ${rawResults.length} | Filtered: ${filteredResults.length}`);

        // Return results (even if 0 filtered — return empty array, not 404)
        res.json({
            success: true,
            count: filteredResults.length,
            query: query,
            data: filteredResults.map(formatPlaylist)
        });

    } catch (error) {
        console.error("Search Controller Error:", error.message);
        // Return empty instead of crashing frontend with 500
        res.json({ success: true, count: 0, query: req.query.query || '', data: [] });
    }
};

// ─── FEATURED: Load trending playlists for multiple categories at once ───────
const getFeaturedCategories = async (req, res) => {
    const FEATURED_TOPICS = [
        { key: 'python', label: 'Python' },
        { key: 'web development', label: 'Web Dev' },
        { key: 'data science', label: 'Data Science' },
        { key: 'machine learning', label: 'AI / ML' },
        { key: 'java', label: 'Java' },
        { key: 'devops', label: 'DevOps' },
        { key: 'aptitude interview', label: 'Aptitude' },
        { key: 'cloud computing', label: 'Cloud' },
    ];

 try {

        const allResults = [];

        for (const topic of FEATURED_TOPICS) {

            // STEP 1 → CHECK CACHE
            const cached = await YoutubeCache.findAll({
                where: { topic: topic.key }
            });

            // STEP 2 → USE CACHE
            if (cached.length > 0) {

                console.log(`Serving ${topic.key} from cache`);

                allResults.push({
                    category: topic.label,
                    key: topic.key,
                    playlists: cached
                });

                continue;
            }

            // STEP 3 → FETCH FROM YOUTUBE
            console.log(`Fetching ${topic.key} from YouTube API`);

            const items = await fetchFeaturedPlaylists(topic.key, 4);

            const formatted = items
                .filter(it => it.snippet?.thumbnails?.high || it.snippet?.thumbnails?.medium)
                .slice(0, 4)
                .map(formatPlaylist);

            // STEP 4 → SAVE TO DATABASE
            for (const item of formatted) {

                await YoutubeCache.create({

                    topic: topic.key,
                    category: topic.label,

                    playlistId: item.playlistId,
                    title: item.title,
                    thumbnail: item.thumbnail,
                    channel: item.channel,
                    description: item.description,
                    youtubePlaylistUrl: item.youtubePlaylistUrl

                });

            }

            allResults.push({
                category: topic.label,
                key: topic.key,
                playlists: formatted
            });

        }

        res.json({
            success: true,
            data: allResults
        });

    } catch (error) {

        console.error("Featured Categories Error:", error.message);

        res.status(500).json({
            error: "Failed to load featured categories"
        });

    }

};
const getPlaylistVideos = async (req, res) => {
  try {
    const { playlistId } = req.params;

    const API_KEY = process.env.YOUTUBE_API_KEY;

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${API_KEY}`
    );

    const data = await response.json();

    const videos = data.items.map(item => ({
      videoId: item.snippet.resourceId.videoId,
      title: item.snippet.title,
    }));

    res.json({
      success: true,
      data: videos,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch playlist videos',
    });
  }
};

module.exports = {
  searchCourses,
  getFeaturedCategories,
  getPlaylistVideos
};
