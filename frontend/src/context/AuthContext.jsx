import React, { createContext, useContext, useState, useEffect } from 'react';
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
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Load user from localStorage on mount
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (storedUser && token) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        try {
            const { data } = await api.post('/auth/login', { username, password });

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data));
            setUser(data);

            return { success: true, user: data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Login failed'
            };
        }
    };

    const register = async (name, username, password, shopCode) => {
        try {
            const { data } = await api.post('/auth/register', {
                name,
                username,
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
                error: error.response?.data?.message || 'Registration failed'
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
        register,
        logout,
        isAdmin,
        isStaff,
        isAuthenticated: !!user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
