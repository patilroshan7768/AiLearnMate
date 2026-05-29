import api from './api';

const getRecommendations = async (userId) => {
    try {
        const response = await api.get(`/recommendations/${userId}`);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Failed to fetch recommendations');
    }
};

export default {
    getRecommendations,
};
