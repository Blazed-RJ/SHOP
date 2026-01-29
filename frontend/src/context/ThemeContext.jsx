import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    const [brandColor, setBrandColor] = useState('#3b82f6'); // Default blue

    useEffect(() => {
        // Apply brand color to CSS variable
        document.documentElement.style.setProperty('--brand-color', brandColor);
    }, [brandColor]);

    const updateBrandColor = (color) => {
        setBrandColor(color);
        document.documentElement.style.setProperty('--brand-color', color);
    };

    const value = {
        brandColor,
        setBrandColor: updateBrandColor,
    };

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
