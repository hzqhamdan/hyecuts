/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        luxury: {
          black: '#000000',
          white: '#FFFFFF',
          slate: '#707070',
          metallic: '#A8A29E', // Muted metallic accent
          earth: '#5C5346',    // Earth-tone alternative
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans: ['"Inter"', 'sans-serif'],
      },
      spacing: {
        'luxury-xs': '0.5rem',
        'luxury-sm': '1rem',
        'luxury-md': '2rem',
        'luxury-lg': '4rem',
        'luxury-xl': '8rem',
      },
    },
  },
  plugins: [],
}
