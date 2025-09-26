// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.js'],
    css: true,
    // Fix the dependency issues
    server: {
      deps: {
        inline: ['@testing-library/user-event']
      }
    },
    // Add this to handle the webidl-conversions issue
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true
      }
    }
  }
})