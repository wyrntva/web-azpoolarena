import axios from 'axios';

// Create axios instance with default config
// For client-side requests, use the backend URL accessible from browser
const getApiBaseURL = () => {
  if (typeof window !== 'undefined') {
    // In production (HTTPS), use configured API URL to avoid Mixed Content errors
    if (window.location.protocol === 'https:') {
      return process.env.NEXT_PUBLIC_API_URL || `https://${window.location.hostname}`;
    }
    // Dev: connect directly to backend port
    return `http://${window.location.hostname}:8000`;
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
};

const api = axios.create({
  baseURL: getApiBaseURL(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token && token !== 'undefined' && token !== 'null') {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const requestUrl: string | undefined = error.config?.url;
      // Don't auto-logout for auth endpoints (login, profile check)
      const isAuthEndpoint = requestUrl?.includes('/auth/login');
      if (!isAuthEndpoint) {
        // Clear token so ProtectedRoute can detect and redirect
        localStorage.removeItem('token');
        document.cookie = 'token=; path=/; max-age=0; SameSite=Lax';
        // Don't hard redirect - let the app handle it naturally
        // This prevents jarring page reloads
      }
    }
    return Promise.reject(error);
  }
);

export default api;
