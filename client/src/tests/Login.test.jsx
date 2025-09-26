// src/components/Login.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../components/Login';
import { AuthContext } from '../contexts/AuthContext';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockAuthContextValue = {
  login: vi.fn(),
  loading: false,
  isAuthenticated: false,
  user: null
};

const renderWithContext = (component, authValue = mockAuthContextValue) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={authValue}>
        {component}
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form', () => {
  renderWithContext(<Login />);

  // safer: check the heading explicitly
  expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();

  expect(screen.getByLabelText('Email:')).toBeInTheDocument();
  expect(screen.getByLabelText('Password:')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
});


  it('renders signup and forgot password links', () => {
    renderWithContext(<Login />);

    const signupLink = screen.getByText('Sign Up');
    expect(signupLink.closest('a')).toHaveAttribute('href', '/signup');

    const forgotPasswordLink = screen.getByText('Reset it');
    expect(forgotPasswordLink.closest('a')).toHaveAttribute('href', '/forgot-password');
  });



  it('calls login function with correct credentials', async () => {
    const mockLogin = vi.fn().mockResolvedValue({ success: true });
    const authValue = { ...mockAuthContextValue, login: mockLogin };

    renderWithContext(<Login />, authValue);

    const emailInput = screen.getByLabelText('Email:');
    const passwordInput = screen.getByLabelText('Password:');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    const submitButton = screen.getByRole('button', { name: 'Login' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('displays error when login fails', async () => {
    const mockLogin = vi.fn().mockResolvedValue({
      success: false,
      error: 'Invalid credentials'
    });
    const authValue = { ...mockAuthContextValue, login: mockLogin };

    renderWithContext(<Login />, authValue);

    const emailInput = screen.getByLabelText('Email:');
    const passwordInput = screen.getByLabelText('Password:');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });

    const submitButton = screen.getByRole('button', { name: 'Login' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('displays generic error when login fails without specific error', async () => {
    const mockLogin = vi.fn().mockResolvedValue({ success: false });
    const authValue = { ...mockAuthContextValue, login: mockLogin };

    renderWithContext(<Login />, authValue);

    const emailInput = screen.getByLabelText('Email:');
    const passwordInput = screen.getByLabelText('Password:');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    const submitButton = screen.getByRole('button', { name: 'Login' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Login failed. Please try again.')).toBeInTheDocument();
    });
  });


  it('redirects admin user to admin dashboard', () => {
    const adminUser = {
      id: 1,
      email: 'admin@example.com',
      roles: ['admin']
    };
    const authenticatedAuthValue = {
      ...mockAuthContextValue,
      isAuthenticated: true,
      user: adminUser,
      loading: false
    };

    renderWithContext(<Login />, authenticatedAuthValue);

    expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard');
  });

  it('redirects owner user to owner dashboard', () => {
    const ownerUser = {
      id: 2,
      email: 'owner@example.com',
      roles: ['owner']
    };
    const authenticatedAuthValue = {
      ...mockAuthContextValue,
      isAuthenticated: true,
      user: ownerUser,
      loading: false
    };

    renderWithContext(<Login />, authenticatedAuthValue);

    expect(mockNavigate).toHaveBeenCalledWith('/owner/dashboard');
  });

  it('redirects client user to client dashboard', () => {
    const clientUser = {
      id: 3,
      email: 'client@example.com',
      roles: ['client']
    };
    const authenticatedAuthValue = {
      ...mockAuthContextValue,
      isAuthenticated: true,
      user: clientUser,
      loading: false
    };

    renderWithContext(<Login />, authenticatedAuthValue);

    expect(mockNavigate).toHaveBeenCalledWith('/client/dashboard');
  });

  it('redirects user with multiple roles to admin dashboard (admin priority)', () => {
    const multiRoleUser = {
      id: 4,
      email: 'multi@example.com',
      roles: ['client', 'admin', 'owner']
    };
    const authenticatedAuthValue = {
      ...mockAuthContextValue,
      isAuthenticated: true,
      user: multiRoleUser,
      loading: false
    };

    renderWithContext(<Login />, authenticatedAuthValue);

    expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard');
  });

  it('redirects user with no roles to profile', () => {
    const noRolesUser = {
      id: 5,
      email: 'noroles@example.com',
      roles: []
    };
    const authenticatedAuthValue = {
      ...mockAuthContextValue,
      isAuthenticated: true,
      user: noRolesUser,
      loading: false
    };

    renderWithContext(<Login />, authenticatedAuthValue);

    expect(mockNavigate).toHaveBeenCalledWith('/profile');
  });

  it('redirects user with null roles to profile', () => {
    const nullRolesUser = {
      id: 6,
      email: 'nullroles@example.com',
      roles: null
    };
    const authenticatedAuthValue = {
      ...mockAuthContextValue,
      isAuthenticated: true,
      user: nullRolesUser,
      loading: false
    };

    renderWithContext(<Login />, authenticatedAuthValue);

    expect(mockNavigate).toHaveBeenCalledWith('/profile');
  });

  it('renders null when user is authenticated (after redirect)', () => {
    const authenticatedAuthValue = {
      ...mockAuthContextValue,
      isAuthenticated: true,
      user: { roles: ['client'] },
      loading: false
    };

    const { container } = renderWithContext(<Login />, authenticatedAuthValue);

    expect(container.firstChild).toBeNull();
  });



  it('clears error message on new submission', async () => {
    const mockLogin = vi.fn()
      .mockResolvedValueOnce({ success: false, error: 'First error' })
      .mockResolvedValueOnce({ success: false, error: 'Second error' });

    const authValue = { ...mockAuthContextValue, login: mockLogin };

    renderWithContext(<Login />, authValue);

    const emailInput = screen.getByLabelText('Email:');
    const passwordInput = screen.getByLabelText('Password:');
    const submitButton = screen.getByRole('button', { name: 'Login' });

    // First submission
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrong1' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('First error')).toBeInTheDocument();
    });

    // Second submission should clear first error
    fireEvent.change(passwordInput, { target: { value: 'wrong2' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.queryByText('First error')).not.toBeInTheDocument();
      expect(screen.getByText('Second error')).toBeInTheDocument();
    });
  });
});