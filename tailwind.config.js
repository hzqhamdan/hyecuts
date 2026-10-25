/** @type {import('tailwindcss').Config} */

// Colours come from src/styles/tokens.css, which is generated from the Hyecuts Studio
// design system. Each entry reads that file's RGB triple so Tailwind's alpha modifiers
// (`bg-gold/10`, `border-ink/20`) keep working, and so a token changes in one place.
const token = (name) => `rgb(var(--${name}-rgb) / <alpha-value>)`;

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
          black: token('studio-black'),
          white: token('studio-white'),
          slate: token('studio-slate'),
          gold: token('studio-gold'),
        },
        gold: {
          DEFAULT: token('studio-gold'),
          tint: token('gold-tint'),
        },
        surface: {
          page: token('surface-page'),
          card: token('surface-card'),
          sunken: token('surface-sunken'),
        },
        ink: {
          DEFAULT: token('ink'),
          muted: token('ink-muted'),
          faint: token('ink-faint'),
          inverse: token('ink-inverse'),
        },
        hairline: {
          DEFAULT: 'var(--hairline)',
          strong: token('hairline-strong'),
        },
        interactive: {
          DEFAULT: token('interactive'),
          hover: token('interactive-hover'),
        },
        success: {
          DEFAULT: token('status-success'),
          ground: token('status-success-ground'),
        },
        danger: {
          DEFAULT: token('status-danger'),
          ground: token('status-danger-ground'),
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        studio: '0.06em',
      },
      spacing: {
        '12': '3rem', // 48px vertical rhythm minimum base
      },
      boxShadow: {
        overlay: 'var(--shadow-overlay)',
      },
    },
  },
  plugins: [],
}
