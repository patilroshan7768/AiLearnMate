import api from './api';

const getAllCourses = async () => {
    try {
        const response = await api.get('/courses');
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Failed to fetch courses');
    }
};

const getCourseById = async (id) => {
    try {
        const response = await api.get(`/courses/${id}`);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Failed to fetch course');
    }
};

const getCourseLectures = async (courseId) => {
    try {
        const response = await api.get(`/courses/${courseId}/lectures`);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Failed to fetch course lectures');
    }
};

const createCourse = async (courseData) => {
    try {
        const isFormData = courseData instanceof FormData;
        const config = {
            headers: {
                // Do not explicitly set Content-Type for FormData; Axios handles the boundary automatically.
                ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
            },
        };

        const response = await api.post('/courses', courseData, config);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Failed to create course');
    }
};

const updateCourse = async (id, courseData) => {
    try {
        const response = await api.put(`/courses/${id}`, courseData);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Failed to update course');
    }
};

const deleteCourse = async (id) => {
    try {
        const response = await api.delete(`/courses/${id}`);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Failed to delete course');
    }
};

const enrollInCourse = async (courseData) => {
    try {
        const response = await api.post('/my-learning/add', courseData);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Failed to enroll in course');
    }
};

const searchYouTube = async (query) => {
    try {
        const response = await api.get(`/courses/search/youtube?q=${encodeURIComponent(query)}`);
        return response.data;
    } catch (error) {
        // Log but throw to let component handle fallback
        console.error("Backend Search Error:", error);
        throw error;
    }
};

const generateStudyMaterial = async (url) => {
    try {
        const response = await api.post('/ai/study-material', { url });
        return response.data;
    } catch (error) {
        console.error("AI Generation Error:", error);
        throw error.response ? error.response.data : new Error('Failed to generate AI material');
    }
};

const getLectureStudyMaterial = async (lectureId) => {
    try {
        const response = await api.get(`/courses/lectures/${lectureId}/study-material`);
        return response.data;
    } catch (error) {
        console.error("Fetch Lecture Study Material Error:", error);
        throw error.response ? error.response.data : new Error('Failed to fetch lecture study material');
    }
};

export default {
    getAllCourses,
    getCourseById,
    getCourseLectures,
    createCourse,
    updateCourse,
    deleteCourse,
    enrollInCourse,
    searchYouTube,
    generateStudyMaterial,
    getLectureStudyMaterial,
};
