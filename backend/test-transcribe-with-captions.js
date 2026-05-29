/**
 * Test script to diagnose YouTube transcription endpoint error
 * Using a video that's known to have captions
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

// Test YouTube URLs - using videos known to have captions
const TEST_URLS = [
  "https://www.youtube.com/watch?v=MNxwAU_xvMw", // A popular TED talk (usually has captions)
  "https://www.youtube.com/watch?v=9bZkp7q19f0", // PSY - Gangnam Style (definitely has captions)
];

async function testTranscribeYouTube(url) {
  try {
    console.log(`\n🧪 Testing /api/ai/transcribe/youtube endpoint...`);
    console.log(`📹 Video URL: ${url}`);

    const response = await axios.post(
      `${BASE_URL}/api/ai/transcribe/youtube`,
      { url },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    console.log("✅ Success! Transcript found:");
    console.log(`   Word Count: ${response.data.wordCount || "N/A"}`);
    console.log(`   Duration: ${response.data.duration || "N/A"} seconds`);
    console.log(`   Segments: ${response.data.segments?.length || 0}`);
    console.log(
      `   First 200 chars of transcript: ${response.data.transcript.substring(0, 200)}...`,
    );
  } catch (error) {
    console.error("❌ Error occurred:");
    console.error(`Status: ${error.response?.status}`);
    console.error(`Error: ${error.response?.data?.error || error.message}`);
  }
}

// Test all URLs sequentially
(async () => {
  for (const url of TEST_URLS) {
    await testTranscribeYouTube(url);
    // Wait a bit between requests to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
})();
