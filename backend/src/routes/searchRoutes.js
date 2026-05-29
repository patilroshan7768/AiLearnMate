const express = require('express');
const router = express.Router();
const {
  searchCourses,
  getFeaturedCategories,
  getPlaylistVideos
} = require('../controllers/searchController');

/**
 * GET /api/search?query=python
 * Search educational playlists on YouTube
 */
router.get('/', searchCourses);

/**
 * GET /api/search/featured
 * Get auto-loaded featured playlists grouped by category
 */
router.get('/featured', getFeaturedCategories);

router.get('/playlist/:playlistId', getPlaylistVideos);

module.exports = router;
