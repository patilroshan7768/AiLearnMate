# 🎓 AI LearnMate — AI-Powered Smart Learning Platform

<p align="center">
  <img src="./assets/icon.png" alt="AI LearnMate Logo" width="120" />
</p>

<p align="center">
  <strong>An AI-powered cross-platform learning application built using React Native, Expo, Node.js, Express.js, and PostgreSQL.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React_Native-0.81.5-61DAFB?logo=react" />
  <img src="https://img.shields.io/badge/Expo-SDK_54-000020?logo=expo" />
  <img src="https://img.shields.io/badge/Node.js-Backend-green?logo=node.js" />
  <img src="https://img.shields.io/badge/PostgreSQL-Database-blue?logo=postgresql" />
  <img src="https://img.shields.io/badge/Platform-Android%20%7C%20iOS%20%7C%20Web-brightgreen" />
</p>

---

# 📚 Table of Contents

- About
- Features
- Tech Stack
- Project Structure
- Installation
- Environment Variables
- Running the Project
- API Endpoints
- AI Features
- Authentication
- Screens
- Future Improvements
- License

---

# 🚀 About

AI LearnMate is a modern AI-powered learning management platform designed for students and educators.

The platform combines:
- Learning Management System (LMS)
- AI-based study tools
- Course management
- Quiz generation
- AI summaries
- AI doubt solving
- YouTube transcript extraction
- PDF learning support

The application is built using:
- React Native + Expo (Frontend)
- Node.js + Express.js (Backend)
- PostgreSQL (Database)

The app supports:
- Android
- iOS
- Web

---

# ✨ Features

## 🔐 Authentication System
- User Registration
- Login System
- JWT Authentication
- Forgot Password
- OTP Verification
- Protected Routes

---

## 📚 Learning Features
- Browse Courses
- Create Courses
- Enroll in Courses
- Video Learning
- PDF Viewer
- Assignment System
- Discussion Forum
- Learning Progress Tracking
- Streak Tracking

---

## 🤖 AI Features

### 📝 AI Notes Generator
Generate structured study notes from:
- PDF files
- YouTube videos

---

### ❓ AI Quiz Generator
Automatically generates MCQ quizzes from learning materials.

Features:
- Instant grading
- Score tracking
- Question generation

---

### 🎙️ AI Transcriber
Converts:
- Audio → Text
- Video → Text

---

### 💬 AI Doubt Solver
Context-aware chatbot that answers questions from uploaded material.

---

### 📋 AI Summary Generator
Creates concise summaries with key takeaways.

---

# 🛠️ Tech Stack

## Frontend
| Technology | Purpose |
|------------|---------|
| React Native | Cross-platform mobile app |
| Expo | Development & build system |
| React Navigation | Navigation |
| Axios | API calls |
| AsyncStorage | Local storage |
| Expo AV | Video/audio support |
| React Native WebView | PDF viewing |

---

## Backend
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime |
| Express.js | Backend framework |
| PostgreSQL | Database |
| Sequelize | ORM |
| JWT | Authentication |
| bcrypt | Password hashing |
| Swagger | API documentation |

---

# 📁 Project Structure

```bash
AI_LearnMate/
│
├── frontend/
│   ├── assets/
│   ├── src/
│   │   ├── components/
│   │   ├── screens/
│   │   ├── services/
│   │   ├── navigation/
│   │   ├── context/
│   │   └── utils/
│   ├── App.js
│   ├── app.json
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── utils/
│   │   └── services/
│   ├── server.js
│   ├── package.json
│   └── .env
│
└── README.md
```

---

# ⚙️ Installation

## 1️⃣ Clone Repository

```bash
git clone https://github.com/your-username/AI_LearnMate.git
cd AI_LearnMate
```

---

# 📱 Frontend Setup

```bash
cd frontend
npm install
```

### Run Frontend

```bash
npm start
```

### Run on Android

```bash
npm run android
```

### Run on Web

```bash
npm run web
```

---

# 🖥️ Backend Setup

```bash
cd backend
npm install
```

---

# 🗄️ PostgreSQL Database Setup

Create database:

```sql
CREATE DATABASE ai_learnmate;
```

---

# 🔑 Environment Variables

Create `.env` inside backend folder:

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai_learnmate
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:8081
```

---

# ▶️ Run Backend

```bash
npm run dev
```

OR

```bash
npm start
```

---

# 📚 API Documentation

After running backend:

## Swagger Documentation
```bash
http://localhost:3000/api-docs
```

## Health Check
```bash
http://localhost:3000/health
```

---

# 🔌 API Endpoints

# Authentication

| Method | Endpoint | Description |
|--------|-----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/profile` | Get profile |

---

# Courses

| Method | Endpoint |
|--------|-----------|
| POST | `/api/courses` |
| GET | `/api/courses` |
| GET | `/api/courses/:id` |
| PUT | `/api/courses/:id` |
| DELETE | `/api/courses/:id` |

---

# AI Module

| Method | Endpoint |
|--------|-----------|
| POST | `/api/ai/summarize` |
| POST | `/api/ai/quiz` |
| POST | `/api/ai/transcribe` |
| POST | `/api/ai/doubt-solver` |

---

# Recommendations

| Method | Endpoint |
|--------|-----------|
| GET | `/api/recommendations/:userId` |

---

# 🔐 Authentication

Protected routes require JWT token:

```bash
Authorization: Bearer your_jwt_token
```

---

# 📱 Main Screens

- Login Screen
- Register Screen
- Home Screen
- Courses Screen
- AI Tools Screen
- Quiz Screen
- My Learning Screen
- Profile Screen
- Admin Dashboard
- PDF Viewer
- Video Player

---

# 🤖 AI Workflow

```text
Upload PDF / YouTube URL
        ↓
AI Processing
        ↓
Generate Notes
Generate Quiz
Generate Summary
Enable Doubt Solver
        ↓
Display Results
```

---

# 🎨 UI Features

- Responsive Design
- Modern UI
- Smooth Animations
- Skeleton Loaders
- Progress Rings
- Drag & Drop Upload
- Student-Friendly Dashboard

---

# 🔮 Future Improvements

- GPT-4 Integration
- Whisper API Integration
- AI Recommendations
- Real-time Chat
- Push Notifications
- Cloud Storage
- File Upload Optimization
- Admin Analytics Dashboard

---

# Final Note

AI LearnMate is a complete AI-integrated smart learning platform combining modern education systems with artificial intelligence tools to improve the student learning experience.