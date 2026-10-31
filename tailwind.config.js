/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#174B35',    // Primary green
          secondary: '#246B45',  // Secondary green
          charcoal: '#202824',   // Main text charcoal
          muted: '#737B75',      // Secondary text
          bg: '#FFFFFF',         // Main background white
          lightBg: '#F4F6F4',    // Light background
          white: '#FFFFFF',      // White
          warning: '#A52A2A',    // Critical warning red
          surface: '#F4F6F4',    // Clean minimal neutral surface
          border: '#E5E9E5',     // Minimal border #E5E9E5
        },
        // Indian CIBRC toxicity classes (standard statutory colors for labels)
        cibrc: {
          red: '#A52A2A',       // Extremely Toxic
          yellow: '#B45309',    // Highly Toxic
          blue: '#1E40AF',      // Moderately Toxic
          green: '#15803D',     // Slightly Toxic
        }
      },
      fontFamily: {
        sans: [
          '"Noto Sans"',
          '"Noto Sans Devanagari"',
          '"Noto Sans Telugu"',
          '"Noto Sans Kannada"',
          '"Noto Sans Tamil"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif'
        ],
      },
      screens: {
        'xs': '360px',
        'sm': '480px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
      }
    },
  },
  plugins: [],
}

