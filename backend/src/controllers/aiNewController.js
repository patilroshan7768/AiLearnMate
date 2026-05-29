/**
 * AI New Controller — 6 missing endpoints for Adiraj frontend
 * Uses Gemini (FREE) for AI processing
 * Uses youtube-transcript for YouTube transcripts (FREE, no API key)
 */

const { extractTextFromPDF } = require("../utils/pdf");
const { transcribeAudio } = require("../utils/whisper");
const { generateNotes, generateQuiz, solveDoubt, generateFlashcards } = require("../utils/gemini");
const { getYoutubeTranscript, getVideoDetails } = require("../utils/youtube");
const { YoutubeTranscript } = require("youtube-transcript");
const fs = require("fs");
const path = require("path");
const axios = require("axios");


// ─────────────────────────────────────────────
// 1. POST /api/ai/notes-generator
//    Upload PDF → Extract text → Generate notes (Gemini FREE)
// ─────────────────────────────────────────────
const notesGenerator = async (req, res) => {
  try {
    let text = "";
    let originalName = "Text Content";
    let source = "text";

    if (req.file) {
      console.log(`[notes-generator] Processing file: ${req.file.originalname}`);
      text = await extractTextFromPDF(req.file.path);
      originalName = req.file.originalname;
      source = "pdf";
      // Cleanup temp file
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    } else if (req.body.text) {
      console.log(`[notes-generator] Processing raw text of length ${req.body.text.length}`);
      text = req.body.text;
      if (req.body.title) originalName = req.body.title;
    } else {
      return res.status(400).json({
        success: false,
        message: "Either PDF file or text is required"
      });
    }

    // Clean and limit huge text
    const cleanedText = text.replace(/\s+/g, " ").trim();
    const shortTranscript = cleanedText.slice(0, 12000);

    if (!shortTranscript || shortTranscript.length < 20) {
      return res.status(400).json({
        success: false,
        message: "Transcript too short",
      });
    }

    // Generate notes using Gemini (FREE)
    const level = req.body.level || "school";
    const notes = await generateNotes(shortTranscript, level);

    res.json({
      success: true,
      data: {
        notes,
        pdfInfo: {
          title: originalName,
          pages: "N/A",
          wordCount: shortTranscript.split(/\s+/).length,
        },
        source,
      },
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    console.error("[notes-generator] Error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message || "AI processing failed"
    });
  }
};

// ─────────────────────────────────────────────
// 2. POST /api/ai/quiz-generator/file
//    Upload PDF → Extract text → Generate quiz (Gemini FREE)
// ─────────────────────────────────────────────
const quizGeneratorFromFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "PDF file is required"
      });
    }

    console.log(`[quiz-generator/file] Processing: ${req.file.originalname}`);

    const text = await extractTextFromPDF(req.file.path);
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    // Clean and limit huge text
    const cleanedText = text.replace(/\s+/g, " ").trim();
    const shortTranscript = cleanedText.slice(0, 12000);

    if (!shortTranscript || shortTranscript.length < 20) {
      return res.status(400).json({
        success: false,
        message: "Transcript too short",
      });
    }

    const numQuestions = parseInt(req.body.num_questions) || 20;
    const difficulty = req.body.difficulty || "medium";
    const quiz = await generateQuiz(shortTranscript, numQuestions, difficulty);

    res.json({
      success: true,
      data: { quiz, source: "pdf" }
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    console.error("[quiz-generator/file] Error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message || "AI processing failed"
    });
  }
};

// ─────────────────────────────────────────────
// 3. POST /api/ai/quiz-generator/text
//    Text → Generate quiz (Gemini FREE)
// ─────────────────────────────────────────────
const quizGeneratorFromText = async (req, res) => {
  try {
    const { text, num_questions, difficulty } = req.body;
    if (!text) {
      return res.status(400).json({
        success: false,
        message: "Text content is required"
      });
    }

    console.log(`[quiz-generator/text] Processing raw text of length ${text.length}`);

    // Clean and limit huge text
    const cleanedText = text.replace(/\s+/g, " ").trim();
    const shortTranscript = cleanedText.slice(0, 12000);

    if (!shortTranscript || shortTranscript.length < 20) {
      return res.status(400).json({
        success: false,
        message: "Transcript too short",
      });
    }

    const quiz = await generateQuiz(
      shortTranscript,
      num_questions || 20,
      difficulty || "medium"
    );

    // Validate array structure
    if (!quiz || !Array.isArray(quiz) || quiz.length === 0 || 
        (quiz.length === 1 && quiz[0].question && quiz[0].question.includes("Could not generate quiz"))) {
      console.error("[quiz-generator/text] Malformed JSON or fallback failure array detected");
      return res.status(400).json({
        success: false,
        message: "Quiz generation failed"
      });
    }

    res.json({
      success: true,
      data: { quiz, source: "text" }
    });
  } catch (error) {
    console.error("[quiz-generator/text] Error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message || "AI processing failed"
    });
  }
};

// ─────────────────────────────────────────────
// 4. POST /api/ai/transcribe/youtube
//    Fetch YouTube transcript using Supadata API with robust local multi-tier fallback
// ─────────────────────────────────────────────
const transcribeYouTube = async (req, res) => {
  try {
    let url = (req.body.youtubeUrl || req.body.url || "").trim();
    url = url.replace(/^[-+*\s]+/, "");

    if (!url) {
      return res.status(400).json({
        success: false,
        error: "YouTube URL is required",
        message: "YouTube URL is required"
      });
    }

    console.log(`[transcribe/youtube] Fetching transcript via Supadata for: ${url}`);

    const apiKey = process.env.SUPADATA_API_KEY;
    if (!apiKey || apiKey === "[SUPADATA_API_KEY]") {
      console.warn("[transcribe/youtube] Warning: SUPADATA_API_KEY is not configured or is default placeholder.");
    }

    let transcript = "";
    let segments = [];

    // Attempt 1: Fetch via Supadata API
    try {
      const response = await axios({
        method: "get",
        url: `https://api.supadata.ai/v1/youtube/transcript?url=${encodeURIComponent(url)}`,
        headers: {
          "x-api-key": apiKey || "",
          "Content-Type": "application/json",
        },
        timeout: 20000, // 20s timeout
      });

      const data = response.data;
      if (data) {
        // 1. Check content first (Supadata v1 youtube/transcript returns an array of objects in content)
        if (Array.isArray(data.content)) {
          segments = data.content.map((item) => ({
            text: item.text || "",
            start: typeof item.start === "number" ? item.start : (item.offset || 0) / 1000,
            duration: typeof item.duration === "number" ? item.duration : (item.duration || 0) / 1000,
          }));
          transcript = data.content.map(item => item.text || "").join(" ").replace(/\s+/g, " ").trim();
        } else if (typeof data.content === "string") {
          transcript = data.content;
        }

        // 2. Check transcript fallback
        if (!transcript) {
          if (Array.isArray(data.transcript)) {
            segments = data.transcript.map((item) => ({
              text: item.text || "",
              start: typeof item.start === "number" ? item.start : (item.offset || 0) / 1000,
              duration: typeof item.duration === "number" ? item.duration : (item.duration || 0) / 1000,
            }));
            transcript = data.transcript.map(item => item.text || "").join(" ").replace(/\s+/g, " ").trim();
          } else if (typeof data.transcript === "string") {
            transcript = data.transcript;
          }
        }
      }
    } catch (supadataError) {
      console.warn("[transcribe/youtube] Supadata API failed, attempting local getYoutubeTranscript fallback. Error:", supadataError.message);
    }

    // Attempt 2: If Supadata failed to produce a transcript, invoke our robust local scraper fallbacks
    if (!transcript) {
      console.log("[transcribe/youtube] Invoking getYoutubeTranscript local scraping fallback...");
      try {
        transcript = await getYoutubeTranscript(url);
      } catch (fallbackError) {
        console.error("[transcribe/youtube] Fallback getYoutubeTranscript failed:", fallbackError.message);
      }
    }

    if (!transcript) {
      return res.status(400).json({
        success: false,
        error: "Failed to extract transcript from YouTube video. Please try a different video that has captions enabled.",
        message: "Failed to extract transcript from YouTube video. Please try a different video that has captions enabled."
      });
    }

    const videoIdMatch = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/
    );
    const videoId = videoIdMatch ? videoIdMatch[1] : url;

    res.json({
      success: true,
      transcript,
      data: {
        transcript,
      },
      segments: segments.length > 0 ? segments : [{ text: transcript, start: 0, duration: 100 }],
      videoId,
      wordCount: transcript.split(/\s+/).length,
      duration: segments.length > 0
        ? segments[segments.length - 1].start + segments[segments.length - 1].duration
        : 100,
    });
  } catch (error) {
    console.error("[transcribe/youtube] Controller error:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to fetch transcript: " + error.message,
      message: "Failed to fetch transcript: " + error.message,
    });
  }
};


// ─────────────────────────────────────────────
// 5. POST /api/ai/transcribe/audio
//    Upload audio file → Transcribe with Whisper
// ─────────────────────────────────────────────
const transcribeAudioFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Audio file is required" });
    }

    console.log(`[transcribe/audio] Processing: ${req.file.originalname}`);

    // Use existing Whisper transcription (from OpenAI)
    const transcript = await transcribeAudio(req.file.path);

    // Cleanup
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    res.json({ transcript });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    console.error("[transcribe/audio] Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────────
// 6. POST /api/ai/doubt-solver
//    Student doubt → Level-based AI answer (Gemini FREE)
//    Levels: kg, school, college
// ─────────────────────────────────────────────
const doubtSolver = async (req, res) => {
  try {
    const { question, level, context, course_id, user_id } = req.body;
    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    console.log(`[doubt-solver] Question: "${question.substring(0, 50)}..." Level: ${level || "school"}`);

    const studentLevel = level || "school"; // 'kg', 'school', or 'college'
    const answer = await solveDoubt(question, context || "", studentLevel);

    res.json({
      answer,
      question,
      level: studentLevel,
    });
  } catch (error) {
    console.error("[doubt-solver] Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────────
// 7. POST /api/ai/flashcards-generator
//    PDF or Text → Generate Flashcards (Gemini FREE)
// ─────────────────────────────────────────────
const flashcardsGenerator = async (req, res) => {
  try {
    let text = "";
    if (req.file) {
      console.log(`[flashcards-generator] Processing PDF: ${req.file.originalname}`);
      text = await extractTextFromPDF(req.file.path);
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    } else if (req.body.text) {
      console.log(`[flashcards-generator] Processing raw text of length ${req.body.text.length}`);
      text = req.body.text;
    } else {
      return res.status(400).json({
        success: false,
        message: "Either PDF file or text is required"
      });
    }

    // Clean and limit huge text
    const cleanedText = text.replace(/\s+/g, " ").trim();
    const shortTranscript = cleanedText.slice(0, 12000);

    if (!shortTranscript || shortTranscript.length < 20) {
      return res.status(400).json({
        success: false,
        message: "Transcript too short",
      });
    }

    const count = parseInt(req.body.count) || 10;
    const language = req.body.language || "English";
    const flashcards = await generateFlashcards(shortTranscript, count, language);

    res.json({
      success: true,
      data: { flashcards, source: req.file ? "pdf" : "text" }
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    console.error("[flashcards-generator] Error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message || "AI processing failed"
    });
  }
};

module.exports = {
  notesGenerator,
  quizGeneratorFromFile,
  quizGeneratorFromText,
  transcribeYouTube,
  transcribeAudioFile,
  doubtSolver,
  flashcardsGenerator,
};
