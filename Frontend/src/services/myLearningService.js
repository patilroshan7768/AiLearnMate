/**
 * myLearningService.js — Central data layer for the My Learning dashboard.
 * Manages enrolled courses, watch progress, favorites, streaks, deadlines.
 * Uses AsyncStorage for local persistence (backend-ready interface).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
    ENROLLED_COURSES: 'ml_enrolled_courses',
    WATCH_HISTORY: 'ml_watch_history',
    FAVORITES: 'ml_favorites',
    RECENTLY_VIEWED: 'ml_recently_viewed',
    STREAK_DATA: 'ml_streak_data',
    DEADLINES: 'ml_deadlines',
    LECTURE_PROGRESS: 'ml_lecture_progress',
    BOOKMARKS: 'ml_bookmarks',
    DOWNLOAD_QUEUE: 'ml_download_queue',
};

// ─── MOCK DATA ─────────────────────────────────────────────────────────────────
const MOCK_COURSES = [
    {
        id: 'course_1',
        title: 'Complete Python Masterclass 2025',
        teacher: 'Dr. Sarah Mitchell',
        thumbnail: 'https://img.youtube.com/vi/rfscVS0vtbw/maxresdefault.jpg',
        category: 'Programming',
        totalLectures: 42,
        duration: '28h 30m',
        progress: 68,
        lastWatchedLecture: { id: 'lec_28', title: 'Decorators & Generators', position: 754 },
        completionStatus: 'in_progress',
        enrolledAt: '2025-12-15T10:00:00Z',
        deadlines: [
            { id: 'd1', title: 'Assignment 3: OOP Concepts', date: '2026-05-28T23:59:00Z', type: 'assignment' },
            { id: 'd2', title: 'Quiz: Data Structures', date: '2026-05-30T18:00:00Z', type: 'quiz' },
        ],
        lectures: [
            { id: 'lec_1', title: 'Introduction to Python', duration: '12:30', completed: true, videoUrl: 'https://www.youtube.com/watch?v=rfscVS0vtbw' },
            { id: 'lec_2', title: 'Variables & Data Types', duration: '18:45', completed: true, videoUrl: 'https://www.youtube.com/watch?v=rfscVS0vtbw' },
            { id: 'lec_3', title: 'Control Flow Statements', duration: '22:15', completed: true, videoUrl: 'https://www.youtube.com/watch?v=rfscVS0vtbw' },
            { id: 'lec_4', title: 'Functions & Scope', duration: '25:00', completed: true, videoUrl: 'https://www.youtube.com/watch?v=rfscVS0vtbw' },
            { id: 'lec_5', title: 'Lists & Tuples', duration: '20:30', completed: true, videoUrl: 'https://www.youtube.com/watch?v=rfscVS0vtbw' },
            { id: 'lec_6', title: 'Dictionaries & Sets', duration: '19:00', completed: true, videoUrl: 'https://www.youtube.com/watch?v=rfscVS0vtbw' },
            { id: 'lec_7', title: 'String Manipulation', duration: '16:45', completed: true, videoUrl: 'https://www.youtube.com/watch?v=rfscVS0vtbw' },
            { id: 'lec_8', title: 'File Handling', duration: '21:30', completed: true, videoUrl: 'https://www.youtube.com/watch?v=rfscVS0vtbw' },
            { id: 'lec_9', title: 'Error Handling & Exceptions', duration: '18:00', completed: true, videoUrl: 'https://www.youtube.com/watch?v=rfscVS0vtbw' },
            { id: 'lec_10', title: 'OOP Fundamentals', duration: '30:00', completed: true, videoUrl: 'https://www.youtube.com/watch?v=rfscVS0vtbw' },
            { id: 'lec_28', title: 'Decorators & Generators', duration: '28:00', completed: false, videoUrl: 'https://www.youtube.com/watch?v=rfscVS0vtbw' },
            { id: 'lec_29', title: 'Context Managers', duration: '15:00', completed: false, videoUrl: 'https://www.youtube.com/watch?v=rfscVS0vtbw' },
        ],
        notes: [
            { id: 'n1', title: 'Python Basics Cheat Sheet', url: 'https://example.com/python-basics.pdf', bookmarked: true },
            { id: 'n2', title: 'OOP Design Patterns', url: 'https://example.com/oop-patterns.pdf', bookmarked: false },
            { id: 'n3', title: 'Data Structures Reference', url: 'https://example.com/ds-ref.pdf', bookmarked: false },
        ],
        assignments: [
            { id: 'a1', title: 'Assignment 1: Variables & Loops', deadline: '2026-01-15T23:59:00Z', marks: 100, status: 'graded', score: 92, feedback: 'Excellent work!' },
            { id: 'a2', title: 'Assignment 2: Functions', deadline: '2026-02-01T23:59:00Z', marks: 100, status: 'graded', score: 88, feedback: 'Good, but can improve recursion.' },
            { id: 'a3', title: 'Assignment 3: OOP Concepts', deadline: '2026-05-28T23:59:00Z', marks: 100, status: 'pending', score: null, feedback: null },
        ],
        quizzes: [
            { id: 'q1', title: 'Quiz: Python Basics', questions: 20, duration: 30, status: 'completed', score: 85, maxScore: 100, difficulty: 'easy' },
            { id: 'q2', title: 'Quiz: Data Structures', questions: 15, duration: 25, status: 'available', score: null, maxScore: 100, difficulty: 'medium' },
        ],
        resources: [
            { id: 'r1', name: 'Python Source Code Examples', type: 'zip', size: '2.4 MB', category: 'Code' },
            { id: 'r2', name: 'Week 1-4 Slides', type: 'ppt', size: '12 MB', category: 'PPTs' },
            { id: 'r3', name: 'Python Cheat Sheet', type: 'pdf', size: '450 KB', category: 'Cheat Sheets' },
            { id: 'r4', name: 'Practice Datasets', type: 'zip', size: '8.1 MB', category: 'Datasets' },
        ],
        liveClasses: [
            { id: 'lc1', title: 'Doubt Session: OOP', date: '2026-05-27T16:00:00Z', duration: '60 min', meetUrl: 'https://meet.google.com/abc-defg-hij', status: 'upcoming' },
            { id: 'lc2', title: 'Revision: Modules & Packages', date: '2026-05-20T16:00:00Z', duration: '45 min', meetUrl: null, status: 'completed', recordingUrl: 'https://example.com/recording1' },
        ],
        discussions: [
            { id: 'disc1', author: 'Rahul Sharma', avatar: null, role: 'student', text: 'Can anyone explain the difference between @staticmethod and @classmethod?', timestamp: '2026-05-24T10:30:00Z', likes: 12, replies: [
                { id: 'r1', author: 'Dr. Sarah Mitchell', role: 'teacher', text: '@staticmethod doesn\'t receive any automatic first argument. @classmethod receives the class (cls) as first argument. Use @classmethod when you need to access the class itself.', timestamp: '2026-05-24T11:00:00Z', likes: 24 }
            ]},
            { id: 'disc2', author: 'Priya Patel', avatar: null, role: 'student', text: 'Lecture 28 on generators was amazing! The yield keyword finally makes sense.', timestamp: '2026-05-23T14:20:00Z', likes: 8, replies: [] },
        ],
    },
    {
        id: 'course_2',
        title: 'React Native — Build 10 Apps',
        teacher: 'James Rodriguez',
        thumbnail: 'https://img.youtube.com/vi/0-S5a0eXPoc/maxresdefault.jpg',
        category: 'Mobile Dev',
        totalLectures: 85,
        duration: '52h 15m',
        progress: 34,
        lastWatchedLecture: { id: 'lec_rn_29', title: 'Navigation with React Navigation', position: 320 },
        completionStatus: 'in_progress',
        enrolledAt: '2026-01-20T10:00:00Z',
        deadlines: [
            { id: 'd3', title: 'Project 3: Weather App', date: '2026-06-02T23:59:00Z', type: 'assignment' },
        ],
        lectures: [
            { id: 'lec_rn_1', title: 'Getting Started with Expo', duration: '15:00', completed: true, videoUrl: 'https://www.youtube.com/watch?v=0-S5a0eXPoc' },
            { id: 'lec_rn_2', title: 'JSX & Components', duration: '20:00', completed: true, videoUrl: 'https://www.youtube.com/watch?v=0-S5a0eXPoc' },
            { id: 'lec_rn_3', title: 'State & Props', duration: '25:00', completed: true, videoUrl: 'https://www.youtube.com/watch?v=0-S5a0eXPoc' },
            { id: 'lec_rn_29', title: 'Navigation with React Navigation', duration: '30:00', completed: false, videoUrl: 'https://www.youtube.com/watch?v=0-S5a0eXPoc' },
            { id: 'lec_rn_30', title: 'API Integration with Axios', duration: '28:00', completed: false, videoUrl: 'https://www.youtube.com/watch?v=0-S5a0eXPoc' },
        ],
        notes: [
            { id: 'rn_n1', title: 'React Native CLI vs Expo', url: 'https://example.com/rn-cli.pdf', bookmarked: false },
        ],
        assignments: [
            { id: 'rn_a1', title: 'Project 1: Todo App', deadline: '2026-03-01T23:59:00Z', marks: 100, status: 'graded', score: 95, feedback: 'Perfect implementation!' },
            { id: 'rn_a2', title: 'Project 3: Weather App', deadline: '2026-06-02T23:59:00Z', marks: 100, status: 'pending', score: null, feedback: null },
        ],
        quizzes: [
            { id: 'rn_q1', title: 'Quiz: React Fundamentals', questions: 25, duration: 35, status: 'completed', score: 92, maxScore: 100, difficulty: 'medium' },
        ],
        resources: [
            { id: 'rn_r1', name: 'Starter Templates', type: 'zip', size: '5.2 MB', category: 'Code' },
        ],
        liveClasses: [],
        discussions: [],
    },
    {
        id: 'course_3',
        title: 'Machine Learning A-Z: From Zero to Hero',
        teacher: 'Prof. Elena Vasquez',
        thumbnail: 'https://img.youtube.com/vi/GwIo3gDZCVQ/maxresdefault.jpg',
        category: 'AI / ML',
        totalLectures: 120,
        duration: '78h 00m',
        progress: 12,
        lastWatchedLecture: { id: 'lec_ml_14', title: 'Linear Regression Deep Dive', position: 180 },
        completionStatus: 'in_progress',
        enrolledAt: '2026-04-01T10:00:00Z',
        deadlines: [],
        lectures: [
            { id: 'lec_ml_1', title: 'What is Machine Learning?', duration: '18:00', completed: true, videoUrl: 'https://www.youtube.com/watch?v=GwIo3gDZCVQ' },
            { id: 'lec_ml_2', title: 'Types of ML', duration: '22:00', completed: true, videoUrl: 'https://www.youtube.com/watch?v=GwIo3gDZCVQ' },
            { id: 'lec_ml_14', title: 'Linear Regression Deep Dive', duration: '35:00', completed: false, videoUrl: 'https://www.youtube.com/watch?v=GwIo3gDZCVQ' },
        ],
        notes: [],
        assignments: [],
        quizzes: [],
        resources: [],
        liveClasses: [],
        discussions: [],
    },
    {
        id: 'course_4',
        title: 'Full Stack Web Development Bootcamp',
        teacher: 'Angela Yu',
        thumbnail: 'https://img.youtube.com/vi/nu_pCVPKzTk/maxresdefault.jpg',
        category: 'Web Dev',
        totalLectures: 65,
        duration: '45h 20m',
        progress: 100,
        lastWatchedLecture: { id: 'lec_web_65', title: 'Deployment & DevOps', position: 0 },
        completionStatus: 'completed',
        enrolledAt: '2025-08-10T10:00:00Z',
        deadlines: [],
        lectures: [
            { id: 'lec_web_1', title: 'HTML Fundamentals', duration: '30:00', completed: true, videoUrl: 'https://www.youtube.com/watch?v=nu_pCVPKzTk' },
            { id: 'lec_web_65', title: 'Deployment & DevOps', duration: '40:00', completed: true, videoUrl: 'https://www.youtube.com/watch?v=nu_pCVPKzTk' },
        ],
        notes: [],
        assignments: [],
        quizzes: [],
        resources: [],
        liveClasses: [],
        discussions: [],
    },
    {
        id: 'course_5',
        title: 'Data Structures & Algorithms in Java',
        teacher: 'Kunal Kushwaha',
        thumbnail: 'https://img.youtube.com/vi/rZ41y93P2Qo/maxresdefault.jpg',
        category: 'DSA',
        totalLectures: 95,
        duration: '62h 10m',
        progress: 45,
        lastWatchedLecture: { id: 'lec_dsa_43', title: 'Binary Trees — Traversals', position: 520 },
        completionStatus: 'in_progress',
        enrolledAt: '2026-02-05T10:00:00Z',
        deadlines: [
            { id: 'd4', title: 'Coding Challenge: Trees', date: '2026-05-29T23:59:00Z', type: 'assignment' },
        ],
        lectures: [
            { id: 'lec_dsa_1', title: 'Introduction to DSA', duration: '15:00', completed: true, videoUrl: 'https://www.youtube.com/watch?v=rZ41y93P2Qo' },
            { id: 'lec_dsa_43', title: 'Binary Trees — Traversals', duration: '40:00', completed: false, videoUrl: 'https://www.youtube.com/watch?v=rZ41y93P2Qo' },
        ],
        notes: [
            { id: 'dsa_n1', title: 'Big-O Cheat Sheet', url: 'https://example.com/bigo.pdf', bookmarked: true },
        ],
        assignments: [
            { id: 'dsa_a1', title: 'Coding Challenge: Trees', deadline: '2026-05-29T23:59:00Z', marks: 50, status: 'pending', score: null, feedback: null },
        ],
        quizzes: [],
        resources: [
            { id: 'dsa_r1', name: 'Practice Problem Set', type: 'pdf', size: '1.2 MB', category: 'Cheat Sheets' },
        ],
        liveClasses: [],
        discussions: [],
    },
];

// ─── ENROLLED COURSES ──────────────────────────────────────────────────────────
const getEnrolledCourses = async () => {
    try {
        // Return mock data for now (replace with API call when backend is ready)
        return MOCK_COURSES;
    } catch (error) {
        console.error('Error fetching enrolled courses:', error);
        return [];
    }
};

const getCourseById = async (courseId) => {
    try {
        const courses = await getEnrolledCourses();
        return courses.find(c => c.id === courseId) || null;
    } catch (error) {
        console.error('Error fetching course:', error);
        return null;
    }
};

// ─── WATCH PROGRESS ────────────────────────────────────────────────────────────
const updateWatchProgress = async (courseId, lectureId, position, totalDuration) => {
    try {
        const stored = await AsyncStorage.getItem(KEYS.LECTURE_PROGRESS);
        const progress = stored ? JSON.parse(stored) : {};
        const key = `${courseId}_${lectureId}`;
        progress[key] = { courseId, lectureId, position, totalDuration, updatedAt: new Date().toISOString() };
        await AsyncStorage.setItem(KEYS.LECTURE_PROGRESS, JSON.stringify(progress));
        return progress[key];
    } catch (error) {
        console.error('Error updating watch progress:', error);
    }
};

const getWatchProgress = async (courseId, lectureId) => {
    try {
        const stored = await AsyncStorage.getItem(KEYS.LECTURE_PROGRESS);
        const progress = stored ? JSON.parse(stored) : {};
        return progress[`${courseId}_${lectureId}`] || null;
    } catch (error) {
        return null;
    }
};

const getLastWatched = async (courseId) => {
    try {
        const stored = await AsyncStorage.getItem(KEYS.WATCH_HISTORY);
        const history = stored ? JSON.parse(stored) : {};
        return history[courseId] || null;
    } catch (error) {
        return null;
    }
};

const setLastWatched = async (courseId, lectureId, lectureTitle, position) => {
    try {
        const stored = await AsyncStorage.getItem(KEYS.WATCH_HISTORY);
        const history = stored ? JSON.parse(stored) : {};
        history[courseId] = { lectureId, lectureTitle, position, timestamp: new Date().toISOString() };
        await AsyncStorage.setItem(KEYS.WATCH_HISTORY, JSON.stringify(history));
    } catch (error) {
        console.error('Error setting last watched:', error);
    }
};

// ─── FAVORITES ─────────────────────────────────────────────────────────────────
const toggleFavorite = async (courseId) => {
    try {
        const stored = await AsyncStorage.getItem(KEYS.FAVORITES);
        let favorites = stored ? JSON.parse(stored) : [];
        if (favorites.includes(courseId)) {
            favorites = favorites.filter(id => id !== courseId);
        } else {
            favorites.push(courseId);
        }
        await AsyncStorage.setItem(KEYS.FAVORITES, JSON.stringify(favorites));
        return favorites;
    } catch (error) {
        console.error('Error toggling favorite:', error);
        return [];
    }
};

const getFavorites = async () => {
    try {
        const stored = await AsyncStorage.getItem(KEYS.FAVORITES);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        return [];
    }
};

const isFavorite = async (courseId) => {
    const favorites = await getFavorites();
    return favorites.includes(courseId);
};

// ─── RECENTLY VIEWED ───────────────────────────────────────────────────────────
const addToRecentlyViewed = async (courseId) => {
    try {
        const stored = await AsyncStorage.getItem(KEYS.RECENTLY_VIEWED);
        let recent = stored ? JSON.parse(stored) : [];
        recent = recent.filter(id => id !== courseId);
        recent.unshift(courseId);
        if (recent.length > 10) recent = recent.slice(0, 10);
        await AsyncStorage.setItem(KEYS.RECENTLY_VIEWED, JSON.stringify(recent));
    } catch (error) {
        console.error('Error adding to recently viewed:', error);
    }
};

const getRecentlyViewed = async () => {
    try {
        const stored = await AsyncStorage.getItem(KEYS.RECENTLY_VIEWED);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        return [];
    }
};

// ─── DAILY STREAK ──────────────────────────────────────────────────────────────
const getDailyStreak = async () => {
    try {
        const stored = await AsyncStorage.getItem(KEYS.STREAK_DATA);
        if (!stored) return { count: 0, lastDate: null, weekActivity: [false, false, false, false, false, false, false] };
        return JSON.parse(stored);
    } catch (error) {
        return { count: 0, lastDate: null, weekActivity: [false, false, false, false, false, false, false] };
    }
};

const updateStreak = async () => {
    try {
        const streak = await getDailyStreak();
        const today = new Date().toISOString().split('T')[0];

        if (streak.lastDate === today) return streak; // Already updated today

        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        let newCount = streak.lastDate === yesterday ? streak.count + 1 : 1;

        // Update week activity
        const dayIndex = new Date().getDay();
        const weekActivity = streak.weekActivity || [false, false, false, false, false, false, false];
        weekActivity[dayIndex] = true;

        // Reset week on Monday
        if (dayIndex === 1 && streak.lastDate !== yesterday) {
            weekActivity.fill(false);
            weekActivity[1] = true;
        }

        const newStreak = { count: newCount, lastDate: today, weekActivity };
        await AsyncStorage.setItem(KEYS.STREAK_DATA, JSON.stringify(newStreak));
        return newStreak;
    } catch (error) {
        console.error('Error updating streak:', error);
        return { count: 0, lastDate: null, weekActivity: [false, false, false, false, false, false, false] };
    }
};

// ─── DEADLINES ─────────────────────────────────────────────────────────────────
const getUpcomingDeadlines = async () => {
    try {
        const courses = await getEnrolledCourses();
        const now = new Date();
        const deadlines = [];
        courses.forEach(course => {
            (course.deadlines || []).forEach(d => {
                const deadlineDate = new Date(d.date);
                if (deadlineDate > now) {
                    deadlines.push({ ...d, courseName: course.title, courseId: course.id });
                }
            });
        });
        deadlines.sort((a, b) => new Date(a.date) - new Date(b.date));
        return deadlines;
    } catch (error) {
        console.error('Error fetching deadlines:', error);
        return [];
    }
};

// ─── BOOKMARKS ─────────────────────────────────────────────────────────────────
const toggleBookmark = async (courseId, lectureId) => {
    try {
        const stored = await AsyncStorage.getItem(KEYS.BOOKMARKS);
        let bookmarks = stored ? JSON.parse(stored) : [];
        const key = `${courseId}_${lectureId}`;
        if (bookmarks.includes(key)) {
            bookmarks = bookmarks.filter(b => b !== key);
        } else {
            bookmarks.push(key);
        }
        await AsyncStorage.setItem(KEYS.BOOKMARKS, JSON.stringify(bookmarks));
        return bookmarks;
    } catch (error) {
        return [];
    }
};

const isBookmarked = async (courseId, lectureId) => {
    try {
        const stored = await AsyncStorage.getItem(KEYS.BOOKMARKS);
        const bookmarks = stored ? JSON.parse(stored) : [];
        return bookmarks.includes(`${courseId}_${lectureId}`);
    } catch (error) {
        return false;
    }
};

export default {
    getEnrolledCourses,
    getCourseById,
    updateWatchProgress,
    getWatchProgress,
    getLastWatched,
    setLastWatched,
    toggleFavorite,
    getFavorites,
    isFavorite,
    addToRecentlyViewed,
    getRecentlyViewed,
    getDailyStreak,
    updateStreak,
    getUpcomingDeadlines,
    toggleBookmark,
    isBookmarked,
    MOCK_COURSES,
};
