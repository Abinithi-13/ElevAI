/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'] },
      colors: {
        navy: {
          50: '#f3f5fb', 100: '#e4e8f4', 200: '#c8d0e6', 300: '#9aa8cc', 400: '#6577a8',
          500: '#42568a', 600: '#2f4170', 700: '#233159', 800: '#192444', 900: '#101a36',
        },
        brand: {
          50: '#f5f1ff', 100: '#ebe3ff', 200: '#d9c9ff', 300: '#bfa3ff', 400: '#a177fb',
          500: '#8a52f5', 600: '#7437e8', 700: '#6128c8', 800: '#5024a1', 900: '#411f80',
        },
      },
      boxShadow: { card: '0 1px 2px rgba(16,26,54,0.05), 0 1px 3px rgba(16,26,54,0.06)' },
    },
  },
  plugins: [],
};
