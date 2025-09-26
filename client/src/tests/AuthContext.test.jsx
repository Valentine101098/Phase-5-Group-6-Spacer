// src/contexts/AuthContext.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock fetch globally
global.fetch = vi.fn();

// Test component that uses the auth context
const TestComponent = () => {
  const {
    user,
    accessToken,
    refreshToken,
    isAuthenticated,
    loading,
    login,
    logout,
    refreshAccessToken,
    makeAuthenticatedRequest
  } = useAuth();

  return (
    <div>
      <div data-testid="user">{user ? user.email : 'No user'}</div>
      <div data-testid="access-token">{accessToken || 'No access token'}</div>
      <div data-testid="refresh-token">{refreshToken || 'No refresh token'}</div>
      <div data-testid="is-authenticated">{isAuthenticated.toString()}</div>
      <div data-testid="loading">{loading.toString()}</div>
      <button onClick={() => login('test@example.com', 'password')}>Login</button>
      <button onClick={logout}>Logout</button>
      <button onClick={refreshAccessToken}>Refresh</button>
      <button onClick={() => makeAuthenticatedRequest('/test', 'GET')}>Make Request</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with empty state when no tokens in localStorage', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    expect(screen.getByTestId('user')).toHaveTextContent('No user');
    expect(screen.getByTestId('access-token')).toHaveTextContent('No access token');
    expect(screen.getByTestId('refresh-token')).toHaveTextContent('No refresh token');
    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
  });

  it('initializes with stored tokens from localStorage', async () => {
    const mockUser = { id: 1, email: 'test@example.com' };
    localStorageMock.getItem.mockImplementation((key) => {
      switch (key) {
        case 'accessToken':
          return 'stored-access-token';
        case 'refreshToken':
          return 'stored-refresh-token';
        case 'user':
          return JSON.stringify(mockUser);
        default:
          return null;
      }
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
    expect(screen.getByTestId('access-token')).toHaveTextContent('stored-access-token');
    expect(screen.getByTestId('refresh-token')).toHaveTextContent('stored-refresh-token');
    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
  });

  it('handles corrupted user data in localStorage', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    localStorageMock.getItem.mockImplementation((key) => {
      switch (key) {
        case 'accessToken':
          return 'stored-access-token';
        case 'refreshToken':
          return 'stored-refresh-token';
        case 'user':
          return 'invalid-json';
        default:
          return null;
      }
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    expect(screen.getByTestId('user')).toHaveTextContent('No user');
    expect(consoleSpy).toHaveBeenCalledWith('Failed to parse user from local storage', expect.any(Error));

    consoleSpy.mockRestore();
  });

  it('successfully logs in user', async () => {
    const mockUser = { id: 1, email: 'test@example.com' };
    const mockResponse = {
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token',
      user: mockUser
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    await act(async () => {
      screen.getByText('Login').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
      expect(screen.getByTestId('access-token')).toHaveTextContent('new-access-token');
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith('accessToken', 'new-access-token');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('refreshToken', 'new-refresh-token');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));
  });

  it('handles login failure', async () => {
    const errorResponse = { message: 'Invalid credentials' };

    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => errorResponse
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    await act(async () => {
      screen.getByText('Login').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
    });
  });

  it('handles network error during login', async () => {
    fetch.mockRejectedValueOnce(new Error('Network Error'));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    await act(async () => {
      screen.getByText('Login').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
    });
  });

  it('logs out user and clears storage', async () => {
    // Setup initial authenticated state
    localStorageMock.getItem.mockImplementation((key) => {
      switch (key) {
        case 'accessToken':
          return 'stored-access-token';
        case 'refreshToken':
          return 'stored-refresh-token';
        case 'user':
          return JSON.stringify({ id: 1, email: 'test@example.com' });
        default:
          return null;
      }
    });

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Logged out successfully' })
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
    });

    await act(async () => {
      screen.getByText('Logout').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('user')).toHaveTextContent('No user');
    });

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
  });

  it('refreshes access token successfully', async () => {
    // Setup initial authenticated state
    localStorageMock.getItem.mockImplementation((key) => {
      switch (key) {
        case 'accessToken':
          return 'old-access-token';
        case 'refreshToken':
          return 'refresh-token';
        case 'user':
          return JSON.stringify({ id: 1, email: 'test@example.com' });
        default:
          return null;
      }
    });

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: 'new-access-token' })
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('access-token')).toHaveTextContent('old-access-token');
    });

    await act(async () => {
      screen.getByText('Refresh').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('access-token')).toHaveTextContent('new-access-token');
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith('accessToken', 'new-access-token');
  });

  it('handles refresh token failure and logs out user', async () => {
    // Setup initial authenticated state
    localStorageMock.getItem.mockImplementation((key) => {
      switch (key) {
        case 'accessToken':
          return 'old-access-token';
        case 'refreshToken':
          return 'invalid-refresh-token';
        case 'user':
          return JSON.stringify({ id: 1, email: 'test@example.com' });
        default:
          return null;
      }
    });

    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Invalid refresh token' })
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
    });

    await act(async () => {
      screen.getByText('Refresh').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
    });

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
  });

  it('makes authenticated request successfully', async () => {
    // Setup initial authenticated state
    localStorageMock.getItem.mockImplementation((key) => {
      switch (key) {
        case 'accessToken':
          return 'valid-access-token';
        case 'refreshToken':
          return 'refresh-token';
        case 'user':
          return JSON.stringify({ id: 1, email: 'test@example.com' });
        default:
          return null;
      }
    });

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: 'test data' })
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
    });

    await act(async () => {
      screen.getByText('Make Request').click();
    });

    expect(fetch).toHaveBeenCalledWith(
      'http://127.0.0.1:5000/test',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Authorization': 'Bearer valid-access-token'
        })
      })
    );
  });

  it('retries request with new token after 401 error', async () => {
    // Setup initial authenticated state
    localStorageMock.getItem.mockImplementation((key) => {
      switch (key) {
        case 'accessToken':
          return 'expired-access-token';
        case 'refreshToken':
          return 'refresh-token';
        case 'user':
          return JSON.stringify({ id: 1, email: 'test@example.com' });
        default:
          return null;
      }
    });

    // First request fails with 401
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Token expired' })
    })
    // Refresh token request succeeds
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: 'new-access-token' })
    })
    // Retry original request succeeds
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: 'test data' })
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
    });

    await act(async () => {
      screen.getByText('Make Request').click();
    });

    // Should have made 3 requests: original, refresh, retry
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('handles makeAuthenticatedRequest without access token', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
    });

    await act(async () => {
      screen.getByText('Make Request').click();
    });

    expect(consoleSpy).toHaveBeenCalledWith('No access token available for authenticated request.');
    consoleSpy.mockRestore();
  });

  it('throws error when useAuth is used outside AuthProvider', () => {
    const TestComponentOutsideProvider = () => {
      useAuth();
      return <div>Test</div>;
    };

    expect(() => render(<TestComponentOutsideProvider />)).toThrow('useAuth must be used within an AuthProvider');
  });

  it('handles network error in makeAuthenticatedRequest', async () => {
    localStorageMock.getItem.mockImplementation((key) => {
      switch (key) {
        case 'accessToken':
          return 'valid-access-token';
        case 'refreshToken':
          return 'refresh-token';
        case 'user':
          return JSON.stringify({ id: 1, email: 'test@example.com' });
        default:
          return null;
      }
    });

    fetch.mockRejectedValueOnce(new Error('Network Error'));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
    });

    await act(async () => {
      screen.getByText('Make Request').click();
    });

    // Should not crash the app
    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
  });
});