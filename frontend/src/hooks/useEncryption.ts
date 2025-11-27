import { useState, useEffect, useCallback } from 'react';
import { userApi } from '../services/api';
import { encryptionService, KeyPair } from '../services/encryption';

interface UseEncryptionReturn {
  keyPair: KeyPair | null;
  isEncryptionEnabled: boolean;
  isInitializing: boolean;
  initializeEncryption: () => Promise<void>;
  generateAndUploadKeys: () => Promise<void>;
  getUserPublicKeys: (userId: number) => Promise<any>;
  getBulkPublicKeys: (userIds: number[]) => Promise<any>;
  encryptMessage: (content: string, recipientKeys: any) => any;
  decryptMessage: (encryptedMessage: any, senderPublicKey: string) => string | null;
  generateSafetyNumber: (publicKey1: string, publicKey2: string) => string;
  clearEncryption: () => void;
}

/**
 * Custom hook for E2EE encryption management
 * Handles key generation, storage, and encryption operations
 */
export const useEncryption = (userId: number | null): UseEncryptionReturn => {
  const [keyPair, setKeyPair] = useState<KeyPair | null>(null);
  const [isEncryptionEnabled, setIsEncryptionEnabled] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  /**
   * Initialize encryption on mount
   * Load existing keys or generate new ones
   */
  useEffect(() => {
    const initializeEncryption = async () => {
      if (!userId) {
        setIsInitializing(false);
        return;
      }

      try {
        // Try to load existing key pair from localStorage
        const existingKeyPair = encryptionService.loadKeyPair();

        if (existingKeyPair) {
          setKeyPair(existingKeyPair);
          setIsEncryptionEnabled(true);
          console.log('Loaded existing encryption keys');
        } else {
          // No keys found - user needs to generate them
          console.log('No encryption keys found');
          setIsEncryptionEnabled(false);
        }
      } catch (error) {
        console.error('Failed to initialize encryption:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeEncryption();
  }, [userId]);

  /**
   * Generate new key pair and upload public key to server
   */
  const generateAndUploadKeys = useCallback(async (): Promise<void> => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    try {
      // Generate new key pair
      const newKeyPair = encryptionService.generateKeyPair();

      // Upload public key to server
      await userApi.uploadPublicKey({
        device_id: newKeyPair.deviceId,
        public_key: newKeyPair.publicKey,
        key_fingerprint: newKeyPair.fingerprint,
      });

      // Save to localStorage
      encryptionService.saveKeyPair(newKeyPair);

      setKeyPair(newKeyPair);
      setIsEncryptionEnabled(true);

      console.log('Encryption keys generated and uploaded');
    } catch (error) {
      console.error('Failed to generate encryption keys:', error);
      throw error;
    }
  }, [userId]);

  /**
   * Initialize encryption (load or generate keys)
   */
  const initializeEncryption = useCallback(async () => {
    if (keyPair) {
      return; // Already initialized
    }

    await generateAndUploadKeys();
  }, [keyPair, generateAndUploadKeys]);

  /**
   * Get public keys for a specific user
   */
  const getUserPublicKeys = useCallback(async (targetUserId: number) => {
    try {
      const response = await userApi.getUserPublicKeys(targetUserId);
      return response.keys;
    } catch (error) {
      console.error('Failed to fetch user public keys:', error);
      throw error;
    }
  }, []);

  /**
   * Get public keys for multiple users (for group chats)
   */
  const getBulkPublicKeys = useCallback(async (userIds: number[]) => {
    try {
      const response = await userApi.getBulkPublicKeys(userIds);
      return response.keys;
    } catch (error) {
      console.error('Failed to fetch bulk public keys:', error);
      throw error;
    }
  }, []);

  /**
   * Encrypt a message for recipients
   */
  const encryptMessage = useCallback(
    (content: string, recipientKeys: any) => {
      if (!keyPair) {
        throw new Error('Encryption not initialized');
      }

      return encryptionService.encryptMessage(
        content,
        recipientKeys,
        keyPair.privateKey,
        keyPair.deviceId
      );
    },
    [keyPair]
  );

  /**
   * Decrypt a message
   */
  const decryptMessage = useCallback(
    (encryptedMessage: any, senderPublicKey: string): string | null => {
      if (!keyPair || !userId) {
        console.error('Encryption not initialized');
        return null;
      }

      return encryptionService.decryptMessage(
        encryptedMessage,
        userId,
        keyPair.deviceId,
        keyPair.privateKey,
        senderPublicKey
      );
    },
    [keyPair, userId]
  );

  /**
   * Generate safety number for verification
   */
  const generateSafetyNumber = useCallback((publicKey1: string, publicKey2: string) => {
    return encryptionService.generateSafetyNumber(publicKey1, publicKey2);
  }, []);

  /**
   * Clear all encryption keys (logout)
   */
  const clearEncryption = useCallback(() => {
    encryptionService.clearKeys();
    setKeyPair(null);
    setIsEncryptionEnabled(false);
  }, []);

  return {
    keyPair,
    isEncryptionEnabled,
    isInitializing,
    initializeEncryption,
    generateAndUploadKeys,
    getUserPublicKeys,
    getBulkPublicKeys,
    encryptMessage,
    decryptMessage,
    generateSafetyNumber,
    clearEncryption,
  };
};

export default useEncryption;
