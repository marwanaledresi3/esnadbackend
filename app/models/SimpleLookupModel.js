// models/SimpleLookupModel.js
const {pool} = require('../config/db');

class SimpleLookupModel {
  constructor(tableName) {
    this.tableName = tableName;
  }

  async getAll() {
    const { rows } = await pool.query(
      `SELECT id, code, name FROM ${this.tableName} ORDER BY name ASC`,
    );
    return rows;
  }

  async getById(id) {
    const { rows } = await pool.query(
      `SELECT id, code, name FROM ${this.tableName} WHERE id = $1`,
      [id],
    );
    return rows[0] || null;
  }

  async getByCode(code) {
    const { rows } = await pool.query(
      `SELECT id, code, name FROM ${this.tableName} WHERE code = $1`,
      [code],
    );
    return rows[0] || null;
  }

  async create({ code, name }) {
    const { rows } = await pool.query(
      `INSERT INTO ${this.tableName} (code, name)
       VALUES ($1, $2)
       RETURNING id, code, name`,
      [code, name],
    );
    return rows[0];
  }

  async update(id, { name }) {
    const { rows } = await pool.query(
      `UPDATE ${this.tableName}
       SET name = COALESCE($1, name)
       WHERE id = $2
       RETURNING id, code, name`,
      [name, id],
    );
    return rows[0] || null;
  }

  async disable(id) {
    const { rows } = await pool.query(
      `DELETE FROM ${this.tableName}
       WHERE id = $1
       RETURNING id, code, name`,
      [id],
    );
    return rows[0] || null;
  }
}

module.exports = SimpleLookupModel;