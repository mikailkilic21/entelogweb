/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Radical Finance Palette
                // Backgrounds
                background: '#020617', // slate-950
                surface: '#0f172a',    // slate-900
                'surface-highlight': '#1e293b', // slate-800

                // Borders
                border: '#334155',     // slate-700

                // Primary Action (Money, Growth)
                primary: {
                    DEFAULT: '#10b981', // emerald-500
                    hover: '#059669',   // emerald-600
                    soft: 'rgba(16, 185, 129, 0.1)',
                },

                // Secondary/Alert (Movement)
                secondary: {
                    DEFAULT: '#f59e0b', // amber-500
                    hover: '#d97706',   // amber-600
                    soft: 'rgba(245, 158, 11, 0.1)',
                },

                // Text
                'text-primary': '#f8fafc',   // slate-50
                'text-secondary': '#94a3b8', // slate-400
            },
            borderRadius: {
                // Brutalist / Sharp
                DEFAULT: '2px',
                'sm': '1px',
                'md': '4px',
                'lg': '6px',
                'xl': '8px',
                '2xl': '12px',
            },
            fontFamily: {
                // Financial Data feel
                mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', "Liberation Mono", "Courier New", 'monospace'],
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            animation: {
                'fade-in': 'fadeIn 0.4s ease-out',
                'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)', // Spring-ish
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
            },
        },
    },
    plugins: [],
}
