const { pool } = require('../config/db');

class Department {
  static async create({ organization_id, name, code }, client = pool) {
    const query = `
      INSERT INTO departments (organization_id, name, code)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const res = await client.query(query, [organization_id, name, code || null]);
    return res.rows[0];
  }

  static async findByOrganization(organizationId) {
    const query = `SELECT * FROM departments WHERE organization_id = $1 ORDER BY name ASC`;
    const res = await pool.query(query, [organizationId]);
    return res.rows;
  }
}

module.Department = Department;
module.exports = Department;