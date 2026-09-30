import axios from 'axios';

/**
 * Enterprise Axios Client with automatic JWT Bearer token injection and response handling
 */
const axiosClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor: Attach JWT token if stored, except for public auth endpoints
axiosClient.interceptors.request.use(
  (config) => {
    const isPublicAuth = config.url && (
      config.url.includes('/auth/login') || 
      config.url.includes('/auth/register') ||
      config.url.includes('/auth/forgot-password') ||
      config.url.includes('/auth/reset-password')
    );

    const token = localStorage.getItem('token');
    if (token && !isPublicAuth) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Extract data and handle errors
axiosClient.interceptors.response.use(
  (response) => {
    // If backend wrapped in ApiResponse<T>, return response.data
    return response.data;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized, clear invalid token and redirect to login if not already on auth page
      const currentHash = window.location.hash || '';
      if (!currentHash.includes('login') && !currentHash.includes('register')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.hash = '#/login';
      }
    }
    const message = error.response?.data?.message || error.response?.data?.error || error.message || 'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

export default axiosClient;
