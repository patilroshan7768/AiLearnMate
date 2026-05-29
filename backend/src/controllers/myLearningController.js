const MyLearning = require('../models/MyLearning');

// Add a course/playlist to My Learning
const addToMyLearning = async (req, res) => {
    try {
        const { playlistId, playlistTitle, thumbnail, channelName } = req.body;
        const userId = req.user.userId;

        if (!playlistId || !playlistTitle) {
            return res.status(400).json({ error: "Playlist ID and Title are required" });
        }

        // Check if already exists
        const existingEntry = await MyLearning.findOne({
            where: { userId, playlistId }
        });

        if (existingEntry) {
            return res.status(409).json({ message: "Course already in My Learning" });
        }

        // Create new entry
        const newEntry = await MyLearning.create({
            userId,
            playlistId,
            playlistTitle,
            thumbnail,
            channelName
        });

        res.status(201).json({
            message: "Course added to My Learning successfully",
            course: newEntry
        });

    } catch (error) {
        console.error("Add to My Learning Error:", error);
        res.status(500).json({ error: "Failed to add course to My Learning" });
    }
};

// Get all courses in My Learning for the user
const getMyLearning = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Fetch Student's Saved/Enrolled Courses (both personal uploads and teacher courses)
        const myCourses = await MyLearning.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']]
        });

        const Course = require('../models/Course');
        const enrichedCourses = await Promise.all(myCourses.map(async (item) => {
            const raw = item.toJSON();
            // Try to find if playlistId is a Course ID
            const course = await Course.findOne({
                where: { course_id: raw.playlistId }
            });
            if (course) {
                raw.isTeacherCourse = true;
                raw.courseId = course.course_id;
            } else {
                raw.isTeacherCourse = false;
            }
            return raw;
        }));

        res.json(enrichedCourses);

    } catch (error) {
        console.error("Get My Learning Error:", error);
        res.status(500).json({ error: "Failed to fetch My Learning courses" });
    }
};

// Remove a course from My Learning
const removeFromMyLearning = async (req, res) => {
    try {
        const { playlistId } = req.params;
        const userId = req.user.userId;

        const deleted = await MyLearning.destroy({
            where: { userId, playlistId }
        });

        if (deleted) {
            res.json({ message: "Course removed from My Learning" });
        } else {
            res.status(404).json({ error: "Course not found in My Learning" });
        }
    } catch (error) {
        console.error("Remove My Learning Error:", error);
        res.status(500).json({ error: "Failed to remove course" });
    }
};

// Get study material for a specific My Learning course
const getStudyMaterial = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const myCourse = await MyLearning.findOne({
            where: { id, userId }
        });

        if (!myCourse) {
            return res.status(404).json({ error: "Course not found in your learning list" });
        }

        const Transcript = require('../models/Transcript');
        const Note = require('../models/Note');
        const Flashcard = require('../models/Flashcard');
        const Quiz = require('../models/Quiz');

        const transcript = await Transcript.findOne({ where: { my_learning_id: id } });
        const note = await Note.findOne({ where: { my_learning_id: id } });
        const flashcards = await Flashcard.findOne({ where: { my_learning_id: id } });
        const quiz = await Quiz.findOne({ where: { my_learning_id: id } });

        res.json({
            course: myCourse,
            transcript: transcript ? transcript.transcript : null,
            notes: note ? note.generated_notes : null,
            flashcards: flashcards ? flashcards.content : null,
            quiz: quiz ? quiz.questions : null
        });

    } catch (error) {
        console.error("Get Study Material Error:", error);
        res.status(500).json({ error: "Failed to fetch study material" });
    }
};

module.exports = {
    addToMyLearning,
    getMyLearning,
    removeFromMyLearning,
    getStudyMaterial
};
