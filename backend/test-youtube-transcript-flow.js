/**
5:  * End-to-End Test: Whole YouTube Transcript Flow
6:  * Verifies: YouTube Transcription (Supadata) -> Notes Generation -> Quiz Generation -> Doubt Solving
7:  */
const axios = require("axios");
const jwt = require("jsonwebtoken");

const BASE_URL = "http://localhost:3000";
const JWT_SECRET = "mysecretkey123";
const TEST_USER_ID = 1;

// Create test JWT token
const token = jwt.sign({ userId: TEST_USER_ID }, JWT_SECRET, { expiresIn: "1h" });
const headers = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
};

// Use a well-known public short video
const YOUTUBE_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

async function runWholeFlow() {
  try {
    console.log("🚀 Starting Whole YouTube Transcript Flow end-to-end test...\n");

    // 1. YouTube Transcription
    console.log("Step 1: Extracting transcript via /api/ai/transcribe/youtube...");
    const transcribeResponse = await axios.post(
      `${BASE_URL}/api/ai/transcribe/youtube`,
      { youtubeUrl: YOUTUBE_URL },
      { headers }
    );
    
    if (!transcribeResponse.data.success) {
      throw new Error("YouTube transcription failed: " + JSON.stringify(transcribeResponse.data));
    }

    const transcript = transcribeResponse.data.transcript;
    console.log("✅ YouTube Transcription Succeeded!");
    console.log(`   Word Count: ${transcribeResponse.data.wordCount}`);
    console.log(`   Segments Count: ${transcribeResponse.data.segments?.length || 0}`);
    console.log(`   Preview: ${transcript.substring(0, 150)}...\n`);

    // 2. Notes Generation
    console.log("Step 2: Generating structured notes via /api/ai/notes-generator...");
    const notesResponse = await axios.post(
      `${BASE_URL}/api/ai/notes-generator`,
      {
        text: transcript,
        level: "school",
        title: "YouTube Study Guide"
      },
      { headers }
    );

    if (!notesResponse.data.success) {
      throw new Error("Notes generation failed: " + JSON.stringify(notesResponse.data));
    }

    const notes = notesResponse.data.data.notes;
    console.log("✅ Notes Generation Succeeded!");
    console.log(`   Notes Character Length: ${notes.length}`);
    console.log(`   Preview:\n${notes.substring(0, 250)}...\n`);

    // 3. Quiz Generation
    console.log("Step 3: Generating interactive practice quiz via /api/ai/quiz-generator/text...");
    const quizResponse = await axios.post(
      `${BASE_URL}/api/ai/quiz-generator/text`,
      {
        text: transcript,
        num_questions: 3,
        difficulty: "medium"
      },
      { headers }
    );

    if (!quizResponse.data.success) {
      throw new Error("Quiz generation failed: " + JSON.stringify(quizResponse.data));
    }

    const quiz = quizResponse.data.data.quiz;
    console.log("✅ Quiz Generation Succeeded!");
    console.log(`   Questions Count: ${quiz.length}`);
    console.log("   First Question Sample:");
    console.log(`   ❓ Q: ${quiz[0].question}`);
    console.log(`   Options: ${quiz[0].options?.join(" | ")}`);
    console.log(`   Answer Index: ${quiz[0].answerIndex}\n`);

    // 4. Doubt Solving
    console.log("Step 4: Testing interactive Doubt Solver via /api/ai/doubt-solver...");
    const doubtResponse = await axios.post(
      `${BASE_URL}/api/ai/doubt-solver`,
      {
        question: "What is the key message of the song in the transcript?",
        level: "school",
        context: transcript
      },
      { headers }
    );

    const answer = doubtResponse.data.answer;
    console.log("✅ Doubt Solver Succeeded!");
    console.log(`   Explanation: ${answer.substring(0, 300)}...\n`);

    console.log("🎉 ALL STEPS PASSED SUCCESSFULLY END-TO-END! Whole flow is fully operational! 🌟");

  } catch (error) {
    console.error("❌ FLOW TEST FAILED:");
    if (error.response?.data) {
      console.error(JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
  }
}

runWholeFlow();
