/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./contexts/**/*.{js,ts,jsx,tsx}",
        "./*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "var(--color-primary)",
                "primary-light": "var(--color-primary-light)",
                "primary-border": "var(--color-primary-border)",
                base: "var(--color-bg-base)",
                "text-base": "var(--color-text-base)",
            },
            fontFamily: {
                sans: ['Outfit', 'sans-serif'],
            },
            boxShadow: {
                'inner-glow': 'inset 0 0 20px rgba(250, 204, 21, 0.15)',
                'premium': '0 20px 40px -15px rgba(0, 0, 0, 0.05)',
                'premium-hover': '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
                'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.05)',
                'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
            },
        },
    },
    plugins: [],
    darkMode: 'class', // Enable class-based dark mode
}
