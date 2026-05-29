import api from './api';

const login = async (email, password) => {
    try {
        const response = await api.post('/auth/login', { email, password });
        return response.data;
    } catch (error) {
        const customError = new Error(error.response?.data?.message || 'Login failed');
        customError.status = error.response?.status;
        customError.data = error.response?.data;
        throw customError;
    }
};

const register = async (userData) => {
    try {
        const response = await api.post('/auth/register', userData);
        return response.data;
    } catch (error) {
        const customError = new Error(error.response?.data?.message || 'Registration failed');
        customError.status = error.response?.status;
        customError.data = error.response?.data;
        throw customError;
    }
};

const getProfile = async () => {
    try {
        const response = await api.get('/auth/profile');
        return response.data;
    } catch (error) {
        const customError = new Error(error.response?.data?.message || 'Failed to fetch profile');
        customError.status = error.response?.status;
        throw customError;
    }
};

const sendOtp = async (email) => {
    try {
        const response = await api.post('/auth/send-otp', { email });
        return response.data;
    } catch (error) {
        const customError = new Error(error.response?.data?.message || 'Failed to send OTP');
        customError.status = error.response?.status;
        throw customError;
    }
};

const resetPassword = async (email, otp, newPassword) => {
    try {
        const response = await api.post('/auth/reset-password', { email, otp, newPassword });
        return response.data;
    } catch (error) {
        const customError = new Error(error.response?.data?.message || 'Failed to reset password');
        customError.status = error.response?.status;
        throw customError;
    }
};

export default {
    login,
    register,
    getProfile,
    sendOtp,
    resetPassword,
};
