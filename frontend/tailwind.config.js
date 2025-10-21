// frontend/tailwind.config.js
const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        brand: {
          DEFAULT: '#cde77f',
          light: '#dff09e',
          dark: '#bada55',
        },
        gray: {
          50: '#F7F7F7',   // Light background
          100: '#EBEBEB', // Light borders
          200: '#DDDDDD',
          500: '#717171', // Body text
          700: '#484848',
          800: '#222222', // Headings
        },
        // Dark mode colors (if needed, but we will focus on light mode first)
        dark: {
          bg: '#1a1a1a',
          card: '#2a2a2a',
          text: '#EBEBEB',
        }
      }
    },
  },
  plugins: [],
}