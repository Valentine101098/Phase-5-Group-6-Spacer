// src/contexts/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

const BASE_URL = 'postgresql://spacer_db_gd12_user:PASSWORD@WezI7nwwnuOBbmoltqP0HgR0dkdhosTz/spacer_db_gd12'; // Replace with your Flask backend URL

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const storedAccessToken = localStorage.getItem('accessToken');
    const storedRefreshToken = localStorage.getItem('refreshToken');
    const storedUser = localStorage.getItem('user');

    if (storedAccessToken && storedRefreshToken && storedUser) {
      setAccessToken(storedAccessToken);
      setRefreshToken(storedRefreshToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user from local storage", e);
        setUser(null);
      }
    }
    setLoading(false);
  }, []);


  const makeAuthenticatedRequest = async (url, method, data = null, isRefreshTokenRequest = false) => {
    let currentAccessToken = accessToken;

    if (!isRefreshTokenRequest && !currentAccessToken) {
      console.error("No access token available for authenticated request.");
      return { success: false, error: 'No access token' };
    }

    let headers = {
      'Content-Type': 'application/json',
    };

    if (isRefreshTokenRequest) {
      headers['Authorization'] = `Bearer ${refreshToken}`;
    } else if (currentAccessToken) {
      headers['Authorization'] = `Bearer ${currentAccessToken}`;
    }

    try {
      const response = await fetch(`${BASE_URL}${url}`, {
        method: method,
        headers: headers,
        body: data ? JSON.stringify(data) : null,
      });

      if (response.ok) {
        return { success: true, data: await response.json() };
      } else if (response.status === 401 && !isRefreshTokenRequest) {
        // Access token expired or invalid, try to refresh
        console.log("Access token expired, attempting to refresh...");
        const refreshResult = await refreshAccessToken();
        if (refreshResult.success) {
          // Retry the original request with the new access token
          currentAccessToken = refreshResult.data.access_token;
          headers['Authorization'] = `Bearer ${currentAccessToken}`;
          const retryResponse = await fetch(`${BASE_URL}${url}`, {
            method: method,
            headers: headers,
            body: data ? JSON.stringify(data) : null,
          });
          if (retryResponse.ok) {
            return { success: true, data: await retryResponse.json() };
          }
        }
        // Refresh failed or retry failed, force logout
        console.error("Failed to refresh token or retry request. Forcing logout.");
        logout();
        return { success: false, error: 'Session expired. Please log in again.' };
      } else {
        const errorData = await response.json();
        console.error("API request failed:", errorData);
        return { success: false, error: errorData.message || 'API request failed' };
      }
    } catch (error) {
      console.error("Network error:", error);
      return { success: false, error: 'Network error. Please check your connection.' };
    }
  };


  // --- Authentication Functions ---

  const login = async (email, password) => {
    setLoading(true);
    const result = await makeAuthenticatedRequest('/auth/login', 'POST', { email, password });
    setLoading(false);

    if (result.success) {
      const { access_token, refresh_token, user: userData } = result.data;
      localStorage.setItem('accessToken', access_token);
      localStorage.setItem('refreshToken', refresh_token);
      localStorage.setItem('user', JSON.stringify(userData));
      setAccessToken(access_token);
      setRefreshToken(refresh_token);
      setUser(userData);
      return { success: true };
    } else {
      console.error('Login failed:', result.error);
      return { success: false, error: result.error };
    }
  };

  const logout = async () => {
    setLoading(true);
    // Invalidate token on the backend
    if (accessToken) { // Only attempt if there's an accessToken to revoke
      const result = await makeAuthenticatedRequest('/auth/logout', 'DELETE');
      if (!result.success) {
        console.warn("Backend logout failed, but clearing local tokens anyway:", result.error);
      }
    } else {
      console.log("No access token to revoke, proceeding with local logout.");
    }

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    setLoading(false);
    return { success: true };
  };

  const refreshAccessToken = async () => {
    setLoading(true);
    const result = await makeAuthenticatedRequest('/auth/refresh', 'POST', null, true); // Pass true for isRefreshTokenRequest
    setLoading(false);

    if (result.success) {
      const newAccessToken = result.data.access_token;
      localStorage.setItem('accessToken', newAccessToken);
      setAccessToken(newAccessToken);
      return { success: true, data: result.data };
    } else {
      console.error('Token refresh failed:', result.error);
      // If refresh also fails, force logout
      logout();
      return { success: false, error: result.error };
    }
  };

  const value = {
    user,
    accessToken,
    refreshToken,
    isAuthenticated: !!accessToken,
    loading,
    login,
    logout,
    refreshAccessToken,
    makeAuthenticatedRequest, // Expose for other components
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};