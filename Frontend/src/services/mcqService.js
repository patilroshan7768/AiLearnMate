/**
 * mcqService.js — MCQ Test Management Service
 * Handles MCQ creation, submission, marking, and result retrieval
 */

import api from './api';

/**
 * Fetch all MCQ tests for a specific course
 */
const getMCQTestsByCourse = async (courseId) => {
    try {
        const response = await api.get(`/mcq/course/${courseId}`);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Failed to fetch MCQ tests');
    }
};

/**
 * Get detailed MCQ test with all questions
 */
const getMCQTest = async (testId) => {
    try {
        const response = await api.get(`/mcq/${testId}`);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Failed to fetch MCQ test');
    }
};

/**
 * Submit MCQ test answers
 * Expected answers format:
 * {
 *   testId: string,
 *   answers: [
 *     { questionId: string, selectedOptions: [string], timeSpent: number }
 *   ]
 * }
 */
const submitMCQTest = async (submissionData) => {
    try {
        const response = await api.post('/mcq/submit', submissionData);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Failed to submit MCQ test');
    }
};

/**
 * Get MCQ test results for the current student
 */
const getStudentMCQResult = async (testId) => {
    try {
        const response = await api.get(`/mcq/${testId}/result`);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Failed to fetch MCQ result');
    }
};

/**
 * Get all student submissions for a specific MCQ test (Teacher view)
 */
const getAllMCQSubmissions = async (testId) => {
    try {
        const response = await api.get(`/mcq/${testId}/submissions`);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Failed to fetch MCQ submissions');
    }
};

/**
 * Create a new MCQ test (Teacher only)
 */
const createMCQTest = async (testData) => {
    try {
        const response = await api.post('/mcq/create', testData);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Failed to create MCQ test');
    }
};

/**
 * Update MCQ test (Teacher only)
 */
const updateMCQTest = async (testId, testData) => {
    try {
        const response = await api.put(`/mcq/${testId}`, testData);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Failed to update MCQ test');
    }
};

/**
 * Delete MCQ test (Teacher only)
 */
const deleteMCQTest = async (testId) => {
    try {
        const response = await api.delete(`/mcq/${testId}`);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Failed to delete MCQ test');
    }
};

/**
 * Get student MCQ submissions (all tests for a course)
 */
const getStudentMCQSubmissions = async (courseId) => {
    try {
        const response = await api.get(`/mcq/course/${courseId}/submissions`);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Failed to fetch student MCQ submissions');
    }
};

export default {
    getMCQTestsByCourse,
    getMCQTest,
    submitMCQTest,
    getStudentMCQResult,
    getAllMCQSubmissions,
    createMCQTest,
    updateMCQTest,
    deleteMCQTest,
    getStudentMCQSubmissions,
};
