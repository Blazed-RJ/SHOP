import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const SettingsContext = createContext();

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within SettingsProvider');
    }
    return context;
};

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);

    const refreshSettings = async () => {
        try {
            const { data } = await api.get('/settings');
            setSettings(data);


            if (data.brandColor) setThemeVars('--brand-color', data.brandColor);
            if (data.themeColor) setThemeVars('--theme-color', data.themeColor);

            setLoading(false);
        } catch (error) {
            console.error('Failed to load settings (Full Error):', error.response || error);
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshSettings();
    }, []);

    const updateSettings = async (newSettings) => {
        try {
            const { data } = await api.put('/settings', newSettings);
            setSettings(data);


            if (data.brandColor) setThemeVars('--brand-color', data.brandColor);
            if (data.themeColor) setThemeVars('--theme-color', data.themeColor);

            return { success: true, data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to update settings'
            };
        }
    };

    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'system');
    const [effectiveTheme, setEffectiveTheme] = useState('light');

    // Handle Theme Change
    useEffect(() => {
        const root = document.documentElement;
        localStorage.setItem('theme', theme);

        const applyTheme = (isDark) => {
            if (isDark) {
                root.classList.add('dark');
                root.setAttribute('data-theme', 'dark');
                setEffectiveTheme('dark');
            } else {
                root.classList.remove('dark');
                root.setAttribute('data-theme', 'light');
                setEffectiveTheme('light');
            }
        };

        if (theme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            applyTheme(mediaQuery.matches);

            const handleChange = (e) => applyTheme(e.matches);
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        } else {
            applyTheme(theme === 'dark');
        }
    }, [theme]);

    const toggleTheme = () => {
        // Cycle: Light -> Dark -> System -> Light
        const modes = ['light', 'dark', 'system'];
        const nextIndex = (modes.indexOf(theme) + 1) % modes.length;
        setTheme(modes[nextIndex]);
    };

    const value = {
        settings: settings || {
            storeName: 'My Store',
            currency: 'INR',
            address: '',
            phone: '',
            email: '',
            gstin: ''
        }, // Fallback to avoid null
        loading,
        refreshSettings,
        updateSettings,
        theme,
        effectiveTheme,
        toggleTheme
    };

    return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

// Helper: Set both hex and rgb variables for opacity support
const setThemeVars = (name, hex) => {
    document.documentElement.style.setProperty(name, hex);

    // Convert hex to rgb
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    document.documentElement.style.setProperty(`${name}-rgb`, `${r}, ${g}, ${b}`);
};
