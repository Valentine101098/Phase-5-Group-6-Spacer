// src/components/LogoutButton.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LogoutButton from '../components/LogoutButton';
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
  logout: vi.fn(),
  isAuthenticated: true
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

describe('LogoutButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders logout button when user is authenticated', () => {
    renderWithContext(<LogoutButton />);

    const logoutButton = screen.getByRole('button', { name: 'Logout' });
    expect(logoutButton).toBeInTheDocument();
    expect(logoutButton).toHaveClass('bg-red-600');
  });

  it('does not render when user is not authenticated', () => {
    const unauthenticatedAuthValue = {
      ...mockAuthContextValue,
      isAuthenticated: false
    };

    const { container } = renderWithContext(<LogoutButton />, unauthenticatedAuthValue);

    expect(container.firstChild).toBeNull();
    expect(screen.queryByRole('button', { name: 'Logout' })).not.toBeInTheDocument();
  });

  it('calls logout function when clicked', async () => {
    const mockLogout = vi.fn().mockResolvedValue({ success: true });
    const authValue = {
      ...mockAuthContextValue,
      logout: mockLogout
    };

    renderWithContext(<LogoutButton />, authValue);

    const logoutButton = screen.getByRole('button', { name: 'Logout' });
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });

  it('navigates to login page after logout', async () => {
    const mockLogout = vi.fn().mockResolvedValue({ success: true });
    const authValue = {
      ...mockAuthContextValue,
      logout: mockLogout
    };

    renderWithContext(<LogoutButton />, authValue);

    const logoutButton = screen.getByRole('button', { name: 'Logout' });
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('has correct CSS classes for styling', () => {
    renderWithContext(<LogoutButton />);

    const logoutButton = screen.getByRole('button', { name: 'Logout' });

    expect(logoutButton).toHaveClass('bg-red-600');
    expect(logoutButton).toHaveClass('hover:bg-red-700');
    expect(logoutButton).toHaveClass('text-white');
    expect(logoutButton).toHaveClass('font-bold');
    expect(logoutButton).toHaveClass('py-2');
    expect(logoutButton).toHaveClass('px-4');
    expect(logoutButton).toHaveClass('rounded');
    expect(logoutButton).toHaveClass('focus:outline-none');
    expect(logoutButton).toHaveClass('focus:shadow-outline');
    expect(logoutButton).toHaveClass('transition-colors');
    expect(logoutButton).toHaveClass('duration-200');
  });

  it('handles logout error gracefully', async () => {
    const mockLogout = vi.fn().mockRejectedValue(new Error('Logout failed'));
    const authValue = {
      ...mockAuthContextValue,
      logout: mockLogout
    };

    renderWithContext(<LogoutButton />, authValue);

    const logoutButton = screen.getByRole('button', { name: 'Logout' });
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    // Should still navigate even if logout fails
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('handles multiple clicks correctly', async () => {
    const mockLogout = vi.fn().mockResolvedValue({ success: true });
    const authValue = {
      ...mockAuthContextValue,
      logout: mockLogout
    };

    renderWithContext(<LogoutButton />, authValue);

    const logoutButton = screen.getByRole('button', { name: 'Logout' });

    // Click multiple times quickly
    fireEvent.click(logoutButton);
    fireEvent.click(logoutButton);
    fireEvent.click(logoutButton);

    await waitFor(() => {
      // Should be called for each click
      expect(mockLogout).toHaveBeenCalledTimes(3);
      expect(mockNavigate).toHaveBeenCalledTimes(3);
    });
  });
});