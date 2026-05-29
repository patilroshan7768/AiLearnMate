# Strict Playlist-Only Search Guide (Backend)

This guide enforces the **SINGLE SOURCE OF TRUTH** rule. The backend will return a strictly formatted object for each playlist, preventing mismatched data.

## 1. Controller Implementation (`controllers/searchController.js`)

Replace your search controller with this logic.

```javascript
const axios = require('axios');

exports.searchYouTube = async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) return res.status(400).json({ message: "Query required" });

        const API_KEY = process.env.YOUTUBE_API_KEY; 
        if (!API_KEY) return res.status(500).json({ message: "API Key missing" });

        // STEP 1: YOUTUBE API REQUEST (STRICTLY PLAYLISTS)
        const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                part: 'snippet',
                q: query,
                type: 'playlist', // CRITICAL: PLAYLIST ONLY
                maxResults: 20,
                safeSearch: 'strict',
                key: API_KEY
            }
        });

        const items = response.data.items || [];

        // STEP 2: STRICT MAPPING (The Single Source of Truth)
        const playlists = items.map(item => {
            // Validate essential fields
            if (!item.id.playlistId || !item.snippet.title || !item.snippet.thumbnails?.medium) {
                return null; // Skip invalid
            }

            // Create Unified Object
            return {
                id: item.id.playlistId,             // For Frontend Key
                playlistId: item.id.playlistId,     // For reference
                title: item.snippet.title,
                channelName: item.snippet.channelTitle, // STRICT NAMING
                thumbnail: item.snippet.thumbnails.high ? item.snippet.thumbnails.high.url : item.snippet.thumbnails.medium.url,
                description: item.snippet.description || "",
                youtubeUrl: `https://www.youtube.com/playlist?list=${item.id.playlistId}`, // PRE-BUILT URL
                isYoutube: true
            };
        }).filter(item => item !== null); // Remove nulls

        // STEP 3: KEYWORD FILTERING (Backend Validation)
        const filtered = playlists.filter(p => {
            // Reject mismatched topics (e.g. Java vs Javascript)
            const q = query.toLowerCase();
            const t = p.title.toLowerCase();
            if (q === 'java' && t.includes('javascript') && !t.includes('java')) return false;
            return true;
        });

        res.json(filtered);

    } catch (error) {
        console.error("YouTube Search Error:", error.message);
        res.status(500).json({ message: "Search failed" });
    }
};
```

## 2. API Response Verification
The frontend will receive an array of objects EXACTLY like this:

```json
[
  {
    "id": "PLZrCGGaNogN...",
    "playlistId": "PLZrCGGaNogN...",
    "title": "Java Programming for Beginners",
    "channelName": "CodeWithHarry",
    "thumbnail": "https://i.ytimg.com/...",
    "youtubeUrl": "https://www.youtube.com/playlist?list=PLZrCGGaNogN...",
    "isYoutube": true
  }
]
```
