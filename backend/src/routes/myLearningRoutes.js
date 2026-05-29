const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const {
    addToMyLearning,
    getMyLearning,
    removeFromMyLearning,
    getStudyMaterial
} = require('../controllers/myLearningController');

/**
 * @swagger
 * /api/my-learning/add:
 *   post:
 *     summary: Add a YouTube playlist to My Learning
 *     tags: [My Learning]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - playlistId
 *               - playlistTitle
 *             properties:
 *               playlistId:
 *                 type: string
 *               playlistTitle:
 *                 type: string
 *               thumbnail:
 *                 type: string
 *               channelName:
 *                 type: string
 *     responses:
 *       201:
 *         description: Course added successfully
 *       409:
 *         description: Course already exists
 */
router.post('/add', authenticate, addToMyLearning);

/**
 * @swagger
 * /api/my-learning:
 *   get:
 *     summary: Get all courses in My Learning
 *     tags: [My Learning]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of saved courses
 */
router.get('/', authenticate, getMyLearning);

/**
 * @swagger
 * /api/my-learning/{playlistId}:
 *   delete:
 *     summary: Remove a course from My Learning
 *     tags: [My Learning]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: playlistId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course removed successfully
 */
router.delete('/:playlistId', authenticate, removeFromMyLearning);

/**
 * @swagger
 * /api/my-learning/{id}/study-material:
 *   get:
 *     summary: Get AI generated study material for a saved course
 *     tags: [My Learning]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Study materials object
 *       404:
 *         description: Course not found
 */
router.get('/:id/study-material', authenticate, getStudyMaterial);

module.exports = router;
