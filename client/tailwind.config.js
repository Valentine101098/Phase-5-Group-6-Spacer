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
      backgroundImage: {
        'workspace-1': "url('https://images.unsplash.com/photo-1605882171181-e31b036e4ceb?q=80&w=1025&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
        'workspace-2': "url('https://plus.unsplash.com/premium_photo-1664391631217-d53431f0effd?q=80&w=1035&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
        'workspace-3': "url('https://images.unsplash.com/photo-1582653291997-079a1c04e5a1?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
      },
    },
  },
  plugins: [],
}