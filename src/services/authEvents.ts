/**
 * Auth Event Emitter
 * 
 * Bridges the Axios interceptor (which lives outside React) with React contexts.
 * When the interceptor detects an unrecoverable 401 or missing token, it emits 
 * an event that AuthContext subscribes to for performing a proper logout with alerts.
 */

type AuthEventType = 'FORCE_LOGOUT' | 'SESSION_EXPIRED' | 'TOKEN_REFRESHED';

interface AuthEvent {
  type: AuthEventType;
  message: string;
}

type AuthEventListener = (event: AuthEvent) => void;

class AuthEventEmitter {
  private listeners: AuthEventListener[] = [];

  subscribe(listener: AuthEventListener): () => void {
    this.listeners.push(listener);
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  emit(event: AuthEvent): void {
    this.listeners.forEach(listener => listener(event));
  }
}

export const authEvents = new AuthEventEmitter();
