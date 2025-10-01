// src/contexts/AuthContext.js
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { API_BASE_URL } from '../config/api';

const AuthContext = createContext(null);

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
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: method,
        headers: headers,
        body: data ? JSON.stringify(data) : null,
      });

      if (response.ok) {
        return { success: true, data: await response.json() };
      } else if (response.status === 401 && !isRefreshTokenRequest) {
        console.log("Access token expired, attempting to refresh...");
        const refreshResult = await refreshAccessTokenInternal();
        if (refreshResult.success) {
          currentAccessToken = refreshResult.data.access_token;
          headers['Authorization'] = `Bearer ${currentAccessToken}`;
          const retryResponse = await fetch(`${API_BASE_URL}${url}`, {
            method: method,
            headers: headers,
            body: data ? JSON.stringify(data) : null,
          });
          if (retryResponse.ok) {
            return { success: true, data: await retryResponse.json() };
          }
        }
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
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok && data.access_token) {
        localStorage.setItem("accessToken", data.access_token);
        localStorage.setItem("refreshToken", data.refresh_token);
        localStorage.setItem("user", JSON.stringify(data.user));

        setAccessToken(data.access_token);
        setRefreshToken(data.refresh_token);
        setUser(data.user);

        return { success: true, data: { user: data.user } };
      } else {
        console.error("Login failed:", data.message || "No access token");
        return { success: false, error: data.message || "Login failed" };
      }
    } catch (err) {
      setLoading(false);
      console.error("Network error:", err);
      return { success: false, error: "Network error. Please check your connection." };
    }
  };

  const loginWithTokens = useCallback((access, refresh) => {
    try {
      const payload = JSON.parse(atob(access.split('.')[1]));
      const userObj = {
        id: payload.sub,
        roles: payload.roles || [],
        email: payload.email || null
      };

      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
      localStorage.setItem('user', JSON.stringify(userObj));

      setAccessToken(access);
      setRefreshToken(refresh);
      setUser(userObj);

      return { success: true, user: userObj };
    } catch (err) {
      console.error('Failed to process OAuth tokens:', err);
      return { success: false, error: 'Invalid token format' };
    }
  }, []);

  const logout = async () => {
    setLoading(true);
    if (accessToken) {
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

  const refreshAccessTokenInternal = async () => {
    setLoading(true);
    const result = await makeAuthenticatedRequest('/auth/refresh', 'POST', null, true);
    setLoading(false);

    if (result.success) {
      const newAccessToken = result.data.access_token;
      localStorage.setItem('accessToken', newAccessToken);
      setAccessToken(newAccessToken);
      return { success: true, data: result.data };
    } else {
      console.error('Token refresh failed:', result.error);
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
    loginWithTokens, 
    logout,
    refreshAccessToken: refreshAccessTokenInternal,
    makeAuthenticatedRequest,
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

export { AuthContext };