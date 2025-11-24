const { pool } = require('../config/database');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

// Valid status values
const VALID_STATUSES = ['online', 'offline', 'busy', 'away'];

class User {
  // Initialize profile columns if they don't exist
  static async initializeProfileColumns() {
    try {
      await pool.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'profile_photo_url') THEN
            ALTER TABLE users ADD COLUMN profile_photo_url VARCHAR(500);
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'bio') THEN
            ALTER TABLE users ADD COLUMN bio TEXT;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'status') THEN
            ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'offline';
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'status_message') THEN
            ALTER TABLE users ADD COLUMN status_message VARCHAR(255);
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_seen_at') THEN
            ALTER TABLE users ADD COLUMN last_seen_at TIMESTAMP;
          END IF;
        END $$;
      `);
    } catch (error) {
      console.error('Error initializing profile columns:', error);
    }
  }

  static async create({ email, password, first_name, last_name }) {
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, first_name, last_name, created_at`,
      [email, password_hash, first_name, last_name]
    );

    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query(
      `SELECT id, email, first_name, last_name, profile_photo_url, bio, status, status_message, last_seen_at, created_at, updated_at
       FROM users WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByEmail(email) {
    const result = await pool.query(
      `SELECT id, email, password_hash, first_name, last_name, profile_photo_url, bio, status, status_message, created_at, updated_at
       FROM users WHERE email = $1`,
      [email]
    );
    return result.rows[0] || null;
  }

  static async update(id, { first_name, last_name }) {
    const result = await pool.query(
      `UPDATE users
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, email, first_name, last_name, profile_photo_url, bio, status, status_message, updated_at`,
      [first_name, last_name, id]
    );
    return result.rows[0] || null;
  }

  static async updateProfile(id, { profile_photo_url, bio }) {
    const result = await pool.query(
      `UPDATE users
       SET profile_photo_url = COALESCE($1, profile_photo_url),
           bio = COALESCE($2, bio),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, email, first_name, last_name, profile_photo_url, bio, status, status_message, updated_at`,
      [profile_photo_url, bio, id]
    );
    return result.rows[0] || null;
  }

  static async updateStatus(id, { status, status_message }) {
    // Validate status
    if (status && !VALID_STATUSES.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
    }

    const result = await pool.query(
      `UPDATE users
       SET status = COALESCE($1, status),
           status_message = $2,
           last_seen_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, email, first_name, last_name, profile_photo_url, bio, status, status_message, last_seen_at, updated_at`,
      [status, status_message, id]
    );
    return result.rows[0] || null;
  }

  static async updateLastSeen(id) {
    const result = await pool.query(
      `UPDATE users
       SET last_seen_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, last_seen_at`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  static async findAll(excludeUserId = null) {
    let query = `SELECT id, email, first_name, last_name, profile_photo_url, bio, status, status_message, last_seen_at, created_at FROM users`;
    const params = [];

    if (excludeUserId) {
      query += ` WHERE id != $1`;
      params.push(excludeUserId);
    }

    query += ` ORDER BY first_name, last_name`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async getProfile(id) {
    const result = await pool.query(
      `SELECT id, email, first_name, last_name, profile_photo_url, bio, status, status_message, last_seen_at, created_at
       FROM users WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }
}

module.exports = User;
