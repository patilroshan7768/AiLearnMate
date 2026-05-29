# Quick Reference: AI Tools Implementation

## 🎯 Quick Start for Developers

### File Locations

```
src/
├── screens/
│   └── AIScreen.js (MODIFIED)
├── components/
│   ├── AIToolsPanel.js (NEW)
│   ├── AINotesGenerator.js (NEW)
│   ├── AIQuizGenerator.js (NEW)
│   ├── AITranscriber.js (NEW)
│   └── AIDoubtSolver.js (NEW)
└── services/
    └── aiService.js (MODIFIED - added 6 new methods)

Root/
├── AI_TOOLS_IMPLEMENTATION.md
├── BACKEND_AI_TOOLS_API.md
└── COMPLETE_IMPLEMENTATION_SUMMARY.md
```

---

## 🔧 Quick Setup

### 1. Verify Files Exist

```bash
ls src/components/AITools*
ls src/components/AINotes*
ls src/components/AIQuiz*
ls src/components/AIDoubt*
```

### 2. Check Imports in AIScreen.js

```javascript
import AIToolsPanel from "../components/AIToolsPanel";
import AINotesGenerator from "../components/AINotesGenerator";
import AIQuizGenerator from "../components/AIQuizGenerator";
import AITranscriber from "../components/AITranscriber";
import AIDoubtSolver from "../components/AIDoubtSolver";
```

### 3. Implement Backend Endpoints

See `BACKEND_AI_TOOLS_API.md` for endpoint specifications

### 4. Set Environment Variables

```env
OPENAI_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here
YOUTUBE_API_KEY=your_key_here
```

---

## 🎨 Key Components

### AIToolsPanel

```javascript
<AIToolsPanel
  onSelectTool={setActiveToolTab}
  activeToolTab={activeToolTab}
  setActiveToolTab={setActiveToolTab}
/>
```

### AINotesGenerator

```javascript
<AINotesGenerator courseId={selectedCourseId} userId={user?.userId} />
```

### AIQuizGenerator

```javascript
<AIQuizGenerator courseId={selectedCourseId} userId={user?.userId} />
```

### AITranscriber

```javascript
<AITranscriber courseId={selectedCourseId} userId={user?.userId} />
```

### AIDoubtSolver

```javascript
<AIDoubtSolver courseId={selectedCourseId} userId={user?.userId} />
```

---

## 📱 Navigation States

### Mobile

```javascript
// In AIScreen state
const [mobileActiveTab, setMobileActiveTab] = useState("sources");
// Options: 'sources', 'chat', 'workspace', 'practice', 'tools'

// In render
{
  mobileActiveTab === "tools" && renderAIToolsSection();
}
```

### Desktop

```javascript
// In AIScreen state
const [workspaceMode, setWorkspaceMode] = useState("chat");
// Options: 'chat', 'studio', 'tools'

// In render
{
  workspaceMode === "chat"
    ? renderGeminiChat()
    : workspaceMode === "studio"
      ? renderWorkspaceSection()
      : renderAIToolsSection();
}
```

---

## 🔌 API Service Methods

### All in aiService.js

```javascript
// 1. Notes Generator
await aiService.generateNotesFromFile({ file, course_id });

// 2. Quiz from File
await aiService.generateQuizFromFile({ file, course_id, num_questions });

// 3. Quiz from Text
await aiService.generateQuizFromText({ text, course_id, num_questions });

// 4. YouTube Transcription
await aiService.transcribeYouTube(youtubeUrl);

// 5. Audio File Transcription
await aiService.transcribeAudioFile(file);

// 6. Doubt Solver
await aiService.solveDoubt({ question, course_id, user_id });
```

---

## 🎯 Response Formats

### Notes Generator Response

```json
{
  "data": {
    "notes": "string",
    "important_points": ["point1", "point2"],
    "summary": "string"
  }
}
```

### Quiz Response

```json
{
  "data": {
    "quiz": [
      {
        "question": "string",
        "options": ["opt1", "opt2", "opt3", "opt4"],
        "correct_answer": "string",
        "correctAnswer": "string (alternative)"
      }
    ]
  }
}
```

### Transcription Response

```json
{
  "data": {
    "transcription": "string",
    "transcript": "string (alternative)"
  }
}
```

### Doubt Solver Response

```json
{
  "data": {
    "answer": "string",
    "explanation": "string (alternative)",
    "reply": "string (alternative)"
  }
}
```

---

## 🛠️ Common Code Patterns

### File Upload Handling

```javascript
const handleFilePick = async () => {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/pdf" /* ... */],
    copyToCacheDirectory: true,
  });
  if (!result.canceled) {
    setSelectedFile(result.assets[0]);
  }
};
```

### FormData Construction

```javascript
const formData = new FormData();
formData.append("file", {
  uri: file.uri,
  name: file.name,
  type: file.mimeType || "application/pdf",
});
formData.append("course_id", courseId.toString());

const response = await api.post("/ai/endpoint", formData, {
  headers: { "Content-Type": "multipart/form-data" },
});
```

### Error Handling

```javascript
try {
  const response = await aiService.methodName({...});
  setResult(response.data || response);
} catch (error) {
  Alert.alert('Error', error.message || 'Operation failed');
}
```

### Loading State

```javascript
const [loading, setLoading] = useState(false);

const handleAction = async () => {
  setLoading(true);
  try {
    // ... action
  } finally {
    setLoading(false);
  }
};
```

---

## 🎨 Colors Used

### Tool Colors

- **Notes:** `#FF6B6B` (Red)
- **Quiz:** `#4ECDC4` (Teal)
- **Transcribe:** `#45B7D1` (Blue)
- **Doubt:** `#FFA500` (Orange)

### UI Colors

- **Primary:** `#6366F1` (Indigo)
- **Success:** `#10B981` (Green)
- **Error:** `#EF4444` (Red)
- **Background:** `#f9f9f9`
- **Dark Background:** `#090D16`

---

## 📝 State Variables in AIScreen

```javascript
// AI Tools specific
const [aiToolMode, setAiToolMode] = useState(false);
const [activeToolTab, setActiveToolTab] = useState("notes");

// Mobile/Desktop
const [mobileActiveTab, setMobileActiveTab] = useState("sources");
const [workspaceMode, setWorkspaceMode] = useState("chat");
```

---

## 🔄 Component Data Flow

```
AIScreen
  ↓
render* functions
  ↓
renderAIToolsSection()
  ↓
AIToolsPanel (Selection)
  ↓
activeToolTab state → determines which component
  ↓
AINotesGenerator/AIQuizGenerator/AITranscriber/AIDoubtSolver
  ↓
aiService methods
  ↓
API endpoints
  ↓
Backend processing
  ↓
Response displayed
```

---

## ✅ Validation Checklist

### Before Production:

- [ ] All imports added to AIScreen.js
- [ ] All 5 component files exist
- [ ] aiService.js has 6 new methods
- [ ] Backend endpoints implemented
- [ ] API responses match expected format
- [ ] Error handling works
- [ ] Mobile navigation has "tools" tab
- [ ] Desktop toggle has "tools" button
- [ ] File uploads work
- [ ] API authentication works
- [ ] Responsive design tested
- [ ] Loading states display
- [ ] Error messages display

---

## 🚀 Testing Commands

### Test Notes Generator

```javascript
const response = await aiService.generateNotesFromFile({
  file: selectedFile,
  course_id: 1,
});
console.log(response);
```

### Test Quiz Generator

```javascript
const response = await aiService.generateQuizFromText({
  text: "sample text",
  course_id: 1,
  num_questions: 3,
});
console.log(response);
```

### Test Doubt Solver

```javascript
const response = await aiService.solveDoubt({
  question: "What is gravity?",
  course_id: 1,
  user_id: 1,
});
console.log(response);
```

---

## 📊 File Sizes to Consider

### Limits (Recommended)

- PDF: Max 50MB
- Audio: Max 100MB
- Video: Max 500MB
- Text: Max 1MB

---

## 🎓 Learning Resources

### Inside the Code:

- See `AINotesGenerator.js` for file handling pattern
- See `AIDoubtSolver.js` for chat pattern
- See `AIQuizGenerator.js` for scoring logic
- See `AITranscriber.js` for URL input pattern

---

## 💡 Common Issues & Solutions

| Issue                      | Solution                                |
| -------------------------- | --------------------------------------- |
| Component not rendering    | Check imports and props                 |
| API calls failing          | Verify endpoint exists and CORS enabled |
| File upload failing        | Check file type validation              |
| Mobile tabs not showing    | Verify mobileActiveTab conditional      |
| Desktop toggle not working | Check workspaceMode state               |
| Styling looks off          | Check if StyleSheet properly imported   |

---

## 🔐 Security Notes

- ✅ All API calls use Bearer token auth
- ✅ File types validated before upload
- ✅ File sizes validated before upload
- ✅ Input sanitized before API calls
- ✅ Error messages don't expose sensitive data

---

## 📈 Performance Tips

1. Use React.memo for expensive components
2. Implement list virtualization for long quizzes
3. Cache transcripts for repeated URLs
4. Use background jobs for large files
5. Implement pagination for results

---

## 🎯 Integration Points

1. **AIScreen.js** - Main screen component
2. **api.js** - API client (already configured)
3. **aiService.js** - Service layer
4. **AuthContext.js** - User auth data
5. **Backend API** - 6 new endpoints required

---

**Last Updated:** May 26, 2026  
**Quick Ref Version:** 1.0  
**Status:** ✅ Ready for Integration
