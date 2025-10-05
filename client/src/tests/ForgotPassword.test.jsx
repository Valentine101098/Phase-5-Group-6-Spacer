// src/components/ForgotPassword.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ForgotPassword from '../components/ForgotPassword';
import { API_BASE_URL } from '../config/api';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock fetch globally
global.fetch = vi.fn();

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('ForgotPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the forgot password form', () => {
    renderWithRouter(<ForgotPassword />);

    expect(screen.getByText('Forgot Password')).toBeInTheDocument();
    expect(screen.getByText('Enter your email address to receive a password reset link.')).toBeInTheDocument();
    expect(screen.getByLabelText('Email:')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Request Reset Link' })).toBeInTheDocument();
  });

  it('displays error when email is empty', async () => {
    renderWithRouter(<ForgotPassword />);

    const submitButton = screen.getByRole('button', { name: 'Request Reset Link' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Enter your email address to receive a password reset link.')).toBeInTheDocument();
    });

    expect(fetch).not.toHaveBeenCalled();
  });

  it('handles successful password reset request', async () => {
    const mockResponse = {
      message: 'Password reset link sent to your email.',
      reset_token: 'test-reset-token-123'
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    renderWithRouter(<ForgotPassword />);

    const emailInput = screen.getByLabelText('Email:');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const submitButton = screen.getByRole('button', { name: 'Request Reset Link' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Password reset link sent to your email.')).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'test@example.com' }),
    });
  });

  it('shows reset token development link when token is provided', async () => {
    const mockResponse = {
      message: 'Password reset link sent to your email.',
      reset_token: 'test-reset-token-123'
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    renderWithRouter(<ForgotPassword />);

    const emailInput = screen.getByLabelText('Email:');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const submitButton = screen.getByRole('button', { name: 'Request Reset Link' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Click here to use the reset token:')).toBeInTheDocument();
      expect(screen.getByText('Reset Password Now')).toBeInTheDocument();
    });

    const resetLink = screen.getByText('Reset Password Now');
    expect(resetLink.closest('a')).toHaveAttribute('href', '/reset-password?token=test-reset-token-123');

    expect(consoleSpy).toHaveBeenCalledWith('DEBUG: Reset token (for development):', 'test-reset-token-123');
    consoleSpy.mockRestore();
  });

  it('handles API error response', async () => {
    const errorResponse = {
      message: 'Email not found in our records.'
    };

    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => errorResponse
    });

    renderWithRouter(<ForgotPassword />);

    const emailInput = screen.getByLabelText('Email:');
    fireEvent.change(emailInput, { target: { value: 'nonexistent@example.com' } });

    const submitButton = screen.getByRole('button', { name: 'Request Reset Link' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Email not found in our records.')).toBeInTheDocument();
    });
  });

  it('handles network error', async () => {
    fetch.mockRejectedValueOnce(new Error('Network Error'));

    renderWithRouter(<ForgotPassword />);

    const emailInput = screen.getByLabelText('Email:');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const submitButton = screen.getByRole('button', { name: 'Request Reset Link' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Network error or server unavailable.')).toBeInTheDocument();
    });
  });

  it('shows loading state during request', async () => {
    fetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    renderWithRouter(<ForgotPassword />);

    const emailInput = screen.getByLabelText('Email:');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const submitButton = screen.getByRole('button', { name: 'Request Reset Link' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Sending...')).toBeInTheDocument();
    });

    expect(submitButton).toBeDisabled();
  });

  it('clears previous messages on new submission', async () => {
    // First, show an error
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'First error' })
    });

    renderWithRouter(<ForgotPassword />);

    const emailInput = screen.getByLabelText('Email:');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const submitButton = screen.getByRole('button', { name: 'Request Reset Link' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('First error')).toBeInTheDocument();
    });

    // Now make a successful request
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Success message' })
    });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.queryByText('First error')).not.toBeInTheDocument();
      expect(screen.getByText('Success message')).toBeInTheDocument();
    });
  });

  it('validates email input type', () => {
    renderWithRouter(<ForgotPassword />);

    const emailInput = screen.getByLabelText('Email:');
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(emailInput).toBeRequired();
  });

  it('renders login link', () => {
    renderWithRouter(<ForgotPassword />);

    const loginLink = screen.getByText('Login');
    expect(loginLink.closest('a')).toHaveAttribute('href', '/login');
    expect(screen.getByText('Remember your password?')).toBeInTheDocument();
  });

  it('handles API error without message field', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({}) // No message field
    });

    renderWithRouter(<ForgotPassword />);

    const emailInput = screen.getByLabelText('Email:');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const submitButton = screen.getByRole('button', { name: 'Request Reset Link' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to request password reset.')).toBeInTheDocument();
    });
  });

  it('clears reset token when making new submission', async () => {
    // First request with token
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: 'First success',
        reset_token: 'first-token'
      })
    });

    renderWithRouter(<ForgotPassword />);

    const emailInput = screen.getByLabelText('Email:');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const submitButton = screen.getByRole('button', { name: 'Request Reset Link' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Reset Password Now')).toBeInTheDocument();
    });

    // Second request without token
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: 'Second success'
      })
    });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.queryByText('Reset Password Now')).not.toBeInTheDocument();
      expect(screen.getByText('Second success')).toBeInTheDocument();
    });
  });
});