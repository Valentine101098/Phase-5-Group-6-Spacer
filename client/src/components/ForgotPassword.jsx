// src/components/ForgotPassword.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Import Link

const BASE_URL = 'http://localhost:5000';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetTokenForDev, setResetTokenForDev] = useState(null); // New state to hold the token
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setResetTokenForDev(null); // Clear token on new submission

    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        if (data.reset_token) {
            console.log("DEBUG: Reset token (for development):", data.reset_token);
            setResetTokenForDev(data.reset_token); // Store the token in state
        }
      } else {
        setError(data.message || 'Failed to request password reset.');
      }
    } catch (err) {
      setError('Network error or server unavailable.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
      <h2 className="text-2xl font-semibold mb-6 text-primary">Forgot Password</h2>
      <p className="text-gray-700 mb-4">Enter your email address to receive a password reset link.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-left text-gray-700 text-sm font-bold mb-2">Email:</label>
          <input
            type="email"
            id="email"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-secondary"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        {message && <p className="text-green-500 text-sm mb-4">{message}</p>}

        {resetTokenForDev && (
          <div className="mt-4 p-3 bg-lightblue-lighter rounded">
            <p className="text-gray-800 text-sm mb-2">
             Click here to use the reset token:
            </p>
            <Link
              to={`/reset-password?token=${resetTokenForDev}`}
              className="bg-secondary hover:bg-primary text-white font-bold py-2 px-4 rounded transition-colors duration-200"
            >
              Reset Password Now
            </Link>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="bg-primary hover:bg-secondary text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Sending...' : 'Request Reset Link'}
        </button>
      </form>
      <p className="mt-4 text-gray-600">
        Remember your password? <Link to="/login" className="text-primary hover:text-secondary hover:underline">Login</Link>
      </p>
    </div>
  );
}

export default ForgotPassword;