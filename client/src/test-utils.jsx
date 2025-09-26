// src/test-utils.js
import React from 'react'
import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'

// Custom render function that includes providers
export const renderWithProviders = (
  ui,
  {
    initialEntries = ['/'],
    authValue = null,
    ...renderOptions
  } = {}
) => {
  function Wrapper({ children }) {
    const providers = (
      <BrowserRouter>
        {authValue ? (
          <AuthProvider value={authValue}>
            {children}
          </AuthProvider>
        ) : (
          <AuthProvider>
            {children}
          </AuthProvider>
        )}
      </BrowserRouter>
    )

    return providers
  }

  return { ...render(ui, { wrapper: Wrapper, ...renderOptions }) }
}

// Re-export everything
export * from '@testing-library/react'