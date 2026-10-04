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

// Response interceptor: Extract data and handle automatic silent refresh on 401
axiosClient.interceptors.response.use(
  (response) => {
    // If backend wrapped in ApiResponse<T>, return response.data
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      const refreshToken = localStorage.getItem('refreshToken');
      const isRefreshEndpoint = originalRequest.url && originalRequest.url.includes('/auth/refresh-token');

      if (refreshToken && !isRefreshEndpoint) {
        originalRequest._retry = true;
        try {
          const res = await axios.post('/api/v1/auth/refresh-token', { refreshToken });
          const payload = res.data?.data || res.data;
          if (payload && payload.token) {
            localStorage.setItem('token', payload.token);
            if (payload.refreshToken) {
              localStorage.setItem('refreshToken', payload.refreshToken);
            }
            originalRequest.headers.Authorization = `Bearer ${payload.token}`;
            return axiosClient(originalRequest);
          }
        } catch (refreshErr) {
          console.warn('Auto refresh token failed:', refreshErr);
        }
      }

      // If refresh failed or not available, clear tokens and redirect to login
      const currentHash = window.location.hash || '';
      if (!currentHash.includes('login') && !currentHash.includes('register')) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.hash = '#/login';
      }
    }
    const message = error.response?.data?.message || error.response?.data?.error || error.message || 'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

export default axiosClient;
