// AI Service - Integrated with LearnMate local backend
import api from "./api";
import { Platform } from "react-native";

const summarize = async (text) => {
  try {
    if (text && typeof text === "string" && text.startsWith("http")) {
      if (text.includes("youtube.com") || text.includes("youtu.be")) {
        const response = await api.post("/ai/summarize/youtube", { url: text });
        return {
          success: true,
          data: {
            summary: response.data.summary,
            transcript: response.data.transcript,
          },
        };
      } else {
        const response = await api.post("/ai/summarize/website", { url: text });
        return { success: true, data: { summary: response.data.summary } };
      }
    } else {
      const response = await api.post("/ai/summarize/text", { text });
      return { success: true, data: { summary: response.data.summary } };
    }
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message:
        error?.response?.data?.message ||
        "AI generation failed",
    };
  }
};

const generateQuiz = async (topic, numQuestions = 5) => {
  try {
    const response = await api.post("/ai/quiz", { text: topic });
    return { data: { quiz: response.data } };
  } catch (error) {
    console.error("aiService.generateQuiz Error:", error);
    throw error.response
      ? error.response.data
      : new Error("Failed to generate quiz");
  }
};

const transcribe = async (payload) => {
  try {
    if (typeof payload === "string" && payload.startsWith("http")) {
      // YouTube URL
      const response = await api.post("/ai/summarize/youtube", {
        url: payload,
      });
      return {
        data: {
          transcription: response.data.transcript,
        },
        transcription: response.data.transcript,
      };
    } else if (payload && typeof payload === "object" && payload.uri) {
      // Local file upload
      const formData = new FormData();
      if (Platform.OS === "web" && payload.file) {
        formData.append("file", payload.file);
      } else {
        formData.append("file", {
          uri: payload.uri,
          name: payload.name || "audio.m4a",
          type: payload.mimeType || "audio/m4a",
        });
      }
      const response = await api.post("/ai/transcribe", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return {
        data: {
          transcription: response.data.transcript,
        },
        transcription: response.data.transcript,
      };
    } else {
      throw new Error("Invalid payload for transcription");
    }
  } catch (error) {
    console.error("aiService.transcribe Error:", error);
    throw error.response
      ? error.response.data
      : new Error("Transcription failed");
  }
};

const generateStudyMaterial = async ({
  url,
  transcript,
  language,
  course_id,
  file,
}) => {
  try {
    if (file) {
      const formData = new FormData();
      if (Platform.OS === "web" && file.file) {
        formData.append("file", file.file);
      } else {
        formData.append("file", {
          uri: file.uri,
          name: file.name,
          type: file.mimeType || "application/pdf",
        });
      }
      if (course_id) formData.append("course_id", course_id.toString());
      if (language) formData.append("language", language);
      if (transcript) formData.append("transcript", transcript);
      if (url) formData.append("url", url);

      const response = await api.post("/ai/study-material", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } else {
      const response = await api.post("/ai/study-material", {
        url,
        transcript,
        language,
        course_id,
      });
      return response.data;
    }
  } catch (error) {
    console.error("aiService.generateStudyMaterial Error:", error);
    throw error.response
      ? error.response.data
      : new Error(
          error.response?.data?.error || "AI Study Material Generation failed",
        );
  }
};

const chatWithVideo = async (
  learningMaterial,
  question,
  history = [],
  my_learning_id = null,
  lecture_id = null,
) => {
  try {
    const response = await api.post("/ai/chatbot", {
      question,
      my_learning_id,
      lecture_id,
    });
    return { data: { reply: response.data.answer } };
  } catch (error) {
    console.error("aiService.chatWithVideo Error:", error);
    throw error.response
      ? error.response.data
      : new Error("Chatbot response failed");
  }
};

// NEW: Generate notes from file
const generateNotesFromFile = async ({ file, course_id, language = "English" }) => {
  try {
    const formData = new FormData();
    if (Platform.OS === "web" && file.file) {
      formData.append("file", file.file);
    } else {
      formData.append("file", {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || "application/pdf",
      });
    }
    if (course_id) formData.append("course_id", course_id.toString());
    formData.append("language", language);

    const response = await api.post("/ai/notes-generator", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response;
  } catch (error) {
    console.error("aiService.generateNotesFromFile Error:", error);
    throw error.response
      ? error.response.data
      : new Error("Notes generation failed");
  }
};

// NEW: Generate notes from text
const generateNotesFromText = async ({ text, title, course_id, language = "English" }) => {
  try {
    const response = await api.post("/ai/notes-generator", {
      text,
      title,
      course_id,
      language,
    });
    return response.data;
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message:
        error?.response?.data?.message ||
        "AI generation failed",
    };
  }
};

// NEW: Generate quiz from file
const generateQuizFromFile = async ({ file, course_id, num_questions = 20, language = "English" }) => {
  try {
    const formData = new FormData();
    if (Platform.OS === "web" && file.file) {
      formData.append("file", file.file);
    } else {
      formData.append("file", {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || "application/pdf",
      });
    }
    if (course_id) formData.append("course_id", course_id.toString());
    formData.append("num_questions", num_questions.toString());
    formData.append("language", language);

    const response = await api.post("/ai/quiz-generator/file", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response;
  } catch (error) {
    console.error("aiService.generateQuizFromFile Error:", error);
    throw error.response
      ? error.response.data
      : new Error("Quiz generation from file failed");
  }
};

// NEW: Generate quiz from text
const generateQuizFromText = async ({ text, course_id, num_questions = 20, language = "English" }) => {
  try {
    const response = await api.post("/ai/quiz-generator/text", {
      text,
      course_id,
      num_questions,
      language,
    });
    return response.data;
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message:
        error?.response?.data?.message ||
        "AI generation failed",
    };
  }
};

// NEW: Transcribe YouTube video
const transcribeYouTube = async (youtubeUrl) => {
  try {
    const response = await api.post("/ai/transcribe/youtube", {
      youtubeUrl,
      url: youtubeUrl,
    });
    return response.data;
  } catch (error) {
    console.error("YouTube Transcript Error:", error);
    return {
      success: false,
      message:
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to extract transcript",
    };
  }
};

// NEW: Transcribe audio file
const transcribeAudioFile = async (file) => {
  try {
    const formData = new FormData();
    if (Platform.OS === "web" && file.file) {
      formData.append("file", file.file);
    } else {
      formData.append("file", {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || "audio/m4a",
      });
    }

    const response = await api.post("/ai/transcribe/audio", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response;
  } catch (error) {
    console.error("aiService.transcribeAudioFile Error:", error);
    throw error.response
      ? error.response.data
      : new Error("Audio transcription failed");
  }
};

// NEW: Solve doubt - AI answer to student question
const solveDoubt = async ({ question, course_id, user_id, context }) => {
  try {
    const response = await api.post("/ai/doubt-solver", {
      question,
      course_id,
      user_id,
      context,
    });
    return response;
  } catch (error) {
    console.error("aiService.solveDoubt Error:", error);
    throw error.response
      ? error.response.data
      : new Error("Doubt solver failed");
  }
};

// NEW: Generate flashcards from file
const generateFlashcardsFromFile = async ({ file, course_id, count = 10, language = "English" }) => {
  try {
    const formData = new FormData();
    if (Platform.OS === "web" && file.file) {
      formData.append("file", file.file);
    } else {
      formData.append("file", {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || "application/pdf",
      });
    }
    if (course_id) formData.append("course_id", course_id.toString());
    formData.append("count", count.toString());
    formData.append("language", language);

    const response = await api.post("/ai/flashcards-generator", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response;
  } catch (error) {
    console.error("aiService.generateFlashcardsFromFile Error:", error);
    throw error.response
      ? error.response.data
      : new Error("Flashcards generation failed");
  }
};

// NEW: Generate flashcards from text
const generateFlashcardsFromText = async ({ text, course_id, count = 10, language = "English" }) => {
  try {
    const response = await api.post("/ai/flashcards-generator", {
      text,
      course_id,
      count,
      language,
    });
    return response.data;
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: error?.response?.data?.message || "AI generation failed",
    };
  }
};

export default {
  summarize,
  generateQuiz,
  transcribe,
  generateStudyMaterial,
  chatWithVideo,
  generateNotesFromFile,
  generateNotesFromText,
  generateQuizFromFile,
  generateQuizFromText,
  transcribeYouTube,
  transcribeAudioFile,
  solveDoubt,
  generateFlashcardsFromFile,
  generateFlashcardsFromText,
};
