/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#1E1E2E',
        surface: '#252540',
        primary: '#4D96FF',
        secondary: '#A45EE5',
        alert: '#FF6B6B',
        textMain: '#E0E0E0',
        textMuted: '#A0A0C0',
      },
      fontFamily: {
        mono: ['Fira Code', 'monospace'],
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}