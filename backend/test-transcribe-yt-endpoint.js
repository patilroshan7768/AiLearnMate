/**
 * Test script to diagnose YouTube transcription endpoint error
 */
const axios = require("axios");
const jwt = require("jsonwebtoken");

const BASE_URL = "http://localhost:3000";
const JWT_SECRET = "mysecretkey123";
const TEST_USER_ID = 1; // Test user ID

// Create a test JWT token
const token = jwt.sign({ userId: TEST_USER_ID }, JWT_SECRET, {
  expiresIn: "1h",
});

// Test YouTube URL
const TEST_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"; // Rick Roll (a short well-known video)

async function testTranscribeYouTube() {
  try {
    console.log("🧪 Testing /api/ai/transcribe/youtube endpoint...");
    console.log(`📹 Video URL: ${TEST_URL}`);
    console.log(`🔐 Using JWT token: ${token.substring(0, 20)}...`);

    const response = await axios.post(
      `${BASE_URL}/api/ai/transcribe/youtube`,
      { url: TEST_URL },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    console.log("✅ Success! Response:");
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error("❌ Error occurred:");
    console.error(`Status: ${error.response?.status}`);
    console.error(`Status Text: ${error.response?.statusText}`);
    console.error(`Error Message: ${error.message}`);

    if (error.response?.data) {
      console.error("Response Data:");
      console.error(JSON.stringify(error.response.data, null, 2));
    }

    // Print full stack if available
    if (error.stack) {
      console.error("\nFull Stack:");
      console.error(error.stack);
    }
  }
}

testTranscribeYouTube();
