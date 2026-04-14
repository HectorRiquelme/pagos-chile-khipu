/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        khipu: {
          50: '#eaf7f7',
          100: '#c9ebeb',
          500: '#00a0a0',
          600: '#008585',
          700: '#006b6b',
        },
      },
    },
  },
  plugins: [],
}
