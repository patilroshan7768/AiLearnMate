/**
 * Gemini AI Utility — FREE AI processing for Adiraj
 * Uses Google Gemini 1.5 Flash (free tier: 15 req/min)
 * Used for: notes-generator, quiz-generator, doubt-solver, transcribe
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

// Models to try in order (fallback chain for 503 high demand or 429 rate limit/quota errors)
const GEMINI_MODELS = [
  "gemini-1.5-flash",      // Highly generous 1500 requests/day limit on free tier!
  "gemini-1.5-flash-8b",   // Fast fallback, also 1500 requests/day!
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash",
];

function initGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("⚠️  GEMINI_API_KEY not set — Gemini features disabled");
    return false;
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  model = genAI.getGenerativeModel({ model: GEMINI_MODELS[0] });
  console.log("✅ Gemini AI initialized");
  return true;
}

// Initialize on load
initGemini();

async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API key not configured in .env");

  const genAI = new GoogleGenerativeAI(apiKey);

  for (const modelName of GEMINI_MODELS) {
    try {
      const m = genAI.getGenerativeModel({ model: modelName });
      const result = await m.generateContent(prompt);
      return result.response.text();
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
        console.warn(`[Gemini] ${modelName} rate-limited/unavailable, trying fallback ${GEMINI_MODELS[GEMINI_MODELS.indexOf(modelName) + 1]}...`);
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }
      throw err;
    }
  }
}

// ── LEVEL-BASED SYSTEM PROMPTS ──
const LEVEL_PROMPTS = {
  kg: `You are a friendly teacher for a KG (kindergarten) student aged 4-6.
Use VERY simple words. Add fun emojis 🌟🎈🐱. Give examples from daily life.
Keep sentences short (5-8 words max). Make it feel like a story or game.`,

  school: `You are a helpful teacher for a school student (class 6-12).
Use clear, simple language. Give real-world examples. Use bullet points.
Include "Remember this" tips. Explain step-by-step.`,

  college: `You are a knowledgeable professor for a college/university student.
Use proper technical terminology. Include references and theories.
Provide detailed explanations with formulas if applicable.`,
};

/**
 * Generate structured notes from text
 */
async function generateNotes(text, level = "school", language = "English") {
  const truncated = text.length > 15000 ? text.substring(0, 15000) + "\n[truncated]" : text;
  const levelPrompt = LEVEL_PROMPTS[level] || LEVEL_PROMPTS.school;

  const prompt = `${levelPrompt}

Generate comprehensive, well-structured study notes from the following content.
Make sure the study notes are written strictly in the target language: **${language}**. If the input text is not in ${language}, auto-detect and translate it into ${language}.

STRICT FORMATTING RULES:
- Start with a clear title using a single # heading.
- Use ## for main topics or chapters.
- Use ### for subtopics.
- Use bullet points (•) for key details.
- **CRITICAL NOTE RULE**: Every single bullet point MUST start with a **bold keyword or term** representing the concept, followed by its explanation (e.g., "• **Key Concept:** explanation..."). Ensure there are NO plain bullet points without bold keywords at the beginning.
- Use **bold** liberally for important terms and definitions.
- Add 📌 for "Remember" tips and critical takeaways.
- Add ❓ for practice questions at the end.

CONTENT:
${truncated}

Generate the notes now:`;

  return await callGemini(prompt);
}

/**
 * Generate MCQ quiz from text — returns JSON array
 */
async function generateQuiz(text, numQuestions = 20, difficulty = "medium", language = "English") {
  const truncated = text.length > 12000 ? text.substring(0, 12000) : text;

  const prompt = `Generate exactly ${numQuestions} multiple-choice questions from the following content.
Make sure the entire quiz is written strictly in the target language: **${language}**. If the input text is not in ${language}, auto-detect and translate it into ${language}.

DIFFICULTY: ${difficulty}

STRICT JSON OUTPUT FORMAT (return ONLY valid JSON array, no markdown):
[
  {
    "question": "What is...?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "The correct option text exactly",
    "correctAnswer": 0,
    "explanation": "Brief explanation"
  }
]

RULES:
- Each question has exactly 4 options
- "answer" = correct option text string
- "correctAnswer" = index (0-3) of correct option
- No markdown wrappers

CONTENT:
${truncated}

Generate quiz as JSON:`;

  const response = await callGemini(prompt);

  try {
    let jsonStr = response;
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1].trim();

    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed)) return parsed;
    if (parsed.quiz) return parsed.quiz;
    if (parsed.questions) return parsed.questions;
    return [parsed];
  } catch (e) {
    console.error("Quiz parse error:", e.message);
    return [{
      question: `Could not generate quiz from this content in ${language}. Please try again.`,
      options: ["Try again", "Use different content", "Shorten text", "Contact support"],
      answer: "Try again",
      correctAnswer: 0,
      explanation: "AI had trouble parsing this content."
    }];
  }
}

/**
 * Solve student doubt with level-based answer
 */
async function solveDoubt(question, context = "", level = "school") {
  const levelPrompt = LEVEL_PROMPTS[level] || LEVEL_PROMPTS.school;
  const truncatedContext = context.length > 8000 ? context.substring(0, 8000) : context;

  const prompt = `${levelPrompt}

You are an expert AI Study Assistant. Answer the student's question/doubt clearly and helpfully.

STRICT GROUNDING RULE:
- You must base your answer strictly and ONLY on the provided study notes context below.
- Do NOT use outside knowledge to introduce new topics. Make the explanation perfectly interconnected with their active study notes.
- If the question is completely unrelated to the study notes or cannot be answered using the provided notes context, politely inform the student that you can only answer questions directly related to their active study notes.

${truncatedContext ? `STUDY NOTES CONTEXT:\n${truncatedContext}\n\n` : "No study notes context provided. Inform the student to upload study material first."}

STUDENT'S DOUBT/QUESTION:
${question}

RESPONSE FORMAT:
- Start with a direct, clear answer
- Then explain step-by-step
- Give 1-2 examples grounded in the study notes
- End with a "Quick Tip" or "Remember"
${level === "kg" ? "- Use emojis and fun language" : ""}

Answer now:`;

  return await callGemini(prompt);
}

/**
 * Generate summary from text
 */
async function generateSummaryGemini(text, level = "school", language = "English") {
  const truncated = text.length > 15000 ? text.substring(0, 15000) : text;
  const levelPrompt = LEVEL_PROMPTS[level] || LEVEL_PROMPTS.school;

  const prompt = `${levelPrompt}

Create a highly structured, pattern-wise concise summary of the following content.
Make sure the summary is written strictly in the target language: **${language}**. If the input text is not in ${language}, translate it into ${language}.

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

CONTENT:
${truncated}

Generate summary:`;

  return await callGemini(prompt);
}

/**
 * Generate educational flashcards — returns JSON array of { front, back }
 */
async function generateFlashcards(text, count = 10, language = "English") {
  const truncated = text.length > 12000 ? text.substring(0, 12000) : text;

  const prompt = `Generate exactly ${count} educational revision flashcards from the following content.
Make sure the entire flashcard content is written strictly in the target language: **${language}**. If the input text is not in ${language}, translate it into ${language}.

STRICT JSON OUTPUT FORMAT (return ONLY valid JSON array, no markdown):
[
  {
    "front": "Term / Question",
    "back": "Short explanation / Definition"
  }
]

RULES:
- Return ONLY the JSON array, no markdown code blocks or wrapper text.

CONTENT:
${truncated}

Generate flashcards as JSON:`;

  const response = await callGemini(prompt);

  try {
    let jsonStr = response.trim();
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1].trim();

    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed)) return parsed;
    return [parsed];
  } catch (e) {
    console.error("Flashcards parse error:", e.message);
    return [
      { front: "Key term", back: `Detailed study explanation in ${language}` }
    ];
  }
}

module.exports = {
  callGemini,
  generateNotes,
  generateQuiz,
  solveDoubt,
  generateSummaryGemini,
  generateFlashcards,
  initGemini,
};
