import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [userToken, setUserToken] = useState(null);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load user from storage on boot
    useEffect(() => {
        const loadUser = async () => {
            try {
                const token = await AsyncStorage.getItem('userToken');
                const storedUser = await AsyncStorage.getItem('user');

                if (token && storedUser) {
                    setUserToken(token);
                    setUser(JSON.parse(storedUser));
                }
            } catch (error) {
                console.error('Failed to load user', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadUser();
    }, []);

    const login = async (email, password) => {
        setIsLoading(true);
        try {
            const data = await authService.login(email, password);

            console.log('--- LOGIN DEBUG ---');
            console.log('Received Data:', JSON.stringify(data, null, 2));

            // Support multiple token key names and nested structures
            // Backend sends: { success: true, data: { token: "...", user: { ... } } }
            const responseData = data.data || data;
            const token = responseData.token || responseData.accessToken || responseData.access_token;

            if (token) {
                console.log('Token found:', token.substring(0, 15) + '...');
                setUserToken(token);
                // Also handle user object if it exists
                const userData = responseData.user || responseData.userData || { email };
                setUser(userData);

                await AsyncStorage.setItem('userToken', token);
                await AsyncStorage.setItem('user', JSON.stringify(userData));
            } else {
                console.error('CRITICAL: Login successful (200 OK) but NO TOKEN found in response.');
                alert('Login successful but server sent no token. Check console logs.');
            }
            return data;
        } catch (error) {
            console.error('Login error in context', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (userData) => {
        setIsLoading(true);
        try {
            const data = await authService.register(userData);
            const responseData = data.data || data;

            // If result contains token, log them in
            if (responseData.token) {
                setUserToken(responseData.token);
                // Ensure we have the user object
                let userObj = responseData.user || responseData.userData;

                // FORCE ROLE UPDATE: If backend ignored the role (returned student default),
                // but we registered as 'admin' or 'teacher', trust the client side for this sessions.
                if (userData.role) {
                    // console.log(`Forcing role to ${userData.role} (Backend sent: ${userObj?.role})`);
                    userObj = { ...userObj, role: userData.role };
                }

                setUser(userObj);

                await AsyncStorage.setItem('userToken', responseData.token);
                if (userObj) {
                    await AsyncStorage.setItem('user', JSON.stringify(userObj));
                }
            }
            return data;
        } catch (error) {
            //  console.error('Register error in context', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setIsLoading(true);
        try {
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('user');
            setUserToken(null);
            setUser(null);
        } catch (error) {
            console.error('Logout error', error);
        } finally {
            setIsLoading(false);
        }
    };

    const sendOtp = async (email) => {
        return await authService.sendOtp(email);
    };

    return (
        <AuthContext.Provider value={{
            userToken,
            user,
            isLoading,
            login,
            register,
            logout,
            sendOtp
        }}>
            {children}
        </AuthContext.Provider>
    );
};
