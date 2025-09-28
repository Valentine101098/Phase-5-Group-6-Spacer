// src/utils/utils.js
import { API_BASE_URL } from "../config/api";
// Your existing function
export function calculateTotalAmount({ startDate, endDate, startTime, endTime, pricePerHour }) {
  if (!startDate || !endDate || !startTime || !endTime || !pricePerHour) return 0;

  const startDateTime = new Date(`${startDate}T${startTime}`);
  const endDateTime = new Date(`${endDate}T${endTime}`);
  const diffInHours = (endDateTime - startDateTime) / (1000 * 60 * 60);

  return Math.max(0, Math.round(diffInHours * parseFloat(pricePerHour)));
}

// Add the API client class
class ApiClient {
    constructor() {
        this.baseURL = `${API_BASE_URL}/api`;
    }

    async refreshToken() {
        try {
            const refreshToken = localStorage.getItem('refresh_token');
            if (!refreshToken) {
                throw new Error('No refresh token available');
            }

            const response = await fetch(`${this.baseURL}/auth/refresh`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ refresh_token: refreshToken }),
            });

            if (!response.ok) {
                throw new Error('Failed to refresh token');
            }

            const data = await response.json();
            localStorage.setItem('auth_token', data.access_token);
            return data.access_token;
        } catch (error) {
            console.error('Token refresh failed:', error);
            // Clear tokens and redirect to login
            localStorage.removeItem('auth_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login';
            throw error;
        }
    }

    async request(endpoint, options = {}) {
        let token = localStorage.getItem('auth_token');

        if (!token) {
            throw new Error('No authentication token found');
        }

        const config = {
            ...options,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
                ...options.headers,
            },
        };

        // Add body if it exists (for POST, PUT, PATCH requests)
        if (options.body) {
            config.body = JSON.stringify(options.body);
        }

        let response = await fetch(`${this.baseURL}${endpoint}`, config);

        // If token expired, refresh and retry
        if (response.status === 401) {
            try {
                token = await this.refreshToken();
                config.headers.Authorization = `Bearer ${token}`;
                response = await fetch(`${this.baseURL}${endpoint}`, config);
            } catch (error) {
                throw error;
            }
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
        }

        return response;
    }

    async get(endpoint) {
        const response = await this.request(endpoint, { method: 'GET' });
        return response.json();
    }

    async post(endpoint, data) {
        const response = await this.request(endpoint, {
            method: 'POST',
            body: data,
        });
        return response.json();
    }

    async put(endpoint, data) {
        const response = await this.request(endpoint, {
            method: 'PUT',
            body: data,
        });
        return response.json();
    }

    async patch(endpoint, data) {
        const response = await this.request(endpoint, {
            method: 'PATCH',
            body: data,
        });
        return response.json();
    }

    async delete(endpoint) {
        const response = await this.request(endpoint, { method: 'DELETE' });
        return response.json();
    }
}

// Create a singleton instance
export const apiClient = new ApiClient();