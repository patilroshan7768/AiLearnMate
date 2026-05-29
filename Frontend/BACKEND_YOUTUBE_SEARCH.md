# Backend YouTube Search Implementation

The user has requested to use a BACKEND service for YouTube search to ensure reliability and avoid frontend "unusual traffic" errors.

Since we cannot run this backend code directly in this environment, please COPY the following code into your **Backend Project**.

## 1. Install Dependencies
Run this in your backend folder:
```bash
npm install youtube-sr
```

## 2. Create Search Controller (`controllers/searchController.js`)

```javascript
const YouTube = require("youtube-sr").default;

exports.searchYouTube = async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) return res.status(400).json({ message: "Query required" });

        // Search for Playlists (limit 10 for speed)
        const playlists = await YouTube.search(query, { 
            limit: 10, 
            type: "playlist",
            safeSearch: true 
        });

        // Map to our frontend format
        const results = playlists.map(item => ({
            id: item.id,
            playlistId: item.id,
            title: item.title,
            channel: item.channel ? item.channel.name : "Unknown",
            thumbnail: item.thumbnail ? item.thumbnail.url : null,
            isYoutube: true,
            videoId: null // It's a playlist
        }));
        
        // STRICT FILTERING ON BACKEND
        const filtered = results.filter(item => 
            item.title.toLowerCase().includes(query.toLowerCase())
        );

        res.json(filtered.length > 0 ? filtered : []);
    } catch (error) {
        console.error("YouTube Search Error:", error);
        res.status(500).json({ message: "Search failed" });
    }
};
```

## 3. Add Route (`routes/courseRoutes.js`)

Add this BEFORE the `/:id` routes to avoid conflict.

```javascript
const searchController = require('../controllers/searchController');

// GET /api/courses/search/youtube?q=java
router.get('/search/youtube', searchController.searchYouTube);
```

## 4. Frontend Integration (Optional Guide)

If you implement the above backend, you can update `CoursesScreen.js` to fetch from your own server instead of Invidious:

```javascript
// REPLACE:
// const response = await fetchWithTimeout(`https://inv.nadeko.net/api/v1/search...`);

// WITH:
// const response = await api.get(`/courses/search/youtube?q=${query}`);
// const data = response.data;
```
