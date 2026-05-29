const Course = require('../models/Course');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const { logAction } = require('../utils/logger');

const createCourse = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { title, description, category } = req.body;

    const course = await Course.create({
      title,
      description,
      category,
      teacher_id: req.user.userId
    });

    const courseWithCreator = await Course.findByPk(course.course_id, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'name', 'email']
      }]
    });

    // Log action
    await logAction(req.user.userId, 'course_created', 'success');

    res.status(201).json({
      success: true,
      message: 'Course created successfully.',
      data: { course: courseWithCreator }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create course.', 
      error: error.message 
    });
  }
};

const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.findAll({
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'name', 'email']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: courses.length,
      data: { courses }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch courses.', 
      error: error.message 
    });
  }
};

const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findByPk(id, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'name', 'email']
      }]
    });

    if (!course) {
      return res.status(404).json({ 
        success: false, 
        message: 'Course not found.' 
      });
    }

    res.status(200).json({
      success: true,
      data: { course }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch course.', 
      error: error.message 
    });
  }
};

const updateCourse = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { id } = req.params;
    const { title, description, category } = req.body;

    const course = await Course.findByPk(id);

    if (!course) {
      return res.status(404).json({ 
        success: false, 
        message: 'Course not found.' 
      });
    }

    // Check if user is the creator or admin
    if (course.teacher_id !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only update your own courses.' 
      });
    }

    await course.update({
      title: title || course.title,
      description: description !== undefined ? description : course.description,
      category: category || course.category
    });

    const updatedCourse = await Course.findByPk(course.course_id, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'name', 'email']
      }]
    });

    // Log action
    await logAction(req.user.userId, 'course_updated', 'success');

    res.status(200).json({
      success: true,
      message: 'Course updated successfully.',
      data: { course: updatedCourse }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update course.', 
      error: error.message 
    });
  }
};

const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findByPk(id);

    if (!course) {
      return res.status(404).json({ 
        success: false, 
        message: 'Course not found.' 
      });
    }

    // Check if user is the creator or admin
    if (course.teacher_id !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only delete your own courses.' 
      });
    }

    await course.destroy();

    // Log action
    await logAction(req.user.userId, 'course_deleted', 'success');

    res.status(200).json({
      success: true,
      message: 'Course deleted successfully.'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete course.', 
      error: error.message 
    });
  }
};

const getCourseLectures = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate UUID format — YouTube playlist IDs (e.g. PLu0W...) are not UUIDs
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id || '');
    if (!isUUID) {
      return res.status(200).json({ success: true, data: { lectures: [], pdfs: [] } });
    }

    const Lecture = require('../models/Lecture');
    const Pdf = require('../models/Pdf');

    const course = await Course.findByPk(id);
    if (!course) {
      return res.status(200).json({ success: true, data: { lectures: [], pdfs: [] } });
    }

    const lectures = await Lecture.findAll({ where: { course_id: id }, order: [['createdAt', 'ASC']] });
    const pdfs = await Pdf.findAll({ where: { course_id: id }, order: [['createdAt', 'ASC']] });

    res.status(200).json({
      success: true,
      data: { lectures, pdfs }
    });
  } catch (error) {
    console.error('getCourseLectures error:', error.message);
    res.status(200).json({ success: true, data: { lectures: [], pdfs: [] } });
  }
};

const getLectureStudyMaterial = async (req, res) => {
  try {
    const { lectureId } = req.params;
    const Lecture = require('../models/Lecture');
    
    const lecture = await Lecture.findByPk(lectureId);
    if (!lecture) {
      return res.status(404).json({ success: false, message: 'Lecture not found.' });
    }

    const Transcript = require('../models/Transcript');
    const Note = require('../models/Note');
    const Flashcard = require('../models/Flashcard');
    const Quiz = require('../models/Quiz');

    const transcript = await Transcript.findOne({ where: { lecture_id: lectureId } });
    const note = await Note.findOne({ where: { lecture_id: lectureId } });
    const flashcards = await Flashcard.findOne({ where: { lecture_id: lectureId } });
    const quiz = await Quiz.findOne({ where: { lecture_id: lectureId } });

    res.status(200).json({
      success: true,
      data: {
        lecture,
        transcript: transcript ? transcript.transcript : null,
        notes: note ? note.generated_notes : null,
        flashcards: flashcards ? flashcards.content : null,
        quiz: quiz ? quiz.questions : null
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch lecture study material.', error: error.message });
  }
};

module.exports = {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  getCourseLectures,
  getLectureStudyMaterial
};
