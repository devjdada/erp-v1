import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

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

// Request Interceptor
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('@auth_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error fetching token for API request:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response && error.response.status === 401) {
      // Token is expired or invalid
      console.warn('401 Unauthorized received. Logging out...');
      
      try {
        await AsyncStorage.removeItem('@auth_token');
        await AsyncStorage.removeItem('@auth_user');
        
        // Redirect to login
        router.replace('/(auth)/login');
      } catch (e) {
        console.error('Error clearing session on 401:', e);
      }
    }
    
    // Always reject the promise so the calling code can handle the error (e.g. show toast)
    return Promise.reject(error);
  }
);

export default api;
