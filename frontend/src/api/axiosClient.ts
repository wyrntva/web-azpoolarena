import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import axiosRetry from 'axios-retry';

// Use empty string for dev with proxy, or explicit URL
const API_URL = import.meta.env.VITE_API_URL !== undefined
    ? import.meta.env.VITE_API_URL
    : "";

// Track pending requests for cleanup
const pendingRequests = new Map<string, AbortController>();

const axiosClient: AxiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000, // 30s timeout
});

// Configure retry logic with exponential backoff (only for safe, idempotent requests)
axiosRetry(axiosClient, {
    retries: 2,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: (error: AxiosError) => {
        const method = error.config?.method?.toLowerCase();
        // Only retry safe idempotent methods (never retry mutations)
        const isSafeMethod = !method || ['get', 'head', 'options'].includes(method);
        if (!isSafeMethod) return false;
        // Retry on network errors or 5xx server errors
        return axiosRetry.isNetworkOrIdempotentRequestError(error)
            || (error.response?.status !== undefined && error.response.status >= 500 && error.response.status < 600);
    },
    onRetry: () => {
        // Retry silently in production
    },
});

// Helper to generate request key
const getRequestKey = (config: InternalAxiosRequestConfig): string => {
    return `${config.method}-${config.url}-${JSON.stringify(config.params || {})}`;
};

// Cancel all pending requests (useful for logout or route changes)
export const cancelAllPendingRequests = (): void => {
    pendingRequests.forEach((controller) => {
        controller.abort();
    });
    pendingRequests.clear();
};

axiosClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('access_token');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Add abort controller for request cancellation
        const controller = new AbortController();
        config.signal = controller.signal;

        // Track this request
        const requestKey = getRequestKey(config);
        pendingRequests.set(requestKey, controller);

        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

axiosClient.interceptors.response.use(
    (response: AxiosResponse) => {
        // Remove completed request from pending list
        if (response.config) {
            const requestKey = getRequestKey(response.config as InternalAxiosRequestConfig);
            pendingRequests.delete(requestKey);
        }
        return response;
    },
    async (error: AxiosError) => {
        // Remove failed request from pending list
        if (error.config) {
            const requestKey = getRequestKey(error.config as InternalAxiosRequestConfig);
            pendingRequests.delete(requestKey);
        }

        // Don't retry if request was cancelled
        if (axios.isCancel(error)) {
            return Promise.reject(error);
        }

        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
                try {
                    const response = await axios.post(`${API_URL}/api/auth/refresh`, {
                        refresh_token: refreshToken,
                    });

                    const { access_token } = response.data;
                    localStorage.setItem('access_token', access_token);

                    if (originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${access_token}`;
                    }
                    return axiosClient(originalRequest);
                } catch (refreshError) {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    localStorage.removeItem('user');
                    window.location.href = '/auth/login';
                    return Promise.reject(refreshError);
                }
            } else {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('user');
                window.location.href = '/auth/login';
            }
        }

        return Promise.reject(error);
    }
);

export default axiosClient;
