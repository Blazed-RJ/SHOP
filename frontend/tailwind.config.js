import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                brand: {
                    50: 'rgba(var(--brand-color-rgb, 59, 130, 246), 0.05)',
                    100: 'rgba(var(--brand-color-rgb, 59, 130, 246), 0.1)',
                    200: 'rgba(var(--brand-color-rgb, 59, 130, 246), 0.2)',
                    300: 'rgba(var(--brand-color-rgb, 59, 130, 246), 0.3)',
                    400: 'rgba(var(--brand-color-rgb, 59, 130, 246), 0.6)',
                    500: 'var(--brand-color, #3b82f6)',
                    600: 'var(--brand-color, #2563eb)',
                    700: 'var(--brand-color, #1d4ed8)',
                    800: 'var(--brand-color, #1e40af)',
                    900: 'var(--brand-color, #1e3a8a)',
                },
                // Build dynamic theme system by overriding blue
                blue: {
                    50: 'rgba(var(--theme-color-rgb, 37, 99, 235), 0.05)',
                    100: 'rgba(var(--theme-color-rgb, 37, 99, 235), 0.1)',
                    200: 'rgba(var(--theme-color-rgb, 37, 99, 235), 0.2)',
                    300: 'rgba(var(--theme-color-rgb, 37, 99, 235), 0.3)',
                    400: 'rgba(var(--theme-color-rgb, 37, 99, 235), 0.6)',
                    500: 'var(--theme-color, #3b82f6)',
                    600: 'var(--theme-color, #2563eb)',
                    700: 'var(--theme-color, #1d4ed8)',
                    800: 'var(--theme-color, #1e40af)',
                    900: 'var(--theme-color, #1e3a8a)',
                },
            },
            fontFamily: {
                mono: ['Courier New', 'monospace'], // For numbers/prices
            },
        },
    },
    plugins: [
        forms,
    ],
}
