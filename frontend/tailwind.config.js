/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html", // Scans the main HTML file
    "./src/**/*.{js,ts,jsx,tsx}", // Scans all JS/TS/JSX/TSX files in the src folder
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

