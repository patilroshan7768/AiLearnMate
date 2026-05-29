const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth');
const {
  createAssignment,
  getCourseAssignments,
  submitAssignment,
  getAssignmentSubmissions,
  gradeSubmission,
  getStudentSubmissions
} = require('../controllers/assignmentController');

// Teacher / Admin: Create assignment
router.post('/', authenticate, authorize('teacher', 'admin'), createAssignment);

// Public / Enrolled Student / Teacher: Get assignments for course
router.get('/course/:courseId', authenticate, getCourseAssignments);

// Student: Submit assignment
router.post('/:id/submit', authenticate, authorize('student'), submitAssignment);

// Student: Get own submission list and grades
router.get('/student/submissions', authenticate, authorize('student'), getStudentSubmissions);

// Teacher / Admin: Grade and evaluate a student's submission
router.put('/submissions/:id/grade', authenticate, authorize('teacher', 'admin'), gradeSubmission);

// Teacher / Admin: Get submissions for a specific assignment
router.get('/:id/submissions', authenticate, authorize('teacher', 'admin'), getAssignmentSubmissions);

module.exports = router;
