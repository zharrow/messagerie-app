const nacl = require('tweetnacl');
const naclUtil = require('tweetnacl-util');
const axios = require('axios');

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:3001';
const INTERNAL_SECRET = process.env.INTERNAL_SECRET;

/**
 * Encryption service for handling E2EE message operations
 *
 * Note: This service primarily validates and routes encrypted messages.
 * Actual encryption/decryption happens client-side.
 */
class EncryptionService {
  /**
   * Fetch public keys for users in a conversation
   * @param {Array<number>} userIds - Array of user IDs
   * @returns {Promise<Object>} - Map of userId to their public keys
   */
  static async fetchPublicKeys(userIds) {
    try {
      const response = await axios.post(
        `${USER_SERVICE_URL}/users/keys/bulk`,
        { user_ids: userIds },
        {
          headers: {
            'X-Internal-Secret': INTERNAL_SECRET
          }
        }
      );

      return response.data.keys;
    } catch (error) {
      console.error('Error fetching public keys:', error.message);
      throw new Error('Failed to fetch encryption keys');
    }
  }

  /**
   * Validate encrypted message structure
   * @param {Object} encryptedMessage - The encrypted message object
   * @returns {boolean} - True if valid
   */
  static validateEncryptedMessage(encryptedMessage) {
    const { encrypted, encryptedPayloads, nonce, senderDeviceId } = encryptedMessage;

    if (!encrypted) {
      return false;
    }

    if (!encryptedPayloads || typeof encryptedPayloads !== 'object') {
      return false;
    }

    if (!nonce || typeof nonce !== 'string') {
      return false;
    }

    if (!senderDeviceId || typeof senderDeviceId !== 'string') {
      return false;
    }

    return true;
  }

  /**
   * Generate a fingerprint for a public key (for verification)
   * @param {string} publicKeyBase64 - Base64 encoded public key
   * @returns {string} - Hex fingerprint
   */
  static generateFingerprint(publicKeyBase64) {
    try {
      const publicKey = naclUtil.decodeBase64(publicKeyBase64);
      const hash = nacl.hash(publicKey);
      // Return first 32 bytes as hex
      return Buffer.from(hash.slice(0, 32)).toString('hex');
    } catch (error) {
      console.error('Error generating fingerprint:', error);
      return null;
    }
  }

  /**
   * Format fingerprint for display (like Signal's safety numbers)
   * @param {string} fingerprint - Hex fingerprint
   * @returns {string} - Formatted fingerprint
   */
  static formatFingerprint(fingerprint) {
    if (!fingerprint || fingerprint.length < 60) {
      return fingerprint;
    }

    // Format as groups of 5 digits
    const digits = fingerprint.substring(0, 60);
    const groups = digits.match(/.{1,5}/g) || [];
    return groups.join(' ');
  }

  /**
   * Verify safety number between two users
   * @param {string} publicKey1 - First user's public key (base64)
   * @param {string} publicKey2 - Second user's public key (base64)
   * @returns {string} - Combined safety number
   */
  static generateSafetyNumber(publicKey1, publicKey2) {
    try {
      const fp1 = this.generateFingerprint(publicKey1);
      const fp2 = this.generateFingerprint(publicKey2);

      // Combine fingerprints in consistent order
      const combined = fp1 < fp2 ? fp1 + fp2 : fp2 + fp1;

      return this.formatFingerprint(combined);
    } catch (error) {
      console.error('Error generating safety number:', error);
      return null;
    }
  }

  /**
   * Check if a message should be encrypted based on conversation settings
   * @param {Object} conversation - The conversation object
   * @returns {boolean} - True if encryption should be enabled
   */
  static shouldEncrypt(conversation) {
    // For now, all conversations support encryption
    // In the future, this could check conversation.encryptionEnabled flag
    return true;
  }

  /**
   * Prepare encrypted message for storage
   * Server stores encrypted payloads without being able to decrypt
   * @param {Object} messageData - Message data from client
   * @returns {Object} - Prepared message for MongoDB
   */
  static prepareEncryptedMessage(messageData) {
    const {
      from,
      encrypted,
      encryptedPayloads,
      nonce,
      senderDeviceId,
      attachments = [],
      replyTo = null
    } = messageData;

    // Validate encrypted message structure
    if (!this.validateEncryptedMessage(messageData)) {
      throw new Error('Invalid encrypted message format');
    }

    return {
      from,
      content: '[Encrypted Message]', // Placeholder for server logs/search
      encrypted: true,
      encryptedPayloads: new Map(Object.entries(encryptedPayloads)),
      nonce,
      senderDeviceId,
      attachments: attachments.map(att => ({
        ...att,
        encrypted: att.encrypted || false,
        encryptedData: att.encryptedData || null
      })),
      replyTo,
      readBy: [],
      reactions: [],
      createdAt: new Date()
    };
  }

  /**
   * Convert encrypted message for client response
   * @param {Object} message - Message from MongoDB
   * @param {number} recipientUserId - User ID requesting the message
   * @returns {Object} - Message formatted for client
   */
  static formatEncryptedMessageForClient(message, recipientUserId) {
    if (!message.encrypted) {
      // Not encrypted, return as-is
      return message;
    }

    // Convert Map to object for JSON serialization
    const encryptedPayloads = message.encryptedPayloads
      ? Object.fromEntries(message.encryptedPayloads)
      : {};

    return {
      ...message.toObject(),
      encryptedPayloads
    };
  }
}

module.exports = EncryptionService;
