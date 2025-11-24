const { pool } = require('../config/database');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

class User {
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
      `SELECT id, email, first_name, last_name, created_at, updated_at
       FROM users WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByEmail(email) {
    const result = await pool.query(
      `SELECT id, email, password_hash, first_name, last_name, created_at, updated_at
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
       RETURNING id, email, first_name, last_name, updated_at`,
      [first_name, last_name, id]
    );
    return result.rows[0] || null;
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = User;
