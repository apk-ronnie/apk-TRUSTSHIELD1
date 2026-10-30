import axios from 'axios';

// Base Axios client instance configured with environment API URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 45000, // 45 seconds to accommodate LLM analysis
});

// Request Interceptor: Automatically inject Bearer JWT if authenticated
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('trustshield_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Standardize error handling and manage session expiration
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const errorResponse = error.response?.data?.error;
    
    // Automatically evict expired or revoked credentials
    if (error.response?.status === 401) {
      localStorage.removeItem('trustshield_token');
      localStorage.removeItem('trustshield_user');
      
      // Dispatch custom event to notify auth context
      window.dispatchEvent(new Event('auth:unauthorized'));
    }

    const message =
      errorResponse?.message ||
      error.message ||
      'An unexpected network or server error occurred.';

    return Promise.reject({
      status: error.response?.status || 500,
      code: errorResponse?.code || 'NETWORK_ERROR',
      message,
      details: errorResponse?.details || null,
    });
  }
);

export default api;
