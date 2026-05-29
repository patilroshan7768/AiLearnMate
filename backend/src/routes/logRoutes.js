const express = require('express');
const router = express.Router();
const { getAllLogs } = require('../controllers/logController');
const { authenticate, authorize } = require('../middlewares/auth');

// Note: Admin role check - you may want to add an 'admin' role to User model
// For now, we'll use teacher role as admin equivalent
/**
 * @swagger
 * /api/logs:
 *   get:
 *     summary: Get all logs (Admin only)
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', authenticate, authorize('teacher'), getAllLogs);

module.exports = router;






