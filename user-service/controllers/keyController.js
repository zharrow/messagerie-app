const UserKey = require('../models/UserKey');

// Upload/update public key for current device
const uploadPublicKey = async (req, res) => {
  try {
    const { device_id, public_key, key_fingerprint } = req.body;
    const user_id = req.user.id;

    if (!device_id || !public_key || !key_fingerprint) {
      return res.status(400).json({
        error: 'device_id, public_key, and key_fingerprint are required'
      });
    }

    // Validate public key format (base64 encoded, 32 bytes = 44 chars in base64)
    if (public_key.length !== 44) {
      return res.status(400).json({
        error: 'Invalid public key format'
      });
    }

    const key = await UserKey.create({
      user_id,
      device_id,
      public_key,
      key_fingerprint
    });

    res.status(201).json({
      message: 'Public key uploaded successfully',
      key: {
        id: key.id,
        device_id: key.device_id,
        key_fingerprint: key.key_fingerprint,
        created_at: key.created_at
      }
    });
  } catch (error) {
    console.error('Error uploading public key:', error);
    res.status(500).json({ error: 'Failed to upload public key' });
  }
};

// Get public keys for a specific user (by other users for encryption)
const getUserPublicKeys = async (req, res) => {
  try {
    const { userId } = req.params;

    const keys = await UserKey.findByUserId(parseInt(userId));

    res.json({
      user_id: parseInt(userId),
      keys: keys.map(k => ({
        device_id: k.device_id,
        public_key: k.public_key,
        key_fingerprint: k.key_fingerprint
      }))
    });
  } catch (error) {
    console.error('Error fetching public keys:', error);
    res.status(500).json({ error: 'Failed to fetch public keys' });
  }
};

// Get public keys for multiple users (for group conversations)
const getBulkPublicKeys = async (req, res) => {
  try {
    const { user_ids } = req.body;

    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      return res.status(400).json({ error: 'user_ids array is required' });
    }

    const keys = await UserKey.findByUserIds(user_ids);

    // Group keys by user_id
    const keysByUser = {};
    keys.forEach(key => {
      if (!keysByUser[key.user_id]) {
        keysByUser[key.user_id] = [];
      }
      keysByUser[key.user_id].push({
        device_id: key.device_id,
        public_key: key.public_key,
        key_fingerprint: key.key_fingerprint
      });
    });

    res.json({ keys: keysByUser });
  } catch (error) {
    console.error('Error fetching bulk public keys:', error);
    res.status(500).json({ error: 'Failed to fetch public keys' });
  }
};

// Get current user's own keys (for device management)
const getMyKeys = async (req, res) => {
  try {
    const user_id = req.user.id;
    const keys = await UserKey.findByUserId(user_id);

    res.json({
      keys: keys.map(k => ({
        id: k.id,
        device_id: k.device_id,
        key_fingerprint: k.key_fingerprint,
        is_active: k.is_active,
        created_at: k.created_at
      }))
    });
  } catch (error) {
    console.error('Error fetching user keys:', error);
    res.status(500).json({ error: 'Failed to fetch keys' });
  }
};

// Deactivate a device key
const deactivateKey = async (req, res) => {
  try {
    const { device_id } = req.params;
    const user_id = req.user.id;

    const key = await UserKey.deactivateKey(user_id, device_id);

    if (!key) {
      return res.status(404).json({ error: 'Key not found' });
    }

    res.json({
      message: 'Key deactivated successfully',
      device_id: key.device_id
    });
  } catch (error) {
    console.error('Error deactivating key:', error);
    res.status(500).json({ error: 'Failed to deactivate key' });
  }
};

module.exports = {
  uploadPublicKey,
  getUserPublicKeys,
  getBulkPublicKeys,
  getMyKeys,
  deactivateKey
};
