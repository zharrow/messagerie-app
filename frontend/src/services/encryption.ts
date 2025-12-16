import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';

/**
 * E2EE Encryption Service
 * Handles all client-side encryption/decryption using NaCl (Curve25519)
 *
 * Key Storage:
 * - Private keys: Stored in localStorage, encrypted with password-derived key
 * - Public keys: Stored on server for other users to fetch
 */

const STORAGE_KEYS = {
  PRIVATE_KEY: 'e2ee_private_key',
  PUBLIC_KEY: 'e2ee_public_key',
  DEVICE_ID: 'e2ee_device_id',
  KEY_FINGERPRINT: 'e2ee_key_fingerprint',
};

export interface KeyPair {
  publicKey: string;
  privateKey: string;
  deviceId: string;
  fingerprint: string;
}

export interface EncryptedMessage {
  encrypted: true;
  encryptedPayloads: Record<string, string>; // userId:deviceId -> encrypted content
  nonce: string;
  senderDeviceId: string;
  attachments?: any[];
  replyTo?: string;
}

export interface DecryptedMessage {
  content: string;
  from: number;
  attachments?: any[];
  replyTo?: string;
}

class EncryptionService {
  /**
   * Generate a new key pair for the current device
   * @returns {KeyPair} - Generated key pair
   */
  generateKeyPair(): KeyPair {
    const keyPair = nacl.box.keyPair();
    const deviceId = this.generateDeviceId();

    const publicKeyBase64 = naclUtil.encodeBase64(keyPair.publicKey);
    const privateKeyBase64 = naclUtil.encodeBase64(keyPair.secretKey);
    const fingerprint = this.generateFingerprint(publicKeyBase64);

    return {
      publicKey: publicKeyBase64,
      privateKey: privateKeyBase64,
      deviceId,
      fingerprint,
    };
  }

  /**
   * Generate a unique device ID
   * @returns {string} - Device ID
   */
  generateDeviceId(): string {
    const randomBytes = nacl.randomBytes(16);
    return naclUtil.encodeBase64(randomBytes).substring(0, 22);
  }

  /**
   * Generate a fingerprint from a public key
   * @param {string} publicKeyBase64 - Base64 encoded public key
   * @returns {string} - Hex fingerprint
   */
  generateFingerprint(publicKeyBase64: string): string {
    const publicKey = naclUtil.decodeBase64(publicKeyBase64);
    const hash = nacl.hash(publicKey);
    // Return first 32 bytes as hex
    return Array.from(hash.slice(0, 32))
      .map((b: unknown) => (b as number).toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Format fingerprint for display (groups of 5 digits)
   * @param {string} fingerprint - Hex fingerprint
   * @returns {string} - Formatted fingerprint
   */
  formatFingerprint(fingerprint: string): string {
    const digits = fingerprint.substring(0, 60);
    return digits.match(/.{1,5}/g)?.join(' ') || fingerprint;
  }

  /**
   * Save key pair to localStorage
   * @param {KeyPair} keyPair - Key pair to save
   */
  saveKeyPair(keyPair: KeyPair): void {
    localStorage.setItem(STORAGE_KEYS.PRIVATE_KEY, keyPair.privateKey);
    localStorage.setItem(STORAGE_KEYS.PUBLIC_KEY, keyPair.publicKey);
    localStorage.setItem(STORAGE_KEYS.DEVICE_ID, keyPair.deviceId);
    localStorage.setItem(STORAGE_KEYS.KEY_FINGERPRINT, keyPair.fingerprint);
  }

  /**
   * Load key pair from localStorage
   * @returns {KeyPair | null} - Loaded key pair or null
   */
  loadKeyPair(): KeyPair | null {
    console.log('[E2EE] Loading key pair from localStorage...');
    const isSafari = navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome');
    console.log('[E2EE] Browser:', isSafari ? 'Safari' : 'Other');

    const privateKey = localStorage.getItem(STORAGE_KEYS.PRIVATE_KEY);
    const publicKey = localStorage.getItem(STORAGE_KEYS.PUBLIC_KEY);
    const deviceId = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
    const fingerprint = localStorage.getItem(STORAGE_KEYS.KEY_FINGERPRINT);

    console.log('[E2EE] Keys loaded from localStorage:', {
      hasPrivateKey: !!privateKey,
      hasPublicKey: !!publicKey,
      hasDeviceId: !!deviceId,
      hasFingerprint: !!fingerprint,
      privateKeyLength: privateKey?.length || 0,
      publicKeyLength: publicKey?.length || 0,
      deviceIdLength: deviceId?.length || 0,
      privateKeyPreview: privateKey?.substring(0, 10) + '...',
      publicKeyPreview: publicKey?.substring(0, 10) + '...'
    });

    if (!privateKey || !publicKey || !deviceId || !fingerprint) {
      console.error('[E2EE] Missing keys in localStorage!');
      return null;
    }

    console.log('[E2EE] ✓ Key pair loaded successfully');
    return { privateKey, publicKey, deviceId, fingerprint };
  }

  /**
   * Clear all keys from localStorage
   */
  clearKeys(): void {
    localStorage.removeItem(STORAGE_KEYS.PRIVATE_KEY);
    localStorage.removeItem(STORAGE_KEYS.PUBLIC_KEY);
    localStorage.removeItem(STORAGE_KEYS.DEVICE_ID);
    localStorage.removeItem(STORAGE_KEYS.KEY_FINGERPRINT);
  }

  /**
   * Encrypt a message for multiple recipients
   * @param {string} content - Message content to encrypt
   * @param {Object} recipientKeys - Map of userId to their public keys
   * @param {string} senderPrivateKey - Sender's private key (base64)
   * @param {string} senderDeviceId - Sender's device ID
   * @returns {EncryptedMessage} - Encrypted message object
   */
  encryptMessage(
    content: string,
    recipientKeys: Record<string, Array<{ device_id: string; public_key: string }>>,
    senderPrivateKey: string,
    senderDeviceId: string
  ): EncryptedMessage {
    // Generate a random nonce for this message
    const nonce = nacl.randomBytes(nacl.box.nonceLength);
    const nonceBase64 = naclUtil.encodeBase64(nonce);

    const messageBytes = naclUtil.decodeUTF8(content);
    const senderSecretKey = naclUtil.decodeBase64(senderPrivateKey);

    const encryptedPayloads: Record<string, string> = {};

    // Encrypt for each recipient device
    Object.entries(recipientKeys).forEach(([userId, devices]) => {
      devices.forEach(({ device_id, public_key }) => {
        try {
          const recipientPublicKey = naclUtil.decodeBase64(public_key);

          // Encrypt using NaCl box (public key encryption)
          const encrypted = nacl.box(
            messageBytes,
            nonce,
            recipientPublicKey,
            senderSecretKey
          );

          const encryptedBase64 = naclUtil.encodeBase64(encrypted);
          const key = `${userId}:${device_id}`;
          encryptedPayloads[key] = encryptedBase64;
        } catch (error) {
          console.error(`Failed to encrypt for ${userId}:${device_id}`, error);
        }
      });
    });

    return {
      encrypted: true,
      encryptedPayloads,
      nonce: nonceBase64,
      senderDeviceId,
    };
  }

  /**
   * Decrypt a message using the current user's private key
   * @param {EncryptedMessage} encryptedMessage - Encrypted message object
   * @param {number} currentUserId - Current user's ID
   * @param {string} currentDeviceId - Current device ID
   * @param {string} privateKey - Current user's private key (base64)
   * @param {string} senderPublicKey - Sender's public key (base64)
   * @returns {string | null} - Decrypted content or null if failed
   */
  decryptMessage(
    encryptedMessage: any,
    currentUserId: number,
    currentDeviceId: string,
    privateKey: string,
    senderPublicKey: string
  ): string | null {
    try {
      const { encryptedPayloads, nonce, senderDeviceId } = encryptedMessage;

      console.log('[DECRYPT] Tentative de déchiffrement:', {
        messageId: encryptedMessage._id,
        currentUserId,
        currentDeviceId,
        availablePayloads: encryptedPayloads ? Object.keys(encryptedPayloads) : 'none',
        hasNonce: !!nonce,
        senderDeviceId,
        browser: navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome') ? 'Safari' : 'Other'
      });

      // Safari Debug: Log key lengths
      console.log('[DECRYPT] Key details:', {
        privateKeyLength: privateKey?.length,
        senderPublicKeyLength: senderPublicKey?.length,
        nonceLength: nonce?.length,
        privateKeyPreview: privateKey?.substring(0, 10) + '...',
        senderPublicKeyPreview: senderPublicKey?.substring(0, 10) + '...'
      });

      // Find the payload for this device
      const payloadKey = `${currentUserId}:${currentDeviceId}`;
      let encryptedPayload = encryptedPayloads[payloadKey];

      // Fallback: if exact deviceId not found, try to find any payload for this user
      if (!encryptedPayload) {
        console.warn('[DECRYPT] No exact payload found for:', payloadKey);
        console.warn('[DECRYPT] Available keys:', Object.keys(encryptedPayloads || {}));

        // Try to find ANY payload for this userId
        const userPayloads = Object.entries(encryptedPayloads || {})
          .filter(([key]) => key.startsWith(`${currentUserId}:`));

        if (userPayloads.length > 0) {
          console.log('[DECRYPT] Found alternative payload for user:', userPayloads[0][0]);
          encryptedPayload = userPayloads[0][1];
        } else {
          console.error('[DECRYPT] No payload found for user ID:', currentUserId);
          return null;
        }
      }

      console.log('[DECRYPT] Payload details:', {
        payloadLength: encryptedPayload?.length,
        payloadPreview: encryptedPayload?.substring(0, 20) + '...'
      });

      // Decode everything with error handling
      let nonceBytes, encryptedBytes, secretKey, publicKey;

      try {
        nonceBytes = naclUtil.decodeBase64(nonce);
        console.log('[DECRYPT] Nonce decoded:', nonceBytes?.length, 'bytes');
      } catch (error) {
        console.error('[DECRYPT] Failed to decode nonce:', error);
        throw new Error('Failed to decode nonce');
      }

      try {
        encryptedBytes = naclUtil.decodeBase64(encryptedPayload);
        console.log('[DECRYPT] Encrypted payload decoded:', encryptedBytes?.length, 'bytes');
      } catch (error) {
        console.error('[DECRYPT] Failed to decode encrypted payload:', error);
        throw new Error('Failed to decode encrypted payload');
      }

      try {
        secretKey = naclUtil.decodeBase64(privateKey);
        console.log('[DECRYPT] Private key decoded:', secretKey?.length, 'bytes (expected 32)');
        if (secretKey.length !== 32) {
          throw new Error(`Invalid private key length: ${secretKey.length} (expected 32)`);
        }
      } catch (error) {
        console.error('[DECRYPT] Failed to decode private key:', error);
        throw new Error('Failed to decode private key');
      }

      try {
        publicKey = naclUtil.decodeBase64(senderPublicKey);
        console.log('[DECRYPT] Sender public key decoded:', publicKey?.length, 'bytes (expected 32)');
        if (publicKey.length !== 32) {
          throw new Error(`Invalid public key length: ${publicKey.length} (expected 32)`);
        }
      } catch (error) {
        console.error('[DECRYPT] Failed to decode sender public key:', error);
        throw new Error('Failed to decode sender public key');
      }

      console.log('[DECRYPT] All keys decoded successfully, attempting decryption...');

      // Decrypt using NaCl box
      const decrypted = nacl.box.open(
        encryptedBytes,
        nonceBytes,
        publicKey,
        secretKey
      );

      if (!decrypted) {
        console.error('[DECRYPT] Decryption failed - authentication failed or incorrect keys');
        console.error('[DECRYPT] This could mean:', [
          '1. The sender public key does not match the encryption key',
          '2. The private key is incorrect',
          '3. The message was tampered with',
          '4. Keys were corrupted during storage/retrieval (Safari localStorage issue)'
        ]);
        return null;
      }

      console.log('[DECRYPT] ✓ Decryption successful!', decrypted.length, 'bytes');
      const decodedText = naclUtil.encodeUTF8(decrypted);
      console.log('[DECRYPT] ✓ Text decoded:', decodedText.substring(0, 50) + '...');
      return decodedText;
    } catch (error) {
      console.error('[DECRYPT] ✗ Error decrypting message:', error);
      if (error instanceof Error) {
        console.error('[DECRYPT] Error details:', {
          message: error.message,
          stack: error.stack
        });
      }
      return null;
    }
  }

  /**
   * Generate a safety number for two users (for verification)
   * @param {string} publicKey1 - First public key (base64)
   * @param {string} publicKey2 - Second public key (base64)
   * @returns {string} - Safety number
   */
  generateSafetyNumber(publicKey1: string, publicKey2: string): string {
    const fp1 = this.generateFingerprint(publicKey1);
    const fp2 = this.generateFingerprint(publicKey2);

    // Combine in consistent order
    const combined = fp1 < fp2 ? fp1 + fp2 : fp2 + fp1;

    return this.formatFingerprint(combined);
  }

  /**
   * Encrypt file data
   * @param {ArrayBuffer} fileData - File data to encrypt
   * @param {string} recipientPublicKey - Recipient's public key
   * @param {string} senderPrivateKey - Sender's private key
   * @returns {Object} - Encrypted file data and nonce
   */
  encryptFile(
    fileData: ArrayBuffer,
    recipientPublicKey: string,
    senderPrivateKey: string
  ): { encrypted: string; nonce: string } {
    const nonce = nacl.randomBytes(nacl.box.nonceLength);
    const fileBytes = new Uint8Array(fileData);

    const publicKey = naclUtil.decodeBase64(recipientPublicKey);
    const secretKey = naclUtil.decodeBase64(senderPrivateKey);

    const encrypted = nacl.box(fileBytes, nonce, publicKey, secretKey);

    return {
      encrypted: naclUtil.encodeBase64(encrypted),
      nonce: naclUtil.encodeBase64(nonce),
    };
  }

  /**
   * Decrypt file data
   * @param {string} encryptedData - Encrypted file data (base64)
   * @param {string} nonce - Nonce (base64)
   * @param {string} senderPublicKey - Sender's public key
   * @param {string} recipientPrivateKey - Recipient's private key
   * @returns {ArrayBuffer | null} - Decrypted file data
   */
  decryptFile(
    encryptedData: string,
    nonce: string,
    senderPublicKey: string,
    recipientPrivateKey: string
  ): ArrayBuffer | null {
    try {
      const encrypted = naclUtil.decodeBase64(encryptedData);
      const nonceBytes = naclUtil.decodeBase64(nonce);
      const publicKey = naclUtil.decodeBase64(senderPublicKey);
      const secretKey = naclUtil.decodeBase64(recipientPrivateKey);

      const decrypted = nacl.box.open(encrypted, nonceBytes, publicKey, secretKey);

      if (!decrypted) {
        return null;
      }

      return decrypted.buffer as ArrayBuffer;
    } catch (error) {
      console.error('Error decrypting file:', error);
      return null;
    }
  }
}

// Export singleton instance
export const encryptionService = new EncryptionService();
export default encryptionService;
