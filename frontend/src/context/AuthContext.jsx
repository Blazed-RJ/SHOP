/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        return (storedUser && token) ? JSON.parse(storedUser) : null;
    });
    const [loading] = useState(false);

    const login = async (username, password, deviceId) => {
        try {
            const { data } = await api.post('/auth/login', { username, password, deviceId });

            if (data.requireOtp) {
                return {
                    success: true,
                    requireOtp: true,
                    userId: data.userId,
                    emailMasked: data.emailMasked
                };
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data));
            setUser(data);

            return { success: true, user: data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || error.message || 'Login failed. Check if backend is running.'
            };
        }
    };

    const verifyOTP = async (userId, otp, deviceId) => {
        try {
            const { data } = await api.post('/auth/verify-otp', { userId, otp, deviceId });

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data));
            setUser(data);

            return { success: true, user: data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || error.message || 'Verification failed.'
            };
        }
    };

    const googleLogin = async (token) => {
        try {
            const { data } = await api.post('/auth/google', { token });

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data));
            setUser(data);

            return { success: true, user: data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || error.message || 'Google Login failed.'
            };
        }
    };

    const register = async (name, username, email, password, shopCode) => {
        try {
            const { data } = await api.post('/auth/register', {
                name,
                username,
                email,
                password,
                shopCode
            });

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data));
            setUser(data);

            return { success: true, user: data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || error.message || 'Registration failed. Check if backend is running.'
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    const isAdmin = () => {
        return user?.role === 'Admin';
    };

    const isStaff = () => {
        return user?.role === 'Staff';
    };

    const value = {
        user,
        loading,
        login,
        verifyOTP,
        googleLogin,
        register,
        logout,
        isAdmin,
        isStaff,
        isAuthenticated: !!user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
