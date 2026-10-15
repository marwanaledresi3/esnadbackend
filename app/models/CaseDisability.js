// models/CaseDisability.js
const {pool} = require('../config/db');

class CaseDisability {
  static async getByCaseId(caseId) {
    const { rows } = await pool.query(
      `
      SELECT
        cd.id,
        cd.case_id,
        cd.disability_type_id,
        dt.code AS disability_type_code,
        dt.name AS disability_type_name,
        cd.severity,
        cd.diagnosed_at,
        cd.notes
      FROM case_disabilities cd
      LEFT JOIN disability_types dt ON dt.id = cd.disability_type_id
      WHERE cd.case_id = $1
      ORDER BY cd.diagnosed_at DESC NULLS LAST
      `,
      [caseId],
    );
    return rows;
  }

  static async getById(id) {
    const { rows } = await pool.query(
      `SELECT * FROM case_disabilities WHERE id = $1`,
      [id],
    );
    return rows[0] || null;
  }

  static async create(data) {
    const { rows } = await pool.query(
      `INSERT INTO case_disabilities (
         case_id, disability_type_id, severity, diagnosed_at, notes
       )
       VALUES ($1,$2,$3,$4,$5)
       RETURNING *`,
      [
        data.case_id,
        data.disability_type_id,
        data.severity || null,
        data.diagnosed_at || new Date(),
        data.notes || null,
      ],
    );
    return rows[0];
  }

  static async update(id, data) {
    const allowed = ['severity', 'diagnosed_at', 'notes', 'disability_type_id'];
    const updates = [];
    const params = [];
    let i = 1;

    for (const key of allowed) {
      if (data[key] !== undefined) {
        updates.push(`${key} = $${i}`);
        params.push(data[key]);
        i++;
      }
    }

    if (updates.length === 0) return null;
    params.push(id);

    const { rows } = await pool.query(
      `UPDATE case_disabilities SET ${updates.join(', ')}
       WHERE id = $${i} RETURNING *`,
      params,
    );
    return rows[0] || null;
  }

  static async delete(id) {
    const { rowCount } = await pool.query(
      `DELETE FROM case_disabilities WHERE id = $1`,
      [id],
    );
    return rowCount > 0;
  }

  static async getStats() {
    const { rows } = await pool.query(
      `
      SELECT
        dt.code,
        dt.name,
        COUNT(cd.id)::int AS count
      FROM disability_types dt
      LEFT JOIN case_disabilities cd ON cd.disability_type_id = dt.id
      GROUP BY dt.id, dt.code, dt.name
      ORDER BY count DESC
      `,
    );
    return rows;
  }
}

module.exports = CaseDisability;