const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  getCourseLectures,
  getLectureStudyMaterial
} = require('../controllers/courseController');
const { authenticate, authorize } = require('../middlewares/auth');

// Validation rules
const courseValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').optional().trim(),
  body('category').optional().trim()
];

/**
 * @swagger
 * /api/courses:
 *   post:
 *     summary: Create a new course (Teacher only)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', authenticate, authorize('teacher'), courseValidation, createCourse);

/**
 * @swagger
 * /api/courses:
 *   get:
 *     summary: Get all courses
 *     tags: [Courses]
 */
router.get('/', getAllCourses);

/**
 * @swagger
 * /api/courses/{id}:
 *   get:
 *     summary: Get course by ID
 *     tags: [Courses]
 */
router.get('/:id', getCourseById);

/**
 * @swagger
 * /api/courses/{id}:
 *   put:
 *     summary: Update course (Teacher only, own courses)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', authenticate, authorize('teacher'), courseValidation, updateCourse);

/**
 * @swagger
 * /api/courses/{id}:
 *   delete:
 *     summary: Delete course (Teacher only, own courses)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', authenticate, authorize('teacher'), deleteCourse);

/**
 * @swagger
 * /api/courses/{id}/lectures:
 *   get:
 *     summary: Get all lectures and pdfs for a course
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of lectures and pdfs
 */
router.get('/:id/lectures', getCourseLectures);

/**
 * @swagger
 * /api/courses/lectures/{lectureId}/study-material:
 *   get:
 *     summary: Get AI generated study material for a lecture
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: lectureId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Study materials object
 */
router.get('/lectures/:lectureId/study-material', getLectureStudyMaterial);

module.exports = router;

