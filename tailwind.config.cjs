/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}", // scans your React files
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2196F3',
        secondary: '#FF9800',
        success: '#4CAF50',
        warning: '#FF9800',
        error: '#F44336',
        info: '#2196F3',
        background: '#F5F5F5',
        surface: '#FFFFFF',
        text: {
          primary: '#333333',
          secondary: '#666666',
          disabled: '#999999',
          light: '#FFFFFF',
        }
      },
      // removed platform-specific spacing entries
    },
  },
  plugins: [],
}