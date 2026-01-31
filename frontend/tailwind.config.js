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
                    50: '#F9F4E0',
                    100: '#F0E6C2',
                    200: '#E1CC87',
                    300: '#D2B24C',
                    400: '#C39A20', // Gold/Copper
                    500: 'var(--brand-color, #D4AF37)', // Primary Gold
                    600: 'var(--brand-secondary, #B8860B)', // Dark Goldenrod
                    700: '#8A6508',
                    800: '#5C4305',
                    900: '#2E2202',
                    glow: 'var(--brand-glow)',
                },
                // Override blue to be gold/copper for instant theme switch
                blue: {
                    50: '#F9F4E0',
                    100: '#F0E6C2',
                    200: '#E1CC87',
                    300: '#D2B24C',
                    400: '#C39A20',
                    500: 'var(--brand-color, #D4AF37)',
                    600: 'var(--brand-secondary, #B8860B)',
                    700: '#8A6508',
                    800: '#5C4305',
                    900: '#2E2202',
                },
                gray: {
                    850: '#1A1A1A',
                    900: '#121212', // Material Dark
                    950: '#050505', // Deep Black
                }
            },
            fontFamily: {
                sans: ['Inter', 'ui-sans-serif', 'system-ui'],
                mono: ['Courier New', 'monospace'],
            },
            boxShadow: {
                'gold': '0 4px 14px 0 rgba(212, 175, 55, 0.39)',
                'gold-lg': '0 10px 30px -3px rgba(212, 175, 55, 0.4)',
            }
        },
    },
    plugins: [
        forms,
    ],
}
