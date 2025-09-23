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
          DEFAULT: '#90E0EF', // Lighter blue
          lighter: '#CAF0F8', // Even lighter blue for backgrounds
        },
        // You can also define specific names if you prefer:
        // 'brand-blue-dark': '#0077B6',
        // 'brand-blue-light': '#00B4D8',
        // 'accent-light': '#90E0EF',
        // 'bg-light': '#CAF0F8',
      },
    },
  },
  plugins: [],
}