/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#00D9FF',
          dark: '#00A8CC',
          light: '#66ECFF',
        },
        secondary: {
          DEFAULT: '#FF006E',
          dark: '#BB0050',
          light: '#FF4D99',
        },
        success: '#06D6A0',
        warning: '#FFB703',
        danger: '#E63946',
        info: '#457B9D',
        bg: {
          dark: '#0A0E27',
          light: '#F7F9FB',
          surface: '#1A1F3A',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#B0B8C1',
        },
        border: '#2C3E50',
      },
      fontFamily: {
        sans: ['Geist', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      animation: {
        'pulse-neon': 'pulse-neon 2s ease-in-out infinite alternate',
        'bounce-glow': 'bounce-glow 1s ease-in-out',
      },
      keyframes: {
        'pulse-neon': {
          'from': { textShadow: '0 0 5px #00D9FF, 0 0 10px #00D9FF, 0 0 15px #00D9FF' },
          'to': { textShadow: '0 0 10px #00D9FF, 0 0 20px #00D9FF, 0 0 30px #00D9FF' },
        },
        'bounce-glow': {
          '0%, 100%': { transform: 'scale(1)', boxShadow: '0 0 20px rgba(0, 217, 255, 0.5)' },
          '50%': { transform: 'scale(1.05)', boxShadow: '0 0 40px rgba(0, 217, 255, 0.8)' },
        },
      },
    },
  },
  plugins: [],
}