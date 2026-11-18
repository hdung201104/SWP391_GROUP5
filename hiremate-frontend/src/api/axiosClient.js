import axios from 'axios';

/**
 * Enterprise Axios Client with automatic JWT Bearer token injection and response handling
 */
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL;
let cleanBaseUrl = rawBaseUrl ? rawBaseUrl.trim().replace(/\/+$/, '') : '';

// 1. Nếu Render Blueprint truyền vào internal host name không có domain (ví dụ: 'hiremate-backend-ot3r')
if (cleanBaseUrl && !cleanBaseUrl.includes('.')) {
  cleanBaseUrl = `${cleanBaseUrl}.onrender.com`;
}

// 2. Nếu đang chạy trên production cloud (onrender.com) mà chưa có base URL hoặc base URL là localhost
if (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')) {
  if (!cleanBaseUrl || cleanBaseUrl.includes('localhost') || cleanBaseUrl.includes('127.0.0.1')) {
    cleanBaseUrl = 'https://hiremate-backend-ot3r.onrender.com';
  }
}

// 3. Đảm bảo có giao thức https:// cho các domain public
if (cleanBaseUrl && !cleanBaseUrl.startsWith('http://') && !cleanBaseUrl.startsWith('https://')) {
  cleanBaseUrl = `https://${cleanBaseUrl}`;
}

const axiosClient = axios.create({
  baseURL: cleanBaseUrl ? `${cleanBaseUrl}/api/v1` : '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000,
});

// Request interceptor: Attach JWT token if stored, except for public auth endpoints
axiosClient.interceptors.request.use(
  (config) => {
    const isPublicAuth = config.url && (
      config.url.includes('/auth/login') || 
      config.url.includes('/auth/register') ||
      config.url.includes('/auth/google') ||
      config.url.includes('/auth/github') ||
      config.url.includes('/auth/send-otp') ||
      config.url.includes('/auth/verify-otp') ||
      config.url.includes('/auth/check-email') ||
      config.url.includes('/auth/forgot-password') ||
      config.url.includes('/auth/reset-password')
    );

    const token = localStorage.getItem('token');
    if (token && !isPublicAuth) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // If uploading FormData, delete Content-Type so Axios/browser sets boundary automatically
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Extract data and handle automatic silent refresh on 401
axiosClient.interceptors.response.use(
  (response) => {
    // If backend wrapped in ApiResponse<T>, return response.data
    const data = response.data;
    if (data && typeof data === 'object') {
      try {
        if (response.headers) {
          data._headers = response.headers;
          data._isFallback = response.headers['x-hiremate-is-fallback'] === 'true';
        }
      } catch (e) {}
    }
    return data;
  },
  async (error) => {
    const originalRequest = error.config;

    // Automatic failover to Render Production Cloud if local backend (localhost:8088) is not running,
    // or retry once if Render backend is waking up from cold start
    if (!error.response && originalRequest) {
      const RENDER_CLOUD_API = 'https://hiremate-backend-ot3r.onrender.com/api/v1';
      const currentBase = originalRequest.baseURL || axiosClient.defaults.baseURL || '';
      if (!currentBase.includes('onrender.com') && !originalRequest._cloudFailoverRetry) {
        originalRequest._cloudFailoverRetry = true;
        cleanBaseUrl = 'https://hiremate-backend-ot3r.onrender.com';
        axiosClient.defaults.baseURL = RENDER_CLOUD_API;
        originalRequest.baseURL = RENDER_CLOUD_API;
        return axiosClient(originalRequest);
      } else if (currentBase.includes('onrender.com') && !originalRequest._renderWakeRetry) {
        originalRequest._renderWakeRetry = true;
        await new Promise((resolve) => setTimeout(resolve, 1500));
        return axiosClient(originalRequest);
      }
    }

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      const refreshToken = localStorage.getItem('refreshToken');
      const isRefreshEndpoint = originalRequest.url && originalRequest.url.includes('/auth/refresh-token');

      if (refreshToken && !isRefreshEndpoint) {
        originalRequest._retry = true;
        try {
          const activeBase = axiosClient.defaults.baseURL || '/api/v1';
          const res = await axios.post(`${activeBase}/auth/refresh-token`, { refreshToken });
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
        localStorage.removeItem('hiremate_user');
        localStorage.removeItem('hiremate_hr_profile');
        localStorage.removeItem('hiremate_recruiter_subscription');
        window.location.hash = '#/login';
      }
    }
    const message = error.response?.data?.message || error.response?.data?.error || error.message || 'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

export const getApiBaseUrl = () => {
  return cleanBaseUrl;
};

export default axiosClient;
