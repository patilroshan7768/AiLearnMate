const express = require('express');
const router = express.Router();
const { getRecommendations } = require('../controllers/recommendationController');
const { authenticate } = require('../middlewares/auth');

/**
 * @swagger
 * /api/recommendations/{userId}:
 *   get:
 *     summary: Get course recommendations for a user
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:userId', authenticate, getRecommendations);

module.exports = router;






