// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom', // Changed from jsdom
    setupFiles: ['./src/setupTests.js'],
    css: true
  }
})