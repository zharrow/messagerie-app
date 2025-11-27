import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authApi, userApi } from '@/services/api';
import { connectSocket, disconnectSocket } from '@/services/socket';
import { encryptionService } from '@/services/encryption';

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
      setUser(JSON.parse(storedUser));
      connectSocket(token);

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

    try {
      // Check if keys already exist
      const existingKeys = encryptionService.loadKeyPair();
      if (existingKeys) {
        setIsEncryptionEnabled(true);
        return;
      }

      // Generate new key pair
      const keyPair = encryptionService.generateKeyPair();

      // Upload public key to server
      await userApi.uploadPublicKey({
        device_id: keyPair.deviceId,
        public_key: keyPair.publicKey,
        key_fingerprint: keyPair.fingerprint,
      });

      // Save to localStorage
      encryptionService.saveKeyPair(keyPair);
      setIsEncryptionEnabled(true);

      console.log('E2EE encryption initialized');
    } catch (error) {
      console.error('Failed to initialize encryption:', error);
      throw error;
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

    // Auto-initialize encryption on login
    try {
      const keyPair = encryptionService.loadKeyPair();
      if (!keyPair) {
        // Generate keys automatically for new users
        const newKeyPair = encryptionService.generateKeyPair();
        await userApi.uploadPublicKey({
          device_id: newKeyPair.deviceId,
          public_key: newKeyPair.publicKey,
          key_fingerprint: newKeyPair.fingerprint,
        });
        encryptionService.saveKeyPair(newKeyPair);
        setIsEncryptionEnabled(true);
        console.log('E2EE encryption initialized automatically');
      } else {
        setIsEncryptionEnabled(true);
      }
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

      // Clear encryption keys on logout
      encryptionService.clearKeys();
      setIsEncryptionEnabled(false);
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
