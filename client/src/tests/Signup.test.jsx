// src/pages/Signup.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Signup from '../components/Signup';

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

// Helper function to fill out the form with valid data
const fillForm = (overrides = {}) => {
  const defaultData = {
    firstName:'John',
    lastName:'Doe',
    email:'john.doe@example.com',
    phoneNumber:'+254700000000',
    password:'password123',
    confirmPassword:'password123',
    ...overrides
  };

  if (defaultData.firstName) {
    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: defaultData.firstName }
    });
  }

  if (defaultData.lastName) {
    fireEvent.change(screen.getByLabelText(/last name/i), {
      target: { value: defaultData.lastName }
    });
  }

  if (defaultData.email) {
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: defaultData.email }
    });
  }

  if (defaultData.phoneNumber) {
    fireEvent.change(screen.getByLabelText(/phone number/i), {
      target: { value: defaultData.phoneNumber }
    });
  }

  if (defaultData.password) {
    fireEvent.change(screen.getByLabelText(/^password/i), {
      target: { value: defaultData.password }
    });
  }

  if (defaultData.confirmPassword) {
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: defaultData.confirmPassword }
    });
  }
};

describe('Signup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all form fields', () => {
    renderWithRouter(<Signup />);

    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
  });

  it('renders login link', () => {
    renderWithRouter(<Signup />);

    const loginLink = screen.getByText('Login');
    expect(loginLink.closest('a')).toHaveAttribute('href', '/login');
    expect(screen.getByText('Already have an account?')).toBeInTheDocument();
  });

  it('validates that passwords match', async () => {
    renderWithRouter(<Signup />);

    fillForm({
      password:'password123',
      confirmPassword:'differentpassword'
    });

    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });

    expect(fetch).not.toHaveBeenCalled();
  });


  it('successfully submits form with valid data', async () => {
    const mockResponse = {
      message: 'User registered successfully',
      user: {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com'
      }
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    renderWithRouter(<Signup />);
    fillForm();

    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('http://127.0.0.1:5000/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: 'John',
          last_name: 'Doe',
          email: 'john.doe@example.com',
          phone_number: '+254700000000',
          password: 'password123'
        }),
      });
    });

    expect(screen.getByText((content, element) =>
  content.includes("Registration successful! You can now log in.")
)).toBeInTheDocument();

    // Should redirect to login after 2 seconds
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    }, { timeout: 3000 });
  });

  it('handles registration failure', async () => {
    const errorResponse = {
      message: 'Email already exists'
    };

    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => errorResponse
    });

    renderWithRouter(<Signup />);
    fillForm();

    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText('Email already exists')).toBeInTheDocument();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('handles network error', async () => {
    fetch.mockRejectedValueOnce(new Error('Network Error'));

    renderWithRouter(<Signup />);
    fillForm();

    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText('Network error or server unavailable.')).toBeInTheDocument();
    });
  });


  it('clears error messages on new submission', async () => {
    // First submission with error
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'First error' })
    });

    renderWithRouter(<Signup />);
    fillForm();

    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText('First error')).toBeInTheDocument();
    });

    // Second submission should clear previous error
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Second error' })
    });

    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.queryByText('First error')).not.toBeInTheDocument();
      expect(screen.getByText('Second error')).toBeInTheDocument();
    });
  });

  it('handles API error without message field', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({}) // No message field
    });

    renderWithRouter(<Signup />);
    fillForm();

    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText('Registration failed.')).toBeInTheDocument();
    });
  });


  it('trims whitespace from form fields', async () => {
    const mockResponse = {
      message: 'User registered successfully',
      user: { id: 1, email: 'john.doe@example.com' }
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    renderWithRouter(<Signup />);

    // Fill form with extra whitespace
    fillForm({
      firstName: '  John  ',
      lastName: '  Doe  ',
      email: '  john.doe@example.com  ',
      phoneNumber: '  +254700000000  '
    });

    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('http://127.0.0.1:5000/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name:'John', // Should be trimmed
          last_name:'Doe', // Should be trimmed
          email:'john.doe@example.com', // Should be trimmed
          phone_number:'+254700000000', // Should be trimmed
          password:'password123'
        }),
      });
    });
  });

  it('has correct input types for form fields', () => {
    renderWithRouter(<Signup />);

    expect(screen.getByLabelText(/email/i)).toHaveAttribute('type', 'email');
    expect(screen.getByLabelText(/phone number/i)).toHaveAttribute('type', 'tel');
    expect(screen.getByLabelText(/^password/i)).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText(/confirm password/i)).toHaveAttribute('type', 'password');
  });

  it('has required attributes on form fields', () => {
    renderWithRouter(<Signup />);

    expect(screen.getByLabelText(/first name/i)).toHaveAttribute('required');
    expect(screen.getByLabelText(/last name/i)).toHaveAttribute('required');
    expect(screen.getByLabelText(/email/i)).toHaveAttribute('required');
    expect(screen.getByLabelText(/phone number/i)).toHaveAttribute('required');
    expect(screen.getByLabelText(/^password/i)).toHaveAttribute('required');
    expect(screen.getByLabelText(/confirm password/i)).toHaveAttribute('required');
  });
});