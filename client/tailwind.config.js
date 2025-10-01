// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default  {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Define your custom colors
        primary: '#0077B6',   // A darker blue, good for main actions/backgrounds
        secondary: '#00B4D8', // A brighter blue, good for highlights/accents
        lightblue: {
          DEFAULT: '#dbeff3ff', // Lighter blue
          lighter: '#efe6efff', // Even lighter blue for backgrounds
        },
      },
      fontFamily: {
        'nabla': ['Nabla', 'sans-serif'],
        'blakaink': ['Blaka Ink', 'sans-serif'],
        'dancing': ['Dancing Script', 'sans-serif'],
      },
    },
  },
  plugins: [],
}