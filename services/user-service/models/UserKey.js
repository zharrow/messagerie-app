const { pool } = require('../config/database');

class UserKey {
  // Initialize user_keys table if it doesn't exist
  static async initializeTable() {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS user_keys (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          device_id VARCHAR(255) NOT NULL,
          public_key TEXT NOT NULL,
          key_fingerprint VARCHAR(255) NOT NULL,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, device_id)
        );
      `);

      // Create index for faster lookups
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_user_keys_user_id ON user_keys(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_keys_active ON user_keys(user_id, is_active);
      `);

      console.log('user_keys table initialized');
    } catch (error) {
      console.error('Error initializing user_keys table:', error);
    }
  }

  // Store a new public key for a user device
  static async create({ user_id, device_id, public_key, key_fingerprint }) {
    const result = await pool.query(
      `INSERT INTO user_keys (user_id, device_id, public_key, key_fingerprint)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, device_id)
       DO UPDATE SET
         public_key = EXCLUDED.public_key,
         key_fingerprint = EXCLUDED.key_fingerprint,
         is_active = true,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [user_id, device_id, public_key, key_fingerprint]
    );
    return result.rows[0];
  }

  // Get all active keys for a user
  static async findByUserId(user_id) {
    const result = await pool.query(
      `SELECT id, user_id, device_id, public_key, key_fingerprint, is_active, created_at, updated_at
       FROM user_keys
       WHERE user_id = $1 AND is_active = true
       ORDER BY created_at DESC`,
      [user_id]
    );
    return result.rows;
  }

  // Get a specific device key
  static async findByUserAndDevice(user_id, device_id) {
    const result = await pool.query(
      `SELECT id, user_id, device_id, public_key, key_fingerprint, is_active, created_at, updated_at
       FROM user_keys
       WHERE user_id = $1 AND device_id = $2 AND is_active = true`,
      [user_id, device_id]
    );
    return result.rows[0] || null;
  }

  // Get public keys for multiple users (for group encryption)
  static async findByUserIds(user_ids) {
    const result = await pool.query(
      `SELECT user_id, device_id, public_key, key_fingerprint
       FROM user_keys
       WHERE user_id = ANY($1) AND is_active = true
       ORDER BY user_id, created_at DESC`,
      [user_ids]
    );
    return result.rows;
  }

  // Deactivate a device key
  static async deactivateKey(user_id, device_id) {
    const result = await pool.query(
      `UPDATE user_keys
       SET is_active = false, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND device_id = $2
       RETURNING *`,
      [user_id, device_id]
    );
    return result.rows[0] || null;
  }

  // Delete all keys for a user (when account is deleted)
  static async deleteByUserId(user_id) {
    await pool.query(
      `DELETE FROM user_keys WHERE user_id = $1`,
      [user_id]
    );
  }
}

module.exports = UserKey;
