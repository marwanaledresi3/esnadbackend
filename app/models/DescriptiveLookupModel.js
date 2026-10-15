// models/DescriptiveLookupModel.js
const {pool} = require('../config/db');

class DescriptiveLookupModel {
  constructor(tableName) {
    this.tableName = tableName;
  }

  async getAll({ activeOnly = true } = {}) {
    let query = `SELECT id, code, name, description, status, created_at FROM ${this.tableName}`;
    const values = [];

    if (activeOnly) {
      query += ` WHERE status = $1`;
      values.push('active');
    }
    query += ` ORDER BY name ASC`;

    const { rows } = await pool.query(query, values);
    return rows;
  }

  async getById(id) {
    const { rows } = await pool.query(
      `SELECT id, code, name, description, status, created_at FROM ${this.tableName} WHERE id = $1`,
      [id],
    );
    return rows[0] || null;
  }

  async getByCode(code) {
    const { rows } = await pool.query(
      `SELECT id, code, name, description, status, created_at FROM ${this.tableName} WHERE code = $1`,
      [code],
    );
    return rows[0] || null;
  }

  async create({ code, name, description, status = 'active' }) {
    const { rows } = await pool.query(
      `INSERT INTO ${this.tableName} (code, name, description, status)
       VALUES ($1, $2, $3, $4)
       RETURNING id, code, name, description, status, created_at`,
      [code, name, description, status],
    );
    return rows[0];
  }

  async update(id, { name, description, status }) {
    const { rows } = await pool.query(
      `UPDATE ${this.tableName}
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           status = COALESCE($3, status)
       WHERE id = $4
       RETURNING id, code, name, description, status`,
      [name, description, status, id],
    );
    return rows[0] || null;
  }

  async disable(id) {
    const { rows } = await pool.query(
      `UPDATE ${this.tableName}
       SET status = 'inactive'
       WHERE id = $1
       RETURNING id, code, name, status`,
      [id],
    );
    return rows[0] || null;
  }
}

module.exports = DescriptiveLookupModel;