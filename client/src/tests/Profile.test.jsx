// src/components/Profile.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Profile from '../components/Profile';
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
  user: {
    id: 1,
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    phone_number: '+254700000000',
    roles: ['client'],
    created_at: '2023-01-01T00:00:00Z'
  },
  isAuthenticated: true,
  loading: false,
  makeAuthenticatedRequest: vi.fn()
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

describe('Profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to login when not authenticated', () => {
    const unauthenticatedContext = {
      ...mockAuthContextValue,
      isAuthenticated: false,
      loading: false
    };

    renderWithContext(<Profile />, unauthenticatedContext);

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('shows loading state while auth is loading', () => {
    const loadingContext = {
      ...mockAuthContextValue,
      loading: true
    };

    renderWithContext(<Profile />, loadingContext);

    expect(screen.getByText('Loading profile...')).toBeInTheDocument();
  });

  it('fetches and displays user profile data', async () => {
    const mockMakeRequest = vi.fn().mockResolvedValue({
      success: true,
      data: { user: mockAuthContextValue.user }
    });

    const contextWithMockRequest = {
      ...mockAuthContextValue,
      makeAuthenticatedRequest: mockMakeRequest
    };

    renderWithContext(<Profile />, contextWithMockRequest);

    await waitFor(() => {
      expect(screen.getByText('My Profile')).toBeInTheDocument();
      expect(screen.getByText('John')).toBeInTheDocument();
      expect(screen.getByText('Doe')).toBeInTheDocument();
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
      expect(screen.getByText('+254700000000')).toBeInTheDocument();
      expect(screen.getByText('client')).toBeInTheDocument();
    });

    expect(mockMakeRequest).toHaveBeenCalledWith('/auth/me', 'GET');
  });

  it('displays error when profile fetch fails', async () => {
    const mockMakeRequest = vi.fn().mockResolvedValue({
      success: false,
      error: 'Failed to fetch profile'
    });

    const contextWithMockRequest = {
      ...mockAuthContextValue,
      makeAuthenticatedRequest: mockMakeRequest
    };

    renderWithContext(<Profile />, contextWithMockRequest);

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toHaveTextContent("Failed to fetch profile");
    });
  });

  it('enters edit mode when edit button is clicked', async () => {
    const mockMakeRequest = vi.fn().mockResolvedValue({
      success: true,
      data: { user: mockAuthContextValue.user }
    });

    const contextWithMockRequest = {
      ...mockAuthContextValue,
      makeAuthenticatedRequest: mockMakeRequest
    };

    renderWithContext(<Profile />, contextWithMockRequest);

    await waitFor(() => {
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Edit Profile'));

    expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('john.doe@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('+254700000000')).toBeInTheDocument();
  });

  it('handles form input changes in edit mode', async () => {
    const mockMakeRequest = vi.fn().mockResolvedValue({
      success: true,
      data: { user: mockAuthContextValue.user }
    });

    const contextWithMockRequest = {
      ...mockAuthContextValue,
      makeAuthenticatedRequest: mockMakeRequest
    };

    renderWithContext(<Profile />, contextWithMockRequest);

    await waitFor(() => {
      fireEvent.click(screen.getByText('Edit Profile'));
    });

    const firstNameInput = screen.getByDisplayValue('John');
    fireEvent.change(firstNameInput, { target: { value: 'Jane' } });

    expect(screen.getByDisplayValue('Jane')).toBeInTheDocument();
  });

  it('validates password length when updating', async () => {
    const mockMakeRequest = vi.fn()
      .mockResolvedValueOnce({
        success: true,
        data: { user: mockAuthContextValue.user }
      });

    const contextWithMockRequest = {
      ...mockAuthContextValue,
      makeAuthenticatedRequest: mockMakeRequest
    };

    renderWithContext(<Profile />, contextWithMockRequest);

    await waitFor(() => {
      fireEvent.click(screen.getByText('Edit Profile'));
    });

    const passwordInput = screen.getByLabelText(/New Password/i);
    fireEvent.change(passwordInput, { target: { value: '123' } });

    fireEvent.click(screen.getByText('Save Changes'));

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters long.')).toBeInTheDocument();
    });
  });

  it('shows error when no changes are made', async () => {
    const mockMakeRequest = vi.fn().mockResolvedValue({
      success: true,
      data: { user: mockAuthContextValue.user }
    });

    const contextWithMockRequest = {
      ...mockAuthContextValue,
      makeAuthenticatedRequest: mockMakeRequest
    };

    renderWithContext(<Profile />, contextWithMockRequest);

    await waitFor(() => {
      fireEvent.click(screen.getByText('Edit Profile'));
    });

    fireEvent.click(screen.getByText('Save Changes'));

    await waitFor(() => {
      expect(screen.getByText('No changes to save.')).toBeInTheDocument();
    });
  });

  it('successfully updates profile with changes', async () => {
    const mockMakeRequest = vi.fn()
      .mockResolvedValueOnce({
        success: true,
        data: { user: mockAuthContextValue.user }
      })
      .mockResolvedValueOnce({
        success: true,
        data: { user: { ...mockAuthContextValue.user, first_name: 'Jane' } }
      })
      .mockResolvedValueOnce({
        success: true,
        data: { user: { ...mockAuthContextValue.user, first_name: 'Jane' } }
      });

    const contextWithMockRequest = {
      ...mockAuthContextValue,
      makeAuthenticatedRequest: mockMakeRequest
    };

    renderWithContext(<Profile />, contextWithMockRequest);

    await waitFor(() => {
      fireEvent.click(screen.getByText('Edit Profile'));
    });

    const firstNameInput = screen.getByDisplayValue('John');
    fireEvent.change(firstNameInput, { target: { value: 'Jane' } });

    fireEvent.click(screen.getByText('Save Changes'));

    await waitFor(() => {
      expect(screen.getByText('Profile updated successfully!')).toBeInTheDocument();
    });

    expect(mockMakeRequest).toHaveBeenCalledWith('/auth/me', 'PUT', { first_name: 'Jane' });
  });

  it('handles profile update failure', async () => {
    const mockMakeRequest = vi.fn()
      .mockResolvedValueOnce({
        success: true,
        data: { user: mockAuthContextValue.user }
      })
      .mockResolvedValueOnce({
        success: false,
        error: 'Update failed'
      });

    const contextWithMockRequest = {
      ...mockAuthContextValue,
      makeAuthenticatedRequest: mockMakeRequest
    };

    renderWithContext(<Profile />, contextWithMockRequest);

    await waitFor(() => {
      fireEvent.click(screen.getByText('Edit Profile'));
    });

    const firstNameInput = screen.getByDisplayValue('John');
    fireEvent.change(firstNameInput, { target: { value: 'Jane' } });

    fireEvent.click(screen.getByText('Save Changes'));

    await waitFor(() => {
      expect(screen.getByText('Update failed')).toBeInTheDocument();
    });
  });

  it('cancels edit mode and resets form', async () => {
    const mockMakeRequest = vi.fn().mockResolvedValue({
      success: true,
      data: { user: mockAuthContextValue.user }
    });

    const contextWithMockRequest = {
      ...mockAuthContextValue,
      makeAuthenticatedRequest: mockMakeRequest
    };

    renderWithContext(<Profile />, contextWithMockRequest);

    await waitFor(() => {
      fireEvent.click(screen.getByText('Edit Profile'));
    });

    const firstNameInput = screen.getByDisplayValue('John');
    fireEvent.change(firstNameInput, { target: { value: 'Jane' } });

    fireEvent.click(screen.getByText('Cancel'));

    await waitFor(() => {
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    });

    // Should be back in view mode showing original data
    expect(screen.getByText('John')).toBeInTheDocument();
  });

  it('displays formatted member since date', async () => {
    const mockMakeRequest = vi.fn().mockResolvedValue({
      success: true,
      data: { user: mockAuthContextValue.user }
    });

    const contextWithMockRequest = {
      ...mockAuthContextValue,
      makeAuthenticatedRequest: mockMakeRequest
    };

    renderWithContext(<Profile />, contextWithMockRequest);

    await waitFor(() => {
      expect(screen.getByText('1/1/2023')).toBeInTheDocument();
    });
  });

  it('handles empty roles array', async () => {
    const userWithNoRoles = {
      ...mockAuthContextValue.user,
      roles: null
    };

    const mockMakeRequest = vi.fn().mockResolvedValue({
      success: true,
      data: { user: userWithNoRoles }
    });

    const contextWithMockRequest = {
      ...mockAuthContextValue,
      makeAuthenticatedRequest: mockMakeRequest
    };

    renderWithContext(<Profile />, contextWithMockRequest);

    await waitFor(() => {
      expect(screen.getByText('N/A')).toBeInTheDocument();
    });
  });

  it('displays multiple roles correctly', async () => {
    const userWithMultipleRoles = {
      ...mockAuthContextValue.user,
      roles: ['client', 'owner']
    };

    const mockMakeRequest = vi.fn().mockResolvedValue({
      success: true,
      data: { user: userWithMultipleRoles }
    });

    const contextWithMockRequest = {
      ...mockAuthContextValue,
      makeAuthenticatedRequest: mockMakeRequest
    };

    renderWithContext(<Profile />, contextWithMockRequest);

    await waitFor(() => {
      expect(screen.getByText('client, owner')).toBeInTheDocument();
    });
  });
});