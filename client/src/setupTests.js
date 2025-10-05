// src/setupTests.js
import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Ensure globals are available before any imports
Object.defineProperty(global, 'URL', {
  writable: true,
  value: class URL {
    constructor(url) {
      this.href = url
      this.search = ''
      this.searchParams = new URLSearchParams()
    }
  }
})

Object.defineProperty(global, 'URLSearchParams', {
  writable: true,
  value: class URLSearchParams {
    constructor(init) {
      this.params = new Map()
      if (typeof init === 'string') {
        // Simple parsing for test purposes
        init.split('&').forEach(pair => {
          const [key, value] = pair.split('=')
          if (key) this.params.set(key, decodeURIComponent(value || ''))
        })
      }
    }
    get(name) { return this.params.get(name) }
    set(name, value) { this.params.set(name, value) }
    has(name) { return this.params.has(name) }
    delete(name) { this.params.delete(name) }
  }
})

// Mock other browser APIs
global.IntersectionObserver = vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn(),
}))

global.ResizeObserver = vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn(),
}))

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

global.scrollTo = vi.fn()