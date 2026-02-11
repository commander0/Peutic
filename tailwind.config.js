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
                display: ['Outfit', 'sans-serif'],
                body: ['Inter', 'sans-serif'],
            },
        },
    },
    plugins: [],
    darkMode: 'class', // Enable class-based dark mode
}
