/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        baseball: {
          grass: '#2d6a4f',
          dirt: '#b08968',
          leather: '#936639',
          navy: '#1b263b',
          chalk: '#f8f9fa'
        }
      }
    },
  },
  plugins: [],
}
