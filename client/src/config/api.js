// src/config/api.js
const API_CONFIG = {
  development: {
    baseURL: 'http://127.0.0.1:5000' || 'http://localhost:5000',
  },
  production: {
    baseURL:'https://phase-5-group-6-spacer.onrender.com',
  }
};


const getEnvironment = () => {

  if (process.env.NODE_ENV === 'development') {
    return 'development';
  }

  if (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.port === '3000' || // React dev server default
      window.location.port === '5173' || // Vite dev server default
      window.location.port === '8080') { // Other common dev ports
    return 'development';
  }

  return 'production';
};

// Export the base URL
export const API_BASE_URL = API_CONFIG[getEnvironment()].baseURL;

