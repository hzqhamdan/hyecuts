/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        studio: {
          black: '#1A1A1A',
          white: '#FAFAFA',
          slate: '#6B6B6B',
          gold: '#B8A070',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans: ['"Inter"', 'sans-serif'],
      },
      letterSpacing: {
        studio: '0.06em',
      },
      spacing: {
        '12': '3rem', // 48px vertical rhythm minimum base
      },
    },
  },
  plugins: [],
}