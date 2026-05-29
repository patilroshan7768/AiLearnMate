const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyCZ8fyIT3X1akltQ_AuYmKQgLz7SGkLg88';

// Model fallback chain — if primary is overloaded or rate-limited, try next
const GEMINI_MODELS = [
    'gemini-1.5-flash',      // Highly generous free tier model (1500 RPD)
    'gemini-1.5-flash-8b',   // Generous backup model (1500 RPD)
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash',
];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/**
 * Call Gemini with automatic model fallback on 503/404/429
 */
const callGeminiWithFallback = async (prompt) => {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    for (const modelName of GEMINI_MODELS) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            return result.response.text().trim();
        } catch (err) {
            const isRetryable = err.message && (
                err.message.includes('503') ||
                err.message.includes('429') ||
                err.message.includes('Too Many Requests') ||
                err.message.includes('quota') ||
                err.message.includes('limit') ||
                err.message.includes('high demand') ||
                err.message.includes('Service Unavailable') ||
                err.message.includes('404')
            );
            if (isRetryable && modelName !== GEMINI_MODELS[GEMINI_MODELS.length - 1]) {
                console.warn(`[openai.js] ${modelName} rate-limited/unavailable, trying fallback ${GEMINI_MODELS[GEMINI_MODELS.indexOf(modelName) + 1]}...`);
                await sleep(1200);
                continue;
            }
            throw err;
        }
    }
};

/**
 * Generate a summary using Gemini
 * @param {string} text - The text to summarize
 * @returns {Promise<string>} - The summary
 */
const generateSummary = async (text) => {
    try {
        const truncated = text.length > 15000 ? text.substring(0, 15000) + '\n[content truncated]' : text;
        const prompt = `You are a helpful assistant that generates highly structured, pattern-wise concise summaries.

STRICT PATTERN-WISE FORMAT:
## 📋 OVERVIEW SUMMARY
A structured 2-3 sentence overview paragraph detailing the primary scope of the content.

## 🔑 CRITICAL KEY POINTS
• **[Topic 1]**: Detailed bullet point explanation.
• **[Topic 2]**: Detailed bullet point explanation.
• **[Topic 3]**: Detailed bullet point explanation.
(Generate exactly 5-8 comprehensive key points, ensuring every single bullet point starts with a **bold keyword/topic**)

## 💡 ACTIONABLE TAKEAWAYS
1. **Primary takeaway**: Essential concept to remember.
2. **Secondary takeaway**: Crucial guideline or fact.
3. **Tertiary takeaway**: Key practical implementation.

TEXT TO SUMMARIZE:
${truncated}

Generate the summary now:`;

        const result = await callGeminiWithFallback(prompt);
        return result;
    } catch (error) {
        console.error('Gemini Summary Error:', error);
        throw new Error('Failed to generate summary.');
    }
};

/**
 * Generate a quiz using Gemini
 * @param {string} text - The content to generate quiz from
 * @returns {Promise<Array>} - Array of quiz objects
 */
const generateQuizInJSON = async (text) => {
    try {
        const truncated = text.length > 12000 ? text.substring(0, 12000) : text;
        const prompt = `Generate exactly 5 multiple-choice questions from the following content.

STRICT JSON OUTPUT FORMAT (return ONLY valid JSON array, no markdown, no explanation):
[
  {
    "question": "What is...?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "The correct option text exactly as written in options",
    "correctAnswer": 0,
    "explanation": "Brief explanation"
  }
]

RULES:
- Each question has exactly 4 options
- "answer" must be the exact text of the correct option
- "correctAnswer" is the 0-based index of the correct option
- Return ONLY the JSON array, no markdown, no code block

CONTENT:
${truncated}

JSON:`;

        const response = await callGeminiWithFallback(prompt);

        let cleaned = response.trim();
        // Clean markdown code blocks if present
        const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) cleaned = jsonMatch[1].trim();

        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed)) return parsed;
        if (parsed.quiz) return parsed.quiz;
        if (parsed.questions) return parsed.questions;
        return [parsed];
    } catch (error) {
        console.error('Gemini Quiz Error:', error);
        throw new Error('Failed to generate quiz.');
    }
};

/**
 * Generate complete study material from transcript
 * @param {string} transcript - The video transcript
 * @param {string} [language='English'] - The target language for the output
 * @param {string} [title=''] - The title of the content/video
 * @returns {Promise<Object>} - Complete study material object
 */
const generateStudyMaterialAI = async (transcript, language = 'English', title = '') => {
    try {
        const truncated = transcript.length > 15000 ? transcript.substring(0, 15000) + '\n[content truncated]' : transcript;

        const prompt = `You are an expert teacher, note-maker, and exam-oriented content creator.
Generate complete study material from the content provided.

TOPIC: ${title || 'Provided Content'}
LANGUAGE: ${language}

TRANSCRIPT/CONTENT:
${truncated}

Return ONLY a valid JSON object with these exact keys (no markdown, no code block, raw JSON only):
{
  "notes": "Detailed notes in markdown with ## headings and bullet points",
  "summary": "Short summary with key takeaways in markdown",
  "flashcards": [
    { "question": "...", "answer": "..." }
  ],
  "quiz": [
    { "question": "...", "options": ["A", "B", "C", "D"], "answer": "Exact correct option text", "correctAnswer": 0, "explanation": "..." }
  ],
  "important_questions": [
    "Question 1?",
    "Question 2?"
  ]
}

Rules:
- At least 5 flashcards, 5 quiz questions, 5 important questions
- Use ONLY the given content
- Clean markdown for notes and summary
- Valid JSON only — no wrapping code blocks`;

        const response = await callGeminiWithFallback(prompt);

        let cleaned = response.trim();
        // Strip markdown code blocks if present
        const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) cleaned = jsonMatch[1].trim();

        // Remove any leading/trailing non-JSON text
        const firstBrace = cleaned.indexOf('{');
        const lastBrace = cleaned.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            cleaned = cleaned.substring(firstBrace, lastBrace + 1);
        }

        return JSON.parse(cleaned);
    } catch (error) {
        console.error('Gemini Study Material Error:', error);
        throw new Error('Failed to generate study material.');
    }
};

// Stub for backward compatibility — openai object is not used anymore
const openai = {
    chat: {
        completions: {
            create: async () => { throw new Error('OpenAI is disabled — using Gemini instead'); }
        }
    }
};

module.exports = { openai, generateSummary, generateQuizInJSON, generateStudyMaterialAI };
