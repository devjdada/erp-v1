import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { authService } from '../services/authService';
import { authEvents } from '../services/authEvents';
import { useAlert } from './AlertContext';

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
  
  // Use refs to track alert/logout state to prevent duplicate alerts
  const isLoggingOutRef = useRef(false);

  // We need a lazy reference to showAlert because AlertProvider wraps us.
  // We'll use a ref that gets set after mount via a child component.
  const showAlertRef = useRef<((options: any) => void) | null>(null);

  const clearSession = useCallback(async () => {
    setAuthToken(null);
    setUser(null);
    await AsyncStorage.removeItem('@auth_token');
    await AsyncStorage.removeItem('@auth_user');
  }, []);

  // Force logout triggered by the API interceptor (no network call to /logout)
  const forceLogout = useCallback(async (message: string) => {
    // Prevent duplicate force logouts
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;

    await clearSession();

    // Show alert to the user BEFORE redirecting
    if (showAlertRef.current) {
      showAlertRef.current({
        title: 'Session Ended',
        message,
        type: 'warning' as const,
        buttons: [
          {
            text: 'Log In',
            style: 'primary' as const,
            onPress: () => {
              router.replace('/(auth)/login');
              // Reset after navigation
              setTimeout(() => { isLoggingOutRef.current = false; }, 1000);
            },
          },
        ],
      });
    } else {
      // Fallback: redirect directly if alert is not available
      router.replace('/(auth)/login');
      setTimeout(() => { isLoggingOutRef.current = false; }, 1000);
    }
  }, [clearSession, router]);

  // Subscribe to auth events from the API interceptor
  useEffect(() => {
    const unsubscribe = authEvents.subscribe((event) => {
      switch (event.type) {
        case 'FORCE_LOGOUT':
        case 'SESSION_EXPIRED':
          forceLogout(event.message);
          break;
        case 'TOKEN_REFRESHED':
          // Token was refreshed by the interceptor — update our state
          AsyncStorage.getItem('@auth_token').then((newToken) => {
            if (newToken) {
              setAuthToken(newToken);
            }
          });
          break;
      }
    });

    return unsubscribe;
  }, [forceLogout]);

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

  const login = async (email: string, password: string) => {
    try {
      const result = await authService.login(email, password);

      if (result.success && result.data) {
        const { token, user: loggedInUser } = result.data;
        setAuthToken(token);
        setUser(loggedInUser);
        
        await AsyncStorage.setItem('@auth_token', token);
        await AsyncStorage.setItem('@auth_user', JSON.stringify(loggedInUser));
        
        // Reset logout guard on successful login
        isLoggingOutRef.current = false;
        
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

        // Reset logout guard on successful registration
        isLoggingOutRef.current = false;

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
      {/* Bridge component to pass showAlert ref into AuthProvider */}
      <AlertBridge showAlertRef={showAlertRef} />
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Bridge component that lives inside both AlertProvider (ancestor) and AuthProvider.
 * It captures the showAlert function and stores it in the ref so the
 * AuthProvider's forceLogout can display alerts before redirecting.
 */
function AlertBridge({ showAlertRef }: { showAlertRef: React.MutableRefObject<((options: any) => void) | null> }) {
  const { showAlert } = useAlert();
  useEffect(() => {
    showAlertRef.current = showAlert;
  }, [showAlert, showAlertRef]);
  return null;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
