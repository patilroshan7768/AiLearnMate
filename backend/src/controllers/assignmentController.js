const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const User = require('../models/User');
const Course = require('../models/Course');

// 1. Create assignment (Teacher / Admin only)
const createAssignment = async (req, res) => {
  try {
    const { course_id, title, description, deadline, marks, file_url } = req.body;
    
    // Check if course exists
    const course = await Course.findByPk(course_id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Verify creator or admin
    if (course.teacher_id !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to create assignments for this course' });
    }

    const assignment = await Assignment.create({
      course_id,
      title,
      description,
      deadline,
      marks: marks || 100,
      file_url
    });

    res.status(201).json({ success: true, message: 'Assignment created successfully', data: { assignment } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create assignment', error: error.message });
  }
};

// 2. Get all assignments for a course
const getCourseAssignments = async (req, res) => {
  try {
    const { courseId } = req.params;
    const assignments = await Assignment.findAll({
      where: { course_id: courseId },
      order: [['deadline', 'ASC']]
    });
    res.status(200).json({ success: true, data: { assignments } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch assignments', error: error.message });
  }
};

// 3. Submit assignment (Student only)
const submitAssignment = async (req, res) => {
  try {
    const { id } = req.params; // assignment_id
    const { file_url } = req.body;

    if (!file_url) {
      return res.status(400).json({ success: false, message: 'Assignment file URL/path is required' });
    }

    const assignment = await Assignment.findByPk(id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    // Restriction: Block if past deadline
    if (new Date() > new Date(assignment.deadline)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Submission blocked. The assignment deadline has already passed.' 
      });
    }

    // Check if student already submitted - allow resubmission (overwriting file or updating submission)
    let submission = await Submission.findOne({
      where: { assignment_id: id, student_id: req.user.userId }
    });

    if (submission) {
      submission.file_url = file_url;
      submission.submitted_at = new Date();
      await submission.save();
      return res.status(200).json({ success: true, message: 'Assignment resubmitted successfully', data: { submission } });
    }

    submission = await Submission.create({
      assignment_id: id,
      student_id: req.user.userId,
      file_url,
      submitted_at: new Date()
    });

    res.status(201).json({ success: true, message: 'Assignment submitted successfully', data: { submission } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to submit assignment', error: error.message });
  }
};

// 4. Get all submissions for an assignment (Teacher / Admin only)
const getAssignmentSubmissions = async (req, res) => {
  try {
    const { id } = req.params; // assignment_id
    const submissions = await Submission.findAll({
      where: { assignment_id: id },
      include: [{
        model: User,
        as: 'student',
        attributes: ['id', 'name', 'email']
      }],
      order: [['submitted_at', 'DESC']]
    });
    res.status(200).json({ success: true, data: { submissions } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch submissions', error: error.message });
  }
};

// 5. Grade a student's submission (Teacher / Admin only)
const gradeSubmission = async (req, res) => {
  try {
    const { id } = req.params; // submission_id
    const { marks_obtained, feedback } = req.body;

    const submission = await Submission.findByPk(id, {
      include: [{
        model: Assignment,
        as: 'assignment'
      }]
    });

    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    // Validate marks limits
    if (marks_obtained !== undefined) {
      const maxMarks = submission.assignment.marks;
      if (marks_obtained < 0 || marks_obtained > maxMarks) {
        return res.status(400).json({ 
          success: false, 
          message: `Marks obtained must be between 0 and the maximum of ${maxMarks}.` 
        });
      }
      submission.marks_obtained = marks_obtained;
    }

    if (feedback !== undefined) {
      submission.feedback = feedback;
    }

    await submission.save();

    res.status(200).json({ success: true, message: 'Submission graded successfully', data: { submission } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to grade submission', error: error.message });
  }
};

// 6. Get student's own submissions/grades
const getStudentSubmissions = async (req, res) => {
  try {
    let submissions = [];
    try {
      submissions = await Submission.findAll({
        where: { student_id: req.user.userId },
        include: [{
          model: Assignment,
          as: 'assignment',
          attributes: ['id', 'title', 'deadline', 'marks', 'course_id'],
          required: false
        }],
        order: [['submitted_at', 'DESC']]
      });
    } catch (innerErr) {
      // Fallback: fetch without join if association fails
      console.warn('Submission include failed, falling back to plain query:', innerErr.message);
      submissions = await Submission.findAll({
        where: { student_id: req.user.userId },
        order: [['submitted_at', 'DESC']]
      });
    }
    res.status(200).json({ success: true, data: { submissions } });
  } catch (error) {
    console.error('getStudentSubmissions error:', error.message);
    res.status(200).json({ success: true, data: { submissions: [] } });
  }
};

module.exports = {
  createAssignment,
  getCourseAssignments,
  submitAssignment,
  getAssignmentSubmissions,
  gradeSubmission,
  getStudentSubmissions
};
