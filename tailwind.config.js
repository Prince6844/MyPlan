/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#1479F5',
          600: '#0d65d4',
          700: '#0952b0',
          800: '#0b448e',
          900: '#0e3975',
          DEFAULT: '#1479F5',
        },
        surface: {
          light: '#F8FAFC',
          card: '#FFFFFF',
          dark: '#0F172A',
          darkCard: '#1E293B',
          darkBorder: '#334155'
        }
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(20, 121, 245, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        'float': '0 10px 30px -4px rgba(20, 121, 245, 0.25)',
        'modal': '0 20px 40px -8px rgba(0, 0, 0, 0.25)'
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease-out',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-subtle': 'pulseSubtle 2s infinite ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSubtle: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.02)' },
        }
      }
    },
  },
  plugins: [],
}
