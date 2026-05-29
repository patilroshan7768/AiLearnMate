import api from './api';

const getAllLogs = async () => {
    try {
        const response = await api.get('/logs');
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Failed to fetch logs');
    }
};

export default {
    getAllLogs,
};
