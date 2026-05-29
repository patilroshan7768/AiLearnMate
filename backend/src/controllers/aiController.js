const { generateSummary, generateQuizInJSON, generateStudyMaterialAI } = require('../utils/openai');
const { transcribeAudio } = require('../utils/whisper');
const { getVideoTitle, getVideoDetails: _getVideoDetails, getYoutubeTranscript } = require('../utils/youtube');
const { extractTextFromPDF } = require('../utils/pdf');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// 2. TEXT SUMMARY
const summarizeText = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({
        success: false,
        message: "Text content is required"
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

    const summary = await generateSummary(shortTranscript);
    res.json({
      success: true,
      summary
    });
  } catch (error) {
    console.error("[summarizeText] Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "AI processing failed"
    });
  }
};

// 3. YOUTUBE SUMMARY
const summarizeYoutube = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "YouTube URL is required" });

    // Get Details & Save to MyLearning
    let savedEntry = null;
    try {
      const MyLearning = require('../models/MyLearning');
      const details = await _getVideoDetails(url);

      // Check if exists
      const exists = await MyLearning.findOne({
        where: { userId: req.user.userId, playlistId: details.videoId }
      });

      if (!exists) {
        savedEntry = await MyLearning.create({
          userId: req.user.userId,
          playlistId: details.videoId,
          playlistTitle: details.title,
          thumbnail: details.thumbnail,
          channelName: details.channelName,
          isLocal: false
        });
        console.log("YouTube summary saved to MyLearning:", savedEntry.id);
      } else {
        savedEntry = exists;
      }

    } catch (dbError) {
      console.error("Failed to save YouTube summary to MyLearning:", dbError);
    }

    // Get transcript (no download needed!)
    const transcript = await getYoutubeTranscript(url);

    // Summarize
    const summary = await generateSummary(transcript);

    res.json({ transcript, summary, savedEntry });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 4. WEBSITE SUMMARY
const summarizeWebsite = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "Website URL is required" });

    const { data } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' } // fake user agent
    });
    const $ = cheerio.load(data);

    // Extract text from body, removing scripts and styles
    $('script').remove();
    $('style').remove();
    const text = $('body').text().replace(/\s+/g, ' ').trim();

    // Limit text length if too long (GPT limit)
    const truncatedText = text.substring(0, 15000); // Approximate char limit safe for context

    const summary = await generateSummary(truncatedText);
    res.json({ summary });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch or summarize website." });
  }
};

// 5. AUDIO/VIDEO TRANSCRIPTION
const transcribeFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "File is required" });

    // Define permanent path
    const uploadsDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const fileName = `${Date.now()}-${req.file.originalname}`;
    const permanentPath = path.join(uploadsDir, fileName);
    const relativePath = `uploads/${fileName}`;

    // Move file from temp to uploads
    fs.copyFileSync(req.file.path, permanentPath);

    // Save to MyLearning
    let savedEntry = null;
    try {
      const MyLearning = require('../models/MyLearning');
      const playlistId = 'loc_' + Date.now() + Math.random().toString(36).substr(2, 9);

      savedEntry = await MyLearning.create({
        userId: req.user.userId,
        playlistId: playlistId,
        playlistTitle: req.file.originalname,
        thumbnail: '',
        channelName: 'Transcribed Uploads',
        videoPath: relativePath,
        mimeType: req.file.mimetype,
        isLocal: true
      });
      console.log("Transcribed file saved to MyLearning:", savedEntry.id);
    } catch (dbError) {
      console.error("Failed to save transcription file to MyLearning:", dbError);
    }

    const transcript = await transcribeAudio(permanentPath);

    // Cleanup temp upload (original one)
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    res.json({ transcript, savedEntry });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 6. QUIZ GENERATION
const generateQuiz = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });

    const quiz = await generateQuizInJSON(text);
    res.json(quiz);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 7. STUDY MATERIAL GENERATION
const generateStudyMaterial = async (req, res) => {
  try {
    const { url, transcript, language, course_id } = req.body;
    let textToProcess = transcript;
    let contentTitle = "Uploaded Content";
    let savedEntry = null;
    let isTeacherUpload = false;

    console.log(`\n--- Generating Study Material ---`);
    console.log(`Request params: URL=${url ? 'Yes' : 'No'}, Transcript=${transcript ? 'Yes' : 'No'}, File=${req.file ? 'Yes' : 'No'}, CourseID=${course_id ? course_id : 'No'}`);

    // Verify course ownership if course_id is provided
    if (course_id) {
      const Course = require('../models/Course');
      const course = await Course.findOne({ where: { course_id: course_id, teacher_id: req.user.userId } });
      if (!course) {
        return res.status(403).json({ error: "Course not found or you don't have permission to add to it." });
      }
      isTeacherUpload = true;
    }

    // Handle File Uploads (PDF, Audio, Video)
    if (req.file) {
      const mimeType = req.file.mimetype;
      contentTitle = req.file.originalname;

      // Define permanent path
      const uploadsDir = path.join(__dirname, '../../uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const fileName = `${Date.now()}-${req.file.originalname}`;
      const permanentPath = path.join(uploadsDir, fileName);
      const relativePath = `uploads/${fileName}`;

      // Move file from temp to uploads
      fs.copyFileSync(req.file.path, permanentPath);

      console.log(`Processing file: ${contentTitle} (${mimeType})`);

      // SAVE TO DATABASE (MyLearning or Lecture/Pdf)
      try {
        if (isTeacherUpload) {
          if (mimeType === 'application/pdf') {
            const Pdf = require('../models/Pdf');
            const Lecture = require('../models/Lecture');
            
            // Create legacy Pdf entry
            await Pdf.create({
              course_id: course_id,
              title: contentTitle,
              pdf_url: relativePath
            });

            // Create Lecture entry to get unified lecture_id for transcripts and grounded AI features
            savedEntry = await Lecture.create({
              course_id: course_id,
              title: contentTitle,
              video_url: relativePath,
              lecture_type: 'pdf'
            });
          } else {
            const Lecture = require('../models/Lecture');
            savedEntry = await Lecture.create({
              course_id: course_id,
              title: contentTitle,
              video_url: relativePath,
              lecture_type: 'video/audio'
            });
          }
          console.log("Locally saved to Course (Teacher Module):", savedEntry.lecture_id);
        } else {
          const MyLearning = require('../models/MyLearning');
          const playlistId = 'loc_' + Date.now() + Math.random().toString(36).substr(2, 9);
          savedEntry = await MyLearning.create({
            userId: req.user.userId,
            playlistId: playlistId,
            playlistTitle: contentTitle,
            thumbnail: '',
            channelName: 'My Uploads',
            videoPath: relativePath,
            mimeType: mimeType,
            isLocal: true
          });
          console.log("Locally saved to MyLearning:", savedEntry.id);
        }
      } catch (dbError) {
        console.error("Failed to save to Database:", dbError);
      }

      if (mimeType === 'application/pdf') {
        textToProcess = await extractTextFromPDF(permanentPath);
      } else if (mimeType.startsWith('audio/') || mimeType.startsWith('video/')) {
        textToProcess = await transcribeAudio(permanentPath);
      }

      // Cleanup temp file
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    }
    // Handle YouTube URL
    else if (url) {
      console.log(`Processing YouTube URL: ${url}`);

      const { getVideoDetails } = require('../utils/youtube');
      const details = await getVideoDetails(url);
      contentTitle = details.title;
      console.log(`Video Title: ${contentTitle}`);

      // Save to MyLearning or Lecture
      try {
        if (isTeacherUpload) {
            const Lecture = require('../models/Lecture');
            savedEntry = await Lecture.create({
              course_id: course_id,
              title: contentTitle,
              video_url: url,
              lecture_type: 'youtube'
            });
            console.log("YouTube saved to Course (Teacher Module):", savedEntry.lecture_id);
        } else {
            const MyLearning = require('../models/MyLearning');
            const exists = await MyLearning.findOne({
              where: { userId: req.user.userId, playlistId: details.videoId }
            });

            if (!exists) {
              savedEntry = await MyLearning.create({
                userId: req.user.userId,
                playlistId: details.videoId,
                playlistTitle: details.title,
                thumbnail: details.thumbnail,
                channelName: details.channelName,
                isLocal: false
              });
              console.log("YouTube saved to MyLearning:", savedEntry.id);
            } else {
              savedEntry = exists;
            }
        }
      } catch (dbError) {
        console.error("Failed to save YouTube to DB:", dbError);
      }

      // Get transcript directly (no download needed!)
      console.log('Fetching YouTube transcript...');
      textToProcess = await getYoutubeTranscript(url);
    }

    // Validation
    if (!textToProcess || textToProcess.length < 50) {
      console.warn("Input content is empty or too short!");
      return res.status(400).json({ error: "Content is empty or too short. Please provide a valid URL, file, or transcript." });
    }

    console.log(`Content Length: ${Math.floor(textToProcess.length)} chars`);

    const studyMaterial = await generateStudyMaterialAI(textToProcess, language, contentTitle);

    // Save generated content to database if savedEntry exists
    if (savedEntry) {
      try {
        const Transcript = require('../models/Transcript');
        const Note = require('../models/Note');
        const Flashcard = require('../models/Flashcard');
        const Quiz = require('../models/Quiz');

        const lectureId = isTeacherUpload ? savedEntry.lecture_id : null;
        const myLearningId = !isTeacherUpload ? savedEntry.id : null;

        // Save Transcript
        await Transcript.create({
          my_learning_id: myLearningId,
          lecture_id: lectureId,
          transcript: textToProcess
        });

        // Save Note (Combine notes, summary, and important questions)
        let combinedNotes = `# ${contentTitle} - Study Notes\n\n## Summary\n${studyMaterial.summary}\n\n## Detailed Notes\n${studyMaterial.notes}\n\n## Important Questions\n`;
        if (studyMaterial.important_questions && Array.isArray(studyMaterial.important_questions)) {
          studyMaterial.important_questions.forEach((q, idx) => {
            combinedNotes += `${idx + 1}. ${q}\n`;
          });
        }

        await Note.create({
          my_learning_id: myLearningId,
          lecture_id: lectureId,
          generated_notes: combinedNotes
        });

        // Save Flashcards
        if (studyMaterial.flashcards && Array.isArray(studyMaterial.flashcards)) {
          await Flashcard.create({
            my_learning_id: myLearningId,
            lecture_id: lectureId,
            content: studyMaterial.flashcards
          });
        }

        // Save Quiz
        if (studyMaterial.quiz && Array.isArray(studyMaterial.quiz)) {
          await Quiz.create({
            my_learning_id: myLearningId,
            lecture_id: lectureId,
            questions: studyMaterial.quiz
          });
        }

        console.log("Successfully saved AI generated materials to database.");
      } catch (dbError) {
        console.error("Failed to save AI generated materials to database:", dbError);
      }
    }

    res.json({
      studyMaterial,
      transcript: textToProcess,
      savedEntry: savedEntry // Return the saved entry so frontend can update UI
    });

  } catch (error) {
    console.error("Study Material Error:", error);
    // Cleanup allowed file if error occurs and it exists
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: error.message });
  }
};

// 8. AI CHATBOT SYSTEM
const askChatbot = async (req, res) => {
  try {
    const { question, my_learning_id, lecture_id } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: "Question is required." });
    }

    let contextText = "";

    // Fetch context from Transcript table
    if (my_learning_id || lecture_id) {
      const Transcript = require('../models/Transcript');
      const whereClause = {};
      if (my_learning_id) whereClause.my_learning_id = my_learning_id;
      if (lecture_id) whereClause.lecture_id = lecture_id;

      const transcriptRecord = await Transcript.findOne({ where: whereClause });
      if (transcriptRecord) {
        contextText = transcriptRecord.transcript;
      }
    }

    // Limit context length to avoid exceeding token limits
    if (contextText.length > 25000) {
      contextText = contextText.substring(0, 25000) + "...";
    }

    const { openai } = require('../utils/openai');
    const response = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
            {
                role: "system",
                content: "You are an expert AI tutor for the AI-LearnMate platform. Answer the user's question accurately based ONLY on the provided lecture context. If the context does not contain the answer, politely state that you cannot find the answer in the lecture material."
            },
            {
                role: "user",
                content: `Lecture Context:\n${contextText ? contextText : "No specific context provided."}\n\nStudent Question: ${question}`
            }
        ],
        temperature: 0.5,
        max_tokens: 1000
    });

    res.json({ answer: response.choices[0].message.content.trim() });
  } catch (error) {
    console.error("AI Chatbot Error:", error);
    res.status(500).json({ error: "Failed to process chatbot request." });
  }
};

module.exports = {
  summarizeText,
  summarizeYoutube,
  summarizeWebsite,
  transcribeFile,
  generateQuiz,
  generateStudyMaterial,
  askChatbot
};
