# Backend API Endpoints Required for AI Tools

This document specifies all the API endpoints needed to support the new AI Tools features.

## Base URL

```
/api/ai
```

---

## 1. Notes Generator

### Endpoint

```
POST /api/ai/notes-generator
```

### Description

Uploads a document (PDF, DOCX, PPT, TXT) and generates concise study notes with important points.

### Request Headers

```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

### Request Body

```
{
  file: File (binary),
  course_id: number (optional)
}
```

### Response (Success 200)

```json
{
  "notes": "Full detailed notes extracted from the document...",
  "important_points": [
    "Key point 1",
    "Key point 2",
    "Key point 3"
  ],
  "summary": "Brief summary of the content" (optional)
}
```

### Response (Error)

```json
{
  "error": "Invalid file format or processing failed",
  "message": "Detailed error message"
}
```

---

## 2. Quiz Generator - From File

### Endpoint

```
POST /api/ai/quiz-generator/file
```

### Description

Generates multiple-choice quiz questions from an uploaded document.

### Request Headers

```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

### Request Body

```
{
  file: File (binary),
  course_id: number (optional),
  num_questions: number (default: 5)
}
```

### Response (Success 200)

```json
{
  "quiz": [
    {
      "question": "What is photosynthesis?",
      "options": [
        "Process of converting light to energy",
        "Breakdown of nutrients",
        "Cell division process",
        "Protein synthesis"
      ],
      "correct_answer": "Process of converting light to energy",
      "explanation": "Optional explanation"
    }
    // ... more questions
  ]
}
```

### Response (Error)

```json
{
  "error": "Quiz generation failed",
  "message": "Detailed error message"
}
```

---

## 3. Quiz Generator - From Text

### Endpoint

```
POST /api/ai/quiz-generator/text
```

### Description

Generates MCQ questions from pasted text/notes.

### Request Headers

```
Authorization: Bearer {token}
Content-Type: application/json
```

### Request Body

```json
{
  "text": "Full text or notes content...",
  "course_id": number,
  "num_questions": number
}
```

### Response (Success 200)

```json
{
  "quiz": [
    {
      "question": "Question here?",
      "options": ["opt1", "opt2", "opt3", "opt4"],
      "correct_answer": "opt1",
      "explanation": "Why this is correct"
    }
  ]
}
```

---

## 4. Audio Transcription

### Endpoint

```
POST /api/ai/transcribe/audio
```

### Description

Transcribes audio or video files to text using speech-to-text AI.

### Request Headers

```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

### Request Body

```
{
  file: File (audio/video file)
}
```

### Supported File Types

- Audio: m4a, mp3, wav, flac, aac
- Video: mp4, mkv, mov, avi

### Response (Success 200)

```json
{
  "transcription": "Full transcription of the audio file...",
  "duration": 3600,
  "language": "en",
  "confidence": 0.95
}
```

### Response (Error)

```json
{
  "error": "Transcription failed",
  "message": "File too large or format not supported"
}
```

---

## 5. YouTube Transcription

### Endpoint

```
POST /api/ai/transcribe/youtube
```

### Description

Extracts and transcribes audio from a YouTube video.

### Request Headers

```
Authorization: Bearer {token}
Content-Type: application/json
```

### Request Body

```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
```

### Response (Success 200)

```json
{
  "transcription": "Full transcription of YouTube video...",
  "video_title": "Video Title Here",
  "video_duration": 180,
  "language": "en"
}
```

### Response (Error)

```json
{
  "error": "YouTube transcription failed",
  "message": "Invalid URL or video not available"
}
```

---

## 6. Doubt Solver (AI Q&A)

### Endpoint

```
POST /api/ai/doubt-solver
```

### Description

Answers student questions with step-by-step, beginner-friendly explanations.

### Request Headers

```
Authorization: Bearer {token}
Content-Type: application/json
```

### Request Body

```json
{
  "question": "How does photosynthesis work?",
  "course_id": number,
  "user_id": number,
  "context": "optional study material context"
}
```

### Response (Success 200)

```json
{
  "answer": "Step-by-step explanation here...",
  "explanation": "Detailed breakdown",
  "examples": ["Example 1", "Example 2"],
  "difficulty_level": "beginner",
  "related_topics": ["topic1", "topic2"]
}
```

### Response (Error)

```json
{
  "error": "Failed to generate answer",
  "message": "Please try rephrasing your question"
}
```

---

## Implementation Notes

### AI Provider Integration

These endpoints should integrate with:

- **Google Gemini API** (recommended for all tasks)
- **OpenAI API** (GPT-4 alternative)
- **Whisper API** (for transcriptions)
- **YouTube Data API** (for video extraction)

### Environment Variables Needed

```env
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...
YOUTUBE_API_KEY=...
```

### Error Codes

| Code | Message             | Action                  |
| ---- | ------------------- | ----------------------- |
| 400  | Bad Request         | Check request format    |
| 401  | Unauthorized        | Ensure valid token      |
| 413  | File too large      | Reduce file size        |
| 415  | Unsupported format  | Use supported file type |
| 429  | Rate limited        | Wait before retrying    |
| 500  | Server error        | Check server logs       |
| 503  | Service unavailable | Retry later             |

---

## Rate Limiting (Recommended)

```javascript
// Per user per hour
notes-generator: 10 requests
quiz-generator: 10 requests
transcribe-audio: 5 requests (file size limited to 100MB)
transcribe-youtube: 10 requests
doubt-solver: 50 requests
```

---

## Testing

### Example cURL Requests

**Notes Generator:**

```bash
curl -X POST http://localhost:3000/api/ai/notes-generator \
  -H "Authorization: Bearer token" \
  -F "file=@document.pdf" \
  -F "course_id=1"
```

**Doubt Solver:**

```bash
curl -X POST http://localhost:3000/api/ai/doubt-solver \
  -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is photosynthesis?",
    "course_id": 1,
    "user_id": 123
  }'
```

---

## Database Considerations

Consider storing:

- User AI tool usage logs
- Generated quiz results
- Transcription history
- Popular doubt solver questions

---

## Performance Optimization

1. **Caching:** Cache transcripts for same YouTube URLs
2. **Queuing:** Use background jobs for large file processing
3. **CDN:** Store downloaded files on CDN
4. **Compression:** Compress text responses
5. **Pagination:** For long transcripts/notes

---

**Last Updated:** May 26, 2026
**Status:** Required for Production
**Priority:** High
