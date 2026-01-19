
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        industrial: {
          900: '#f3f4f6', 
          800: '#ffffff', 
          700: '#e5e7eb', 
          600: '#d1d5db', 
        },
        brand: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24', 
          500: '#f59e0b', 
          600: '#d97706', 
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          copper: '#b45309', 
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
