import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { authService } from '../services/authService';

export interface Staff {
  id: number;
  user_id: number;
  designation?: string;
  phone?: string;
  profile_photo?: string;
  first_name?: string;
  middle_name?: string;
  surname?: string;
  [key: string]: any;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
  staff?: Staff | null;
  roles?: string[];
  permissions?: string[];
  [key: string]: any;
}

interface AuthContextType {
  authToken: string | null;
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load storage data and verify session on mount
  useEffect(() => {
    async function loadSession() {
      try {
        const storedToken = await AsyncStorage.getItem('@auth_token');
        const storedUserJson = await AsyncStorage.getItem('@auth_user');

        if (storedToken) {
          setAuthToken(storedToken);
          if (storedUserJson) {
            setUser(JSON.parse(storedUserJson));
          }

          // Verify token by fetching user profile from hosted backend
          try {
            const result = await authService.getProfile();
            if (result.success && result.data) {
              setUser(result.data);
              await AsyncStorage.setItem('@auth_user', JSON.stringify(result.data));
            }
          } catch (error: any) {
            // Interceptor handles 401 and clears session, so we can just ignore here
            // or clear session if needed
            if (error.response && error.response.status === 401) {
              await clearSession();
            }
          }
        }
      } catch (error) {
        console.error('Error restoring session:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadSession();
  }, []);

  const clearSession = async () => {
    setAuthToken(null);
    setUser(null);
    await AsyncStorage.removeItem('@auth_token');
    await AsyncStorage.removeItem('@auth_user');
  };

  const login = async (email: string, password: string) => {
    try {
      const result = await authService.login(email, password);

      if (result.success && result.data) {
        const { token, user: loggedInUser } = result.data;
        setAuthToken(token);
        setUser(loggedInUser);
        
        await AsyncStorage.setItem('@auth_token', token);
        await AsyncStorage.setItem('@auth_user', JSON.stringify(loggedInUser));
        
        return { success: true, message: result.message || 'Login successful' };
      } else {
        return { success: false, message: result.message || 'Invalid credentials' };
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Network error occurred. Please try again.';
      return { success: false, message };
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const result = await authService.register(name, email, password);

      if (result.success && result.data) {
        const { token, user: registeredUser } = result.data;
        setAuthToken(token);
        setUser(registeredUser);

        await AsyncStorage.setItem('@auth_token', token);
        await AsyncStorage.setItem('@auth_user', JSON.stringify(registeredUser));

        return { success: true, message: result.message || 'Registration successful' };
      } else {
        return { success: false, message: result.message || 'Registration failed' };
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Network error occurred. Please try again.';
      return { success: false, message };
    }
  };

  const logout = async () => {
    try {
      if (authToken) {
        await authService.logout();
      }
    } catch (error) {
      console.error('Logout API request error:', error);
    } finally {
      await clearSession();
      router.replace('/(auth)/login');
    }
  };

  const refreshProfile = async () => {
    if (!authToken) return;
    try {
      const result = await authService.getProfile();

      if (result.success && result.data) {
        setUser(result.data);
        await AsyncStorage.setItem('@auth_user', JSON.stringify(result.data));
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        authToken,
        user,
        isLoading,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
