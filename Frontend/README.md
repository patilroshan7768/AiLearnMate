# 🎓 Adiraj — AI-Powered Learning Platform

<p align="center">
  <img src="./assets/icon.png" alt="Adiraj Logo" width="120" />
</p>

<p align="center">
  <strong>A modern, cross-platform educational app built with React Native & Expo</strong><br/>
  <em>Android • iOS • Web — Learn smarter with AI-powered tools</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React_Native-0.81.5-61DAFB?logo=react" />
  <img src="https://img.shields.io/badge/Expo-SDK_54-000020?logo=expo" />
  <img src="https://img.shields.io/badge/Platform-Android%20%7C%20iOS%20%7C%20Web-brightgreen" />
  <img src="https://img.shields.io/badge/Version-1.0.0-blue" />
</p>

---

## 📋 Table of Contents

- [About](#-about)
- [Features](#-features)
- [Screenshots](#-screenshots)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Available Scripts](#-available-scripts)
- [Screens & Navigation](#-screens--navigation)
- [AI Tools](#-ai-tools)
- [API Services](#-api-services)
- [Components](#-components)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🚀 About

**Adiraj** is a full-featured AI-powered learning platform designed for students and educators. The app provides a complete learning management system (LMS) with integrated AI tools that auto-generate notes, quizzes, summaries, and provide a contextual doubt solver — all from uploaded PDFs or YouTube URLs.

Built with **React Native** and **Expo**, the app runs natively on **Android**, **iOS**, and **Web** from a single codebase.

---

## ✨ Features

### 🏠 Core Platform
| Feature | Description |
|---------|-------------|
| **User Authentication** | Login, Register, Forgot Password with OTP verification |
| **Course Management** | Browse, explore, create, and manage courses |
| **My Learning** | Track enrolled courses, progress, streaks, and achievements |
| **Video Player** | In-app video player for course content |
| **PDF Viewer** | Built-in PDF viewer for reading materials |
| **Assignments** | Create, submit, and track assignments |
| **Discussions** | Course-wise discussion forum |
| **Admin Dashboard** | Admin panel for course & user management |
| **Profile & Settings** | User profile management and app settings |

### 🤖 AI-Powered Learning Tools
| Tool | Description |
|------|-------------|
| **📝 AI Notes Generator** | Upload PDF or paste YouTube URL → auto-generates structured study notes |
| **❓ AI Quiz Generator** | Auto-creates MCQ quizzes from study material with instant grading |
| **🎙️ AI Transcriber** | Converts audio/video content to text transcripts |
| **💬 AI Doubt Solver** | Context-aware chatbot that answers questions based on uploaded material |
| **📋 AI Summary** | Generates concise summaries with key takeaways |
| **📤 Upload Learning Material** | Dual-card upload interface for YouTube URLs and PDF files |

### 🎨 UI/UX
- ✅ Modern, clean student-friendly design
- ✅ Light theme with white cards and soft shadows
- ✅ Responsive layout (mobile + desktop/web)
- ✅ Smooth animations and transitions
- ✅ Skeleton loading states
- ✅ Progress rings and streak cards
- ✅ Drag & drop file upload (web)

---

## 🖼️ Screenshots

> Screenshots can be added in the `assets/screenshots/` folder.

| Home Screen | AI Tools | My Learning | Course Content |
|-------------|----------|-------------|----------------|
| Coming Soon | Coming Soon | Coming Soon | Coming Soon |

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **React Native** | 0.81.5 | Cross-platform UI framework |
| **Expo** | SDK 54 | Build & development toolchain |
| **React** | 19.1.0 | UI component library |
| **React Navigation** | 7.x | Screen navigation (stack + tabs) |
| **Axios** | 1.13.2 | HTTP client for API calls |
| **AsyncStorage** | 2.2.0 | Local persistent storage |
| **Expo AV** | 16.x | Audio/Video playback |
| **Expo Document Picker** | 14.x | File selection |
| **Expo File System** | 19.x | File read/write operations |
| **Expo Linear Gradient** | 15.x | Gradient backgrounds |
| **React Native WebView** | 13.x | Embedded web content / PDF viewer |
| **React Native Web** | 0.21.0 | Web platform support |

### Backend (External API)
- RESTful API server (separate repository)
- AI/ML services for notes, quiz, summary generation
- YouTube transcript extraction
- User auth with JWT tokens

---

## 📁 Project Structure

```
adiraj/
├── App.js                          # Root app entry point
├── index.js                        # App registry
├── app.json                        # Expo configuration
├── package.json                    # Dependencies & scripts
│
├── assets/                         # Static assets
│   ├── icon.png                    # App icon
│   ├── splash-icon.png             # Splash screen
│   ├── adaptive-icon.png           # Android adaptive icon
│   └── favicon.png                 # Web favicon
│
└── src/                            # Source code
    ├── context/                    # React Context providers
    │   └── AuthContext.js          # Authentication state management
    │
    ├── navigation/                 # Navigation configuration
    │   └── AppNavigator.js         # Stack + Tab navigator setup
    │
    ├── screens/                    # Application screens (18)
    │   ├── HomeScreen.js           # Dashboard / home page
    │   ├── LoginScreen.js          # Login & registration
    │   ├── ForgotPasswordScreen.js # Password recovery with OTP
    │   ├── ProfileScreen.js        # User profile
    │   ├── SettingsScreen.js       # App settings
    │   ├── CoursesScreen.js        # Course listing
    │   ├── ExploreCoursesScreen.js  # Browse & discover courses
    │   ├── CourseDetailScreen.js   # Course detail view
    │   ├── CourseContentScreen.js  # Course content player
    │   ├── CreateCourseScreen.js   # Course creation (admin/teacher)
    │   ├── MyLearningScreen.js     # Enrolled courses & progress
    │   ├── AIScreen.js             # AI Tools hub page
    │   ├── QuizScreen.js           # Quiz taking interface
    │   ├── AssignmentsScreen.js    # Assignment management
    │   ├── DiscussionScreen.js     # Discussion forum
    │   ├── VideoPlayerScreen.js    # Video player
    │   ├── PDFViewerScreen.js      # PDF document viewer
    │   └── AdminDashboardScreen.js # Admin management panel
    │
    ├── components/                 # Reusable UI components (14)
    │   ├── UploadLearningMaterial.js # YouTube URL + PDF upload cards
    │   ├── AIToolsPanel.js         # AI tool tab selector
    │   ├── EnhancedAIToolsPanel.js # Enhanced tool selector UI
    │   ├── AINotesGenerator.js     # Notes generation component
    │   ├── AIQuizGenerator.js      # Quiz generation + grading
    │   ├── AITranscriber.js        # Audio/video transcription
    │   ├── AIDoubtSolver.js        # Contextual Q&A chatbot
    │   ├── AIFileManager.js        # File management for AI tools
    │   ├── FileUploadBox.js        # Generic file upload component
    │   ├── CourseCard.js           # Course display card
    │   ├── MyLearningCard.js       # Learning progress card
    │   ├── StreakCard.js           # Learning streak tracker
    │   ├── ProgressRing.js         # Circular progress indicator
    │   └── SkeletonLoader.js       # Loading placeholder UI
    │
    └── services/                   # API service modules (10)
        ├── api.js                  # Base Axios instance & config
        ├── authService.js          # Login, register, token management
        ├── courseService.js        # Course CRUD operations
        ├── aiService.js            # AI tools API calls
        ├── youtubeService.js       # YouTube data & transcript APIs
        ├── mcqService.js           # Quiz/MCQ API calls
        ├── myLearningService.js    # Learning progress & enrollment
        ├── progressService.js      # Progress tracking
        ├── logsService.js          # Activity logging
        └── recommendationsService.js # Course recommendations
```

---

## 🏁 Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **npm** or **yarn**
- **Expo CLI** (comes with `npx`)
- **Android Studio** (for Android emulator) or **Xcode** (for iOS simulator)
- OR just a **web browser** for web mode

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/adiraj.git
cd adiraj

# 2. Install dependencies
npm install

# 3. Start the development server
npm start
```

### Running on Devices

```bash
# Web browser
npm run web

# Android (emulator or connected device)
npm run android

# iOS (macOS only, requires Xcode)
npm run ios
```

---

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo development server |
| `npm run android` | Run on Android emulator/device |
| `npm run ios` | Run on iOS simulator (macOS only) |
| `npm run web` | Run in web browser |

---

## 🗺️ Screens & Navigation

### Navigation Flow

```
┌─────────────────────────────────────────────┐
│               App Navigator                  │
├─────────────────────────────────────────────┤
│                                             │
│  Auth Stack (unauthenticated)               │
│  ├── LoginScreen                            │
│  └── ForgotPasswordScreen                   │
│                                             │
│  Main Tab Navigator (authenticated)         │
│  ├── 🏠 Home Tab                            │
│  │   ├── HomeScreen                         │
│  │   ├── CourseDetailScreen                 │
│  │   ├── CourseContentScreen                │
│  │   ├── VideoPlayerScreen                  │
│  │   └── PDFViewerScreen                    │
│  │                                          │
│  ├── 📚 Courses Tab                         │
│  │   ├── CoursesScreen                      │
│  │   ├── ExploreCoursesScreen               │
│  │   └── CreateCourseScreen                 │
│  │                                          │
│  ├── 📖 My Learning Tab                     │
│  │   └── MyLearningScreen                   │
│  │                                          │
│  ├── 🤖 AI Tools Tab                        │
│  │   ├── AIScreen                           │
│  │   └── QuizScreen                         │
│  │                                          │
│  └── 👤 Profile Tab                         │
│      ├── ProfileScreen                      │
│      ├── SettingsScreen                     │
│      └── AdminDashboardScreen               │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 🤖 AI Tools

The AI Tools section is the highlight of the app. It provides:

### Upload Learning Material
Two side-by-side upload cards:

| YouTube URL Card | PDF Upload Card |
|-----------------|-----------------|
| Paste any YouTube video/playlist URL | Drag & drop or browse PDF files |
| Auto-fetches transcript | Shows file preview with name & size |
| Red "Analyze Video" button | Purple "Generate AI Notes" button |
| Feature checklist with green checkmarks | Remove file option |

### After Upload — Auto-Generated Content

```
Upload PDF / YouTube URL
         │
         ▼
   ┌───────────┐
   │ Processing │  ← Progress bar animation (3s)
   │  Overlay   │  ← Step-by-step status text
   └─────┬─────┘
         ▼
   ┌───────────┐
   │  Success!  │  ← View Notes / Take Quiz / Upload Another
   └─────┬─────┘
         ▼
   ┌──────────────────────────────────────┐
   │  📝 AI Notes    — Structured notes   │
   │  ❓ AI Quiz     — 5 MCQ questions     │
   │  📋 AI Summary  — Key takeaways      │
   │  💬 Doubt Solver — Contextual Q&A    │
   └──────────────────────────────────────┘
```

---

## 🔌 API Services

| Service | File | Endpoints |
|---------|------|-----------|
| **Auth** | `authService.js` | Login, Register, Token refresh |
| **Courses** | `courseService.js` | CRUD courses, enrollment |
| **AI** | `aiService.js` | Notes generation, quiz creation, doubt solving |
| **YouTube** | `youtubeService.js` | Search, transcript extraction |
| **MCQ** | `mcqService.js` | Quiz CRUD, submission, grading |
| **My Learning** | `myLearningService.js` | Progress tracking, streaks |
| **Progress** | `progressService.js` | Completion tracking |
| **Logs** | `logsService.js` | Activity logging |
| **Recommendations** | `recommendationsService.js` | Course suggestions |

### API Base Configuration

The API base URL is configured in `src/services/api.js`. Update it to point to your backend server.

---

## 🧩 Components

| Component | Description |
|-----------|-------------|
| `UploadLearningMaterial` | Dual-card YouTube + PDF upload with progress & success states |
| `AIToolsPanel` | Horizontal scrollable tool tab selector |
| `EnhancedAIToolsPanel` | Enhanced version with richer tool card UI |
| `AINotesGenerator` | Notes generation interface with download option |
| `AIQuizGenerator` | Quiz display with option selection and instant grading |
| `AITranscriber` | Audio/video to text transcription interface |
| `AIDoubtSolver` | Chat-based contextual Q&A with step-by-step answers |
| `AIFileManager` | File management for uploaded study materials |
| `FileUploadBox` | Generic file upload with drag & drop support |
| `CourseCard` | Course display card with thumbnail, progress, and details |
| `MyLearningCard` | Enrolled course card with progress ring |
| `StreakCard` | Daily learning streak tracker with fire animation |
| `ProgressRing` | Circular SVG-based progress indicator |
| `SkeletonLoader` | Animated placeholder while content loads |

---

## 🔧 Configuration

### Environment Variables

Update the following in `src/services/api.js`:

```javascript
const API_BASE_URL = "http://your-backend-server.com/api";
```

### App Configuration

Edit `app.json` to customize:
- App name and slug
- Icons and splash screen
- Platform-specific settings

---

## 📱 Platform Support

| Platform | Status | Notes |
|----------|--------|-------|
| 🌐 **Web** | ✅ Fully Supported | Drag & drop, responsive layout |
| 🤖 **Android** | ✅ Fully Supported | Native feel, adaptive icons |
| 🍎 **iOS** | ✅ Fully Supported | Requires macOS + Xcode for building |

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is private and proprietary.

---

## 👨‍💻 Author

**Adiraj Team**

---

<p align="center">
  Built with ❤️ using React Native & Expo<br/>
  <strong>Adiraj — Learn Smarter with AI</strong>
</p>
