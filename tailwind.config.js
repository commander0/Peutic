/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./App.tsx",
        "./index.tsx"
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Manrope', 'sans-serif'],
            },
            colors: {
                peutic: {
                    yellow: 'var(--color-primary)', // Dynamic Brand Color
                    black: '#0A0A0A',
                }
            },
            animation: {
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'spin-slow': 'spin 12s linear infinite',
                'in': 'in 0.5s ease-out',
                'fade-in': 'fade-in 0.5s ease-out',
                'slide-up-fade': 'slide-up-fade 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                'breathing': 'breathing 6s ease-in-out infinite',
                'float': 'float 6s ease-in-out infinite',
                'shimmer': 'shimmer 2.5s linear infinite',
                'aura-glow': 'aura-glow 4s ease-in-out infinite',
            },
            boxShadow: {
                'inner-glow': 'inset 0 0 20px rgba(250, 204, 21, 0.15)',
                'premium-alt': '0 20px 40px -15px rgba(0, 0, 0, 0.3)',
            },
            keyframes: {
                'aura-glow': {
                    '0%, 100%': { transform: 'scale(1)', opacity: '0.3' },
                    '50%': { transform: 'scale(1.1)', opacity: '0.6' }
                },
                in: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' }
                },
                'fade-in': {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' }
                },
                'slide-up-fade': {
                    '0%': { opacity: '0', transform: 'translateY(4rem)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' }
                },
                'breathing': {
                    '0%, 100%': { transform: 'scale(1)', filter: 'brightness(1)' },
                    '50%': { transform: 'scale(1.01)', filter: 'brightness(1.02)' }
                },
                'float': {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-6px)' }
                },
                'shimmer': {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' }
                }
            }
        },
    },
    plugins: [],
}
