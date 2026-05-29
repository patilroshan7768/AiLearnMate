const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { 
  register, 
  login, 
  getProfile, 
  sendOtp, 
  resetPassword,
  updateProfile,
  adminGetUsers,
  adminApproveTeacher,
  adminUpdateUserRole,
  adminDeleteUser 
} = require('../controllers/authController');
const { authenticate, authorize } = require('../middlewares/auth');

// Validation rules
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('role').optional().isIn(['student', 'teacher', 'admin']).withMessage('Invalid role')
];

const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

/**
 * @swagger
 * /api/auth/send-otp:
 *   post:
 *     summary: Send OTP to email
 *     tags: [Auth]
 */
router.post('/send-otp', sendOtp);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 */
router.post('/register', registerValidation, register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 */
router.post('/login', loginValidation, login);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 */
router.get('/profile', authenticate, getProfile);

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Update current user profile (name, avatar, profession)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 */
router.put('/profile', authenticate, updateProfile);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password using OTP
 *     tags: [Auth]
 */
router.post('/reset-password', resetPassword);

// ==========================================
// Admin Command Centre Routes
// ==========================================
router.get('/admin/users', authenticate, authorize('admin'), adminGetUsers);
router.put('/admin/users/:id/approve', authenticate, authorize('admin'), adminApproveTeacher);
router.put('/admin/users/:id/role', authenticate, authorize('admin'), adminUpdateUserRole);
router.delete('/admin/users/:id', authenticate, authorize('admin'), adminDeleteUser);

module.exports = router;
