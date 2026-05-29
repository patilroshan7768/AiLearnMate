import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
    COMPLETED_COURSES: 'completed_courses',
    QUIZ_SCORES: 'quiz_scores',
    ENROLLED_COURSES: 'enrolled_courses' // New Key
};

// Add course to "My Learning"
const markCourseEnrolled = async (courseId) => {
    try {
        const stored = await AsyncStorage.getItem(KEYS.ENROLLED_COURSES);
        const enrolled = stored ? JSON.parse(stored) : [];
        if (!enrolled.includes(courseId)) {
            enrolled.push(courseId);
            await AsyncStorage.setItem(KEYS.ENROLLED_COURSES, JSON.stringify(enrolled));
        }
        return enrolled;
    } catch (error) {
        console.error('Error enrolling course:', error);
        return [];
    }
};

const getEnrolledCourses = async () => {
    try {
        const stored = await AsyncStorage.getItem(KEYS.ENROLLED_COURSES);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        return [];
    }
};

const clearEnrolledCourses = async () => {
    try {
        await AsyncStorage.removeItem(KEYS.ENROLLED_COURSES);
        return [];
    } catch (error) {
        console.error('Error clearing enrolled courses:', error);
        return [];
    }
};

// Add a completed course ID
const markCourseComplete = async (courseId) => {
    try {
        const stored = await AsyncStorage.getItem(KEYS.COMPLETED_COURSES);
        const completed = stored ? JSON.parse(stored) : [];
        if (!completed.includes(courseId)) {
            completed.push(courseId);
            await AsyncStorage.setItem(KEYS.COMPLETED_COURSES, JSON.stringify(completed));
        }
        return completed;
    } catch (error) {
        console.error('Error marking course complete:', error);
        return [];
    }
};

// ... (keep quiz functions and getStats same) ...

const saveQuizScore = async (courseId, score) => {
    try {
        const stored = await AsyncStorage.getItem(KEYS.QUIZ_SCORES);
        const scores = stored ? JSON.parse(stored) : [];
        scores.push({ courseId, score, date: new Date().toISOString() });
        await AsyncStorage.setItem(KEYS.QUIZ_SCORES, JSON.stringify(scores));
        return scores;
    } catch (error) {
        console.error('Error saving quiz score:', error);
        return [];
    }
};

const getStats = async () => {
    try {
        const [complStr, scoresStr] = await Promise.all([
            AsyncStorage.getItem(KEYS.COMPLETED_COURSES),
            AsyncStorage.getItem(KEYS.QUIZ_SCORES)
        ]);

        const completed = complStr ? JSON.parse(complStr) : [];
        const scores = scoresStr ? JSON.parse(scoresStr) : [];

        let totalScore = 0;
        scores.forEach(s => totalScore += s.score);
        const avgScore = scores.length > 0 ? Math.round(totalScore / scores.length) : 0;

        return {
            completedCount: completed.length,
            avgScore: avgScore,
            totalQuizzes: scores.length
        };
    } catch (error) {
        console.error('Error getting stats:', error);
        return { completedCount: 0, avgScore: 0, totalQuizzes: 0 };
    }
};

const isCourseComplete = async (courseId) => {
    try {
        const stored = await AsyncStorage.getItem(KEYS.COMPLETED_COURSES);
        const completed = stored ? JSON.parse(stored) : [];
        return completed.includes(courseId);
    } catch (error) {
        return false;
    }
};

export default {
    markCourseComplete,
    saveQuizScore,
    getStats,
    isCourseComplete,
    markCourseEnrolled, // Exported
    getEnrolledCourses, // Exported
    clearEnrolledCourses // Exported
};
