const express = require("express");
const router = express.Router();
const multer = require('multer');
const path = require('path');
const os = require('os');
const { authenticate } = require("../middlewares/auth");
const {
  summarizeText,
  summarizeYoutube,
  summarizeWebsite,
  transcribeFile,
  generateQuiz,
  generateStudyMaterial,
  askChatbot
} = require("../controllers/aiController");

// Configure Multer for temp storage
const upload = multer({
  dest: path.join(os.tmpdir(), 'ai_learnmate_uploads'),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

/**
 * @swagger
 * /api/summarize/text:
 *   post:
 *     summary: Summarize text
 *     tags: [AI]
 *     security:
 *       - bearerAuth: [] 
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *     responses:
 *       200:
 *         description: Summary
 */
router.post("/summarize/text", authenticate, summarizeText);

/**
 * @swagger
 * /api/summarize/youtube:
 *   post:
 *     summary: Summarize YouTube Video
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *             properties:
 *               url:
 *                 type: string
 *     responses:
 *       200:
 *         description: Transcript and Summary
 */
router.post("/summarize/youtube", authenticate, summarizeYoutube);

/**
 * @swagger
 * /api/summarize/website:
 *   post:
 *     summary: Summarize Website Content
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *             properties:
 *               url:
 *                 type: string
 *     responses:
 *       200:
 *         description: Summary
 */
router.post("/summarize/website", authenticate, summarizeWebsite);

/**
 * @swagger
 * /api/transcribe:
 *   post:
 *     summary: Transcribe Audio/Video File
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Transcript
 */
router.post("/transcribe", authenticate, upload.single('file'), transcribeFile);

/**
 * @swagger
 * /api/quiz:
 *   post:
 *     summary: Generate Quiz from Text
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *     responses:
 *       200:
 *         description: Quiz JSON
 */
router.post("/quiz", authenticate, generateQuiz);

/**
 * @swagger
 * /api/study-material:
 *   post:
 *     summary: Generate Complete Study Material
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *               transcript:
 *                 type: string
 *               language:
 *                 type: string
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Study Material Markdown
 */
router.post("/study-material", authenticate, upload.single('file'), generateStudyMaterial);

/**
 * @swagger
 * /api/chatbot:
 *   post:
 *     summary: Ask a question to the AI tutor based on lecture context
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - question
 *             properties:
 *               question:
 *                 type: string
 *               my_learning_id:
 *                 type: integer
 *               lecture_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: AI Tutor answer
 */
router.post("/chatbot", authenticate, askChatbot);

// ─────────────────────────────────────────────
// NEW ENDPOINTS (for Adiraj frontend)
// ─────────────────────────────────────────────
const {
  notesGenerator,
  quizGeneratorFromFile,
  quizGeneratorFromText,
  transcribeYouTube,
  transcribeAudioFile,
  doubtSolver,
  flashcardsGenerator
} = require("../controllers/aiNewController");

/**
 * @swagger
 * /api/ai/notes-generator:
 *   post:
 *     summary: Generate notes from uploaded PDF
 *     tags: [AI]
 */
router.post("/notes-generator", authenticate, upload.single('file'), notesGenerator);

/**
 * @swagger
 * /api/ai/quiz-generator/file:
 *   post:
 *     summary: Generate quiz from uploaded PDF
 *     tags: [AI]
 */
router.post("/quiz-generator/file", authenticate, upload.single('file'), quizGeneratorFromFile);

/**
 * @swagger
 * /api/ai/quiz-generator/text:
 *   post:
 *     summary: Generate quiz from text content
 *     tags: [AI]
 */
router.post("/quiz-generator/text", authenticate, quizGeneratorFromText);

/**
 * @swagger
 * /api/ai/transcribe/youtube:
 *   post:
 *     summary: Fetch YouTube video transcript
 *     tags: [AI]
 */
router.post("/transcribe/youtube", authenticate, transcribeYouTube);

/**
 * @swagger
 * /api/ai/transcribe/audio:
 *   post:
 *     summary: Transcribe uploaded audio file
 *     tags: [AI]
 */
router.post("/transcribe/audio", authenticate, upload.single('file'), transcribeAudioFile);

/**
 * @swagger
 * /api/ai/doubt-solver:
 *   post:
 *     summary: Solve student doubt with role-based AI (KG/School/College)
 *     tags: [AI]
 */
router.post("/doubt-solver", authenticate, doubtSolver);

/**
 * @swagger
 * /api/ai/flashcards-generator:
 *   post:
 *     summary: Generate flashcards from text or PDF
 *     tags: [AI]
 */
router.post("/flashcards-generator", authenticate, upload.single('file'), flashcardsGenerator);

module.exports = router;

