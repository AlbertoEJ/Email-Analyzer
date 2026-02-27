/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        threat: {
          safe: '#22c55e',
          low: '#eab308',
          medium: '#f97316',
          high: '#ef4444',
          critical: '#991b1b',
        },
      },
    },
  },
  plugins: [],
};
