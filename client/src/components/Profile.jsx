// src/components/Profile.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function Profile() {
  const { user, isAuthenticated, loading: authLoading, makeAuthenticatedRequest } = useAuth();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState(null);
  const [formValues, setFormValues] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    password: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
      return;
    }
    if (isAuthenticated && !profileData) {
      fetchUserProfile();
    }
  }, [isAuthenticated, authLoading, navigate, profileData]);

  const fetchUserProfile = async () => {
    setLoading(true);
    setError('');
    const result = await makeAuthenticatedRequest('/auth/me', 'GET');
    if (result.success) {
      setProfileData(result.data.user);
      setFormValues({
        first_name: result.data.user.first_name,
        last_name: result.data.user.last_name,
        email: result.data.user.email,
        phone_number: result.data.user.phone_number,
        password: '',
      });
    } else {
      setError(result.error || 'Failed to fetch profile data.');
    }
    setLoading(false);
  };

  const handleFormChange = (e) => {
    const { id, value } = e.target;
    setFormValues((prev) => ({ ...prev, [id]: value }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    const payload = {};
    if (formValues.first_name !== profileData.first_name) payload.first_name = formValues.first_name;
    if (formValues.last_name !== profileData.last_name) payload.last_name = formValues.last_name;
    if (formValues.email !== profileData.email) payload.email = formValues.email;
    if (formValues.phone_number !== profileData.phone_number) payload.phone_number = formValues.phone_number;
    if (formValues.password) {
        if (formValues.password.length < 8) {
            setError('Password must be at least 8 characters long.');
            setLoading(false);
            return;
        }
        payload.password = formValues.password;
    }

    if (Object.keys(payload).length === 0) {
        setError('No changes to save.');
        setLoading(false);
        setIsEditing(false);
        return;
    }

    const result = await makeAuthenticatedRequest('/auth/me', 'PUT', payload);
    if (result.success) {
      setSuccessMessage('Profile updated successfully!');
      
      fetchUserProfile();
    } else {
      setError(result.error || 'Failed to update profile.');
    }
    setLoading(false);
  };

  if (authLoading || loading) {
    return <div className="text-center py-8 text-lg text-primary">Loading profile...</div>;
  }

  if (error && !profileData) {
    return <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center text-red-500">Error: {error}</div>;
  }

  if (!profileData) { // Should not happen if auth is true and no error
    return <div className="text-center py-8 text-lg text-gray-700">No profile data available.</div>;
  }


  return (
    <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-2xl text-center">
      <h2 className="text-2xl font-semibold mb-6 text-primary">My Profile</h2>
      {successMessage && <p className="text-green-500 text-sm mb-4">{successMessage}</p>}
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {!isEditing ? (
        <div className="profile-details text-left space-y-2">
          <p><strong className="font-semibold text-gray-700">First Name:</strong> {profileData.first_name}</p>
          <p><strong className="font-semibold text-gray-700">Last Name:</strong> {profileData.last_name}</p>
          <p><strong className="font-semibold text-gray-700">Email:</strong> {profileData.email}</p>
          <p><strong className="font-semibold text-gray-700">Phone Number:</strong> {profileData.phone_number}</p>
          <p><strong className="font-semibold text-gray-700">Roles:</strong> {profileData.roles ? profileData.roles.join(', ') : 'N/A'}</p>
          <p><strong className="font-semibold text-gray-700">Member Since:</strong> {new Date(profileData.created_at).toLocaleDateString()}</p>
          <button
            onClick={() => setIsEditing(true)}
            className="bg-secondary hover:bg-primary text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors duration-200 mt-4"
          >
            Edit Profile
          </button>
        </div>
      ) : (
        <form onSubmit={handleUpdateProfile} className="profile-edit-form space-y-4 text-left">
          <div>
            <label htmlFor="first_name" className="block text-gray-700 text-sm font-bold mb-2">First Name:</label>
            <input
              type="text"
              id="first_name"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-secondary"
              value={formValues.first_name}
              onChange={handleFormChange}
              required
            />
          </div>
          <div>
            <label htmlFor="last_name" className="block text-gray-700 text-sm font-bold mb-2">Last Name:</label>
            <input
              type="text"
              id="last_name"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-secondary"
              value={formValues.last_name}
              onChange={handleFormChange}
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">Email:</label>
            <input
              type="email"
              id="email"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-secondary"
              value={formValues.email}
              onChange={handleFormChange}
              required
            />
          </div>
          <div>
            <label htmlFor="phone_number" className="block text-gray-700 text-sm font-bold mb-2">Phone Number:</label>
            <input
              type="tel"
              id="phone_number"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-secondary"
              value={formValues.phone_number}
              onChange={handleFormChange}
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">New Password (leave blank to keep current):</label>
            <input
              type="password"
              id="password"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-secondary"
              value={formValues.password}
              onChange={handleFormChange}
            />
          </div>
          <div className="flex justify-center space-x-4 mt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-primary hover:bg-secondary text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => { setIsEditing(false); setFormValues(profileData); setError(''); setSuccessMessage(''); }}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors duration-200"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default Profile;