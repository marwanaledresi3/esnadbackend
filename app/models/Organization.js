const { pool } = require('../config/db');

class Organization {
  static async create({ name, type, code, phone, address }, client = pool) {
    const query = `
      INSERT INTO organizations (name, type, code, phone, address, is_active)
      VALUES ($1, $2, $3, $4, $5, true)
      RETURNING *
    `;
    const res = await client.query(query, [name, type, code || null, phone || null, address || null]);
    return res.rows[0];
  }

  static async findAll() {
    const query = `SELECT * FROM organizations WHERE is_active = true ORDER BY name ASC`;
    const res = await pool.query(query);
    return res.rows;
  }
}

module.exports = Organization;