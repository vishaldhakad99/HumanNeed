import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach bearer token if present in localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hn_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh and errors
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    // Auto-refresh token if 401 received and not already retrying
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/login') &&
      !originalRequest.url.includes('/auth/refresh-token')
    ) {
      originalRequest._retry = true;
      try {
        const refreshResponse = await axios.post('/api/auth/refresh-token', {}, { withCredentials: true });
        if (refreshResponse.data && refreshResponse.data.data && refreshResponse.data.data.accessToken) {
          const newToken = refreshResponse.data.data.accessToken;
          localStorage.setItem('hn_access_token', newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          const retryRes = await axios(originalRequest);
          return retryRes.data;
        }
      } catch (refreshErr) {
        localStorage.removeItem('hn_access_token');
        localStorage.removeItem('hn_user');
      }
    }

    const message =
      error.response?.data?.message || error.message || 'An unexpected error occurred. Please try again.';
    return Promise.reject(new Error(message));
  }
);

export default api;
