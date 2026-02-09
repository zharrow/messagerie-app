import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authApi, userApi } from '@/services/api';
import { connectSocket, disconnectSocket } from '@/services/socket';
import { encryptionService, initializeE2EE, setCurrentUserId } from '@/services/encryption';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isEncryptionEnabled: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  initializeEncryption: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEncryptionEnabled, setIsEncryptionEnabled] = useState(false);

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('access_token');

    if (storedUser && token) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      connectSocket(token);

      // IMPORTANT: Set user ID before loading keys to use user-specific storage
      setCurrentUserId(userData.id);

      // Check if encryption keys exist
      const keyPair = encryptionService.loadKeyPair();
      setIsEncryptionEnabled(!!keyPair);
    }

    setIsLoading(false);
  }, []);

  const initializeEncryption = async () => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Ensure user ID is set before initializing
    setCurrentUserId(user.id);

    const result = await initializeE2EE(userApi.uploadPublicKey);
    setIsEncryptionEnabled(result.isEnabled);
    if (!result.isEnabled) {
      throw new Error('Failed to initialize encryption');
    }
  };

  const login = async (email: string, password: string, rememberMe = false) => {
    const response = await authApi.login(email, password, rememberMe);

    const { access_token, refresh_token, user: userData } = response;

    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
    localStorage.setItem('user', JSON.stringify(userData));

    setUser(userData);
    connectSocket(access_token);

    // IMPORTANT: Set user ID before initializing encryption
    setCurrentUserId(userData.id);

    // Auto-initialize encryption on login
    try {
      const result = await initializeE2EE(userApi.uploadPublicKey);
      setIsEncryptionEnabled(result.isEnabled);
    } catch (error) {
      console.error('Failed to initialize encryption on login:', error);
      // Non-blocking - user can still chat without encryption
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      setUser(null);
      disconnectSocket();

      // IMPORTANT: Do NOT clear encryption keys on logout!
      // E2EE keys are device-specific and must persist to decrypt old messages
      // Only clear them when explicitly requested by user (device removal)
      setIsEncryptionEnabled(false);

      // Clear current user ID to prevent key confusion on next login
      setCurrentUserId(undefined);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isEncryptionEnabled,
        login,
        logout,
        setUser,
        initializeEncryption,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
