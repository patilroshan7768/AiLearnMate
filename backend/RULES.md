# AI-LearnMate Enterprise Role Rules & Permissions

This document serves as the absolute single source of truth for the **AI-LearnMate** platform's Role-Based Access Control (RBAC), database role structure, features list, and advanced integrations. All frontend screens, backend controllers, and middleware must strictly adhere to these rules.

---

## 1. Role Definitions & Permissions Matrix

The platform is designed around three main enterprise roles:
1. **Student**: The primary consumer of course content and interactive AI study tools.
2. **Teacher**: The content creator, course administrator, and student progress monitor.
3. **Admin**: The platform owner, supervisor, system settings manager, and security administrator.

### Role Access Matrix

| Feature | Student | Teacher | Admin |
| :--- | :---: | :---: | :---: |
| **View Course Catalog** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Create/Add Course** | ❌ No | ✅ Yes | ✅ Yes |
| **Delete Course** | ❌ No | ⚠️ Own Only | ✅ All |
| **Ingest Sources (Lectures/PDFs)** | ❌ No | ✅ Yes | ✅ Yes |
| **Generate AI Notes/Guides** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Submit Assignments** | ✅ Yes | ❌ No | ❌ No |
| **Evaluate Assignments** | ❌ No | ✅ Yes | ✅ Yes |
| **Create Quizzes** | ❌ No | ✅ Yes | ✅ Yes |
| **Manage Users & Roles** | ❌ No | ❌ No | ✅ Yes |
| **View Analytics** | 📉 Limited (Own) | 📊 Medium (Own Courses) | 📈 Full Platform |
| **API & Token Cost Controls** | ❌ No | ❌ No | ✅ Yes |
| **System Settings** | ❌ No | ❌ No | ✅ Yes |

---

## 2. Component Specifications

### 📂 Student Section
*   **Authentication & Profile**: Self-registration, login/logout, JWT authentication, forgot password with secure email OTP, own profile updates.
*   **Active Dashboard**:
    *   List of enrolled courses with exact progress tracker (%).
    *   Personalized course recommendations (AI-driven).
    *   Upcoming assignment alerts, quiz performance history, and attendance tracking.
    *   Generated AI study items (Notes, Flashcards, Mindmaps, Speech Transcript).
*   **Course Permissions**: Enrolling in courses, viewing lectures, watching recorded video lectures, reading/downloading notes, and accessing syllabus PDFs.
*   **Forbidden Student Operations**:
    *   Cannot edit or delete any course, module, topic, or lecture.
    *   Cannot access private profiles or progress metrics of other students.
    *   Cannot modify teacher-uploaded notes or course assets.
*   **Interactive AI Capabilities**:
    *   Grounded AI chatbot tutor powered by Gemini/GPT to answer questions from active course materials.
    *   One-click summarization, comprehensive study guide generation, interactive 3D front/back flashcards, and practice quiz attempts.
    *   Voice-to-Text notes (powered by Whisper API).
*   **Assignment & Evaluation**:
    *   Submit assignments in allowed file formats (.pdf, etc.) under specified file size limits.
    *   Strict block on submissions after the deadline.
    *   View grades, scores, and downloadable instructor feedback.
*   **Quiz Rules**:
    *   Timer is compulsory.
    *   One attempt limits (optional).
    *   Anti-cheating tab switch detection alerts.
    *   View real-time scores and performance leaderboards.

### 🎓 Teacher Section
*   **Teacher Activation**: Teachers can register but remain **inactive** until explicitly verified and activated by the Platform Admin.
*   **Active Dashboard**:
    *   Total student count, list of active courses, pending assignment submissions, and student performance graphs.
    *   AI reports showcasing average scores, learning patterns, and identifying weak students.
*   **Course Management**:
    *   Create courses, add modules, set prerequisites, upload recorded lectures, syllabus documents, audio files, and PDFs.
    *   Edit and delete courses created by themselves (cannot touch other teachers' courses).
*   **AI Integration & Automation**:
    *   Auto-generate summaries, concept trees (mind maps), and smart MCQ question banks from uploaded lectures/documents (via Gemini/GPT and Whisper speech-to-text conversion).
*   **Monitoring & Evaluation**:
    *   Track student attendance, progress timelines, average scores, and evaluate submitted assignments (auto-grade MCQs and manually grade open-ended answers with feedback).
*   **Communication**:
    *   Send global announcements, answer student doubts, and send course notifications.

### 👑 Admin Section
*   **Admin Dashboard**:
    *   Overview of platform health: total users (teachers/students), active courses, revenue analytics, real-time database usage, and system log monitors.
*   **User & Content Management**:
    *   Add/remove/block teachers and students, verify credentials, reset passwords, and override roles.
    *   Approve courses, review uploaded materials for quality/safety, delete offensive content, and manage course categories/tags.
*   **AI & Security Operations**:
    *   API key rotation, API cost monitoring, rate-limiting control, and Gemini/Whisper usage statistics.
    *   View audit logs, block suspicious IPs, database backup automation, and access control management.

---

## 3. Database Schema Blueprint

### Users Table
*   `id` (Primary Key, UUID)
*   `name` (String, Required)
*   `email` (String, Unique, Required)
*   `password` (String, Hashed, Required)
*   `role` (Enum: 'student', 'teacher', 'admin', Default: 'student')
*   `profile_image` (String, URL)
*   `is_active` (Boolean, Default: true for students, false for teachers)
*   `created_at` (Timestamp)

### Courses Table
*   `course_id` (Primary Key, UUID)
*   `teacher_id` (Foreign Key -> Users.id)
*   `title` (String, Required)
*   `description` (Text)
*   `category` (String)
*   `created_at` (Timestamp)

### Lectures Table
*   `lecture_id` (Primary Key, UUID)
*   `course_id` (Foreign Key -> Courses.course_id)
*   `title` (String)
*   `video_url` (String, Path/URL)
*   `transcript` (Text, Whisper Output)
*   `ai_summary` (Text, Gemini Output)
*   `created_at` (Timestamp)

### Assignments Table
*   `assignment_id` (Primary Key, UUID)
*   `course_id` (Foreign Key -> Courses.course_id)
*   `title` (String)
*   `deadline` (Timestamp)
*   `marks` (Integer)
*   `file_url` (String)

### Quizzes Table
*   `quiz_id` (Primary Key, UUID)
*   `course_id` (Foreign Key -> Courses.course_id)
*   `ai_generated` (Boolean)
*   `timer` (Integer, Minutes)
*   `difficulty` (Enum: 'easy', 'medium', 'hard')
