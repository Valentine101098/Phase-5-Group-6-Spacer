// src/components/ResetPassword.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const BASE_URL = 'http://127.0.0.1:5000'; // import.meta.env.VITE_BACKEND_URL for Vite

function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  // Safely access token
  const token = searchParams?.get?.('token') || '';

  useEffect(() => {
    if (!token) {
      setError('No reset token found in URL.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!token) {
      setError('Reset token is missing.');
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError('Please enter and confirm your new password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: newPassword.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Password has been reset successfully! Redirecting to login...');
        setNewPassword('');
        setConfirmPassword('');

        setTimeout(() => {
          navigate('/login', { state: { resetSuccess: true, email: 'your-email-here' } });
        }, 3000);
      } else {
        setError(data.message || 'Failed to reset password.');
      }
    } catch (err) {
      setError('Network error or server unavailable.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
      <h2 className="text-2xl font-semibold mb-6 text-primary">Reset Password</h2>

      {token ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="newPassword" className="block text-left text-gray-700 text-sm font-bold mb-2">
              New Password:
            </label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-secondary"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-left text-gray-700 text-sm font-bold mb-2">
              Confirm New Password:
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-secondary"
            />
          </div>

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          {message && <p className="text-green-500 text-sm mb-4">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="bg-primary hover:bg-secondary text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      ) : (
        <p className="text-red-500 text-sm mt-4">{error}</p>
      )}

      <p className="mt-4 text-gray-600">
        Remember your password? <a href="/login" className="text-primary hover:text-secondary hover:underline">Login</a>
      </p>
    </div>
  );
}

export default ResetPassword;
