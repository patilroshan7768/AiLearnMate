// Test Gemini direct YouTube URL processing
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

async function testGeminiYoutube() {
  const ytUrl = "https://www.youtube.com/watch?v=Ke90Tje7VS0";
  console.log("Testing Gemini with YouTube URL:", ytUrl);

  try {
    const result = await model.generateContent([
      {
        fileData: {
          mimeType: "video/mp4",
          fileUri: ytUrl,
        },
      },
      {
        text: "Please provide a detailed transcript and summary of this video in plain text format."
      }
    ]);
    const text = result.response.text();
    console.log("SUCCESS! Response length:", text.length);
    console.log("First 300 chars:", text.slice(0, 300));
  } catch (err) {
    console.error("FAIL (fileData method):", err.message);

    // Try alternative method with inlineData
    try {
      const result2 = await model.generateContent([
        `You are a YouTube video transcriber. The video URL is: ${ytUrl}
        Please provide a comprehensive summary and key points from this React JS tutorial video.
        Include: main topics covered, key concepts, and a brief transcript of important parts.`
      ]);
      const text2 = result2.response.text();
      console.log("SUCCESS (text-only method)! Response:", text2.slice(0, 300));
    } catch (err2) {
      console.error("FAIL (text-only method):", err2.message);
    }
  }
}

testGeminiYoutube();
