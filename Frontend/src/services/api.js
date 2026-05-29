import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// For Web, use localhost. For Mobile (Physical/Emulator), use the local network IP.
// Based on your logs, your IP is 192.168.43.252
const DEV_IP = '10.211.137.212';

const BASE_URL = Platform.OS === 'web'
    ? 'http://localhost:3000/api'
    : `http://${DEV_IP}:3000/api`;



const api = axios.create({
    baseURL: BASE_URL,
    timeout: 120000, // 120 second (2 minutes) timeout for AI/Gemini processing
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor to add Authorization header
api.interceptors.request.use(
    async (config) => {
        try {
            console.log(`[API Request] ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
            const token = await AsyncStorage.getItem('userToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('Error fetching token', error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => {
        console.log(`[API Response] ${response.status} ${response.config.url}`);
        return response;
    },
    (error) => {
        console.error('[API Error]', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
        return Promise.reject(error);
    }
);

export { BASE_URL };
export default api;
