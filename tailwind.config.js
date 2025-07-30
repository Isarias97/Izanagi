/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#002A8F',
        secondary: '#CF142B',
        accent: '#FFFFFF',
        success: '#4caf50',
        danger: '#f44336',
        warning: '#ff9800',
        'dark-bg': '#002A8F',
        'dark-card': 'rgba(0, 42, 143, 0.7)',
        'light-text': '#FFFFFF',
      },
      boxShadow: {
        '3d': '0 10px 20px 0 rgba(0,42,143,0.25), 0 2px 4px 0 rgba(207,20,43,0.15)',
        '3d-card': '0 8px 24px 0 rgba(0,42,143,0.18), 0 1.5px 4px 0 rgba(207,20,43,0.12)',
      },
      backgroundImage: {
        'cuban-gradient': 'linear-gradient(135deg, #002A8F 0%, #CF142B 100%)',
      },
      borderColor: {
        'cuban-blue': '#002A8F',
        'cuban-red': '#CF142B',
      },
    },
  },
  plugins: [],
} 