import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authEvents } from './authEvents';

// The base URL for the API
const API_BASE_URL = 'https://oki.wchapel.com/api/v1';

// Create the Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// ─── Token Refresh State ─────────────────────────────────────────────
// Prevents multiple simultaneous refresh attempts (e.g. if 3 requests
// all get 401 at the same time, only ONE refresh call is made).
let isRefreshing = false;
let failedQueue: {
  resolve: (token: string) => void;
  reject: (error: any) => void;
}[] = [];

function processQueue(error: any, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token!);
    }
  });
  failedQueue = [];
}

// ─── Request Interceptor ─────────────────────────────────────────────
// Attaches the auth token to every outgoing request.
// If no token is found in storage, emits a FORCE_LOGOUT event.
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Skip token check for login/register (public endpoints)
    const publicPaths = ['/login', '/register'];
    const isPublicPath = publicPaths.some(path => config.url?.endsWith(path));

    if (!isPublicPath) {
      try {
        const token = await AsyncStorage.getItem('@auth_token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        } else if (!token && !isPublicPath) {
          // Token is completely missing — user must log in again
          authEvents.emit({
            type: 'FORCE_LOGOUT',
            message: 'Your session was not found. Please log in again.',
          });
          return Promise.reject(new axios.Cancel('No auth token available'));
        }
      } catch (error) {
        console.error('Error fetching token for API request:', error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ─── Response Interceptor ────────────────────────────────────────────
// On 401:
//   1. Attempt to refresh the token by calling /refresh-token
//   2. If refresh succeeds → store new token, retry the original request
//   3. If refresh fails → emit SESSION_EXPIRED (triggers logout + alert)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Only attempt refresh on 401, and not on the refresh-token endpoint itself
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/refresh-token') &&
      !originalRequest.url?.endsWith('/login') &&
      !originalRequest.url?.endsWith('/register')
    ) {
      // If we're already refreshing, queue this request to retry after refresh completes
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            },
            reject: (err: any) => {
              reject(err);
            },
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt token refresh
        const currentToken = await AsyncStorage.getItem('@auth_token');

        if (!currentToken) {
          // No token at all — can't refresh
          throw new Error('No token to refresh');
        }

        const refreshResponse = await axios.post(
          `${API_BASE_URL}/refresh-token`,
          {},
          {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Authorization': `Bearer ${currentToken}`,
              'X-Device-Name': 'mobile_app',
            },
            timeout: 10000,
          }
        );

        const newToken = refreshResponse.data?.data?.token;

        if (!newToken) {
          throw new Error('No token in refresh response');
        }

        // Store the new token
        await AsyncStorage.setItem('@auth_token', newToken);

        // Notify listeners that token was refreshed
        authEvents.emit({
          type: 'TOKEN_REFRESHED',
          message: 'Session refreshed successfully.',
        });

        // Process any queued requests with the new token
        processQueue(null, newToken);

        // Retry the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);

      } catch (refreshError) {
        // Refresh failed — force logout
        console.warn('Token refresh failed. Forcing logout...', refreshError);
        processQueue(refreshError, null);

        // Clear stored credentials
        try {
          await AsyncStorage.removeItem('@auth_token');
          await AsyncStorage.removeItem('@auth_user');
        } catch (e) {
          console.error('Error clearing session after failed refresh:', e);
        }

        // Notify the app to show alert and redirect to login
        authEvents.emit({
          type: 'SESSION_EXPIRED',
          message: 'Your session has expired. Please log in again.',
        });

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // For all other errors, reject as normal so calling code can handle them
    return Promise.reject(error);
  }
);

export default api;
