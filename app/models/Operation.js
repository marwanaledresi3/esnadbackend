// models/Operation.js
const {pool} = require('../config/db');

class Operation {
  static async getByCaseId(caseId) {
    const { rows } = await pool.query(
      `
      SELECT
        o.*,
        ot.code AS operation_type_code,
        ot.name AS operation_type_name
      FROM operations o
      LEFT JOIN operation_types ot ON ot.id = o.operation_type_id
      WHERE o.case_id = $1
      ORDER BY o.start_datetime DESC NULLS LAST
      `,
      [caseId],
    );
    return rows;
  }

  static async create(data) {
    const { rows } = await pool.query(
      `INSERT INTO operations (
         case_id, event_id, operation_type_id,
         start_datetime, end_datetime, outcome, notes
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [
        data.case_id,
        data.event_id || null,
        data.operation_type_id,
        data.start_datetime || null,
        data.end_datetime || null,
        data.outcome || null,
        data.notes || null,
      ],
    );
    return rows[0];
  }

  static async delete(id) {
    const { rowCount } = await pool.query(`DELETE FROM operations WHERE id = $1`, [id]);
    return rowCount > 0;
  }
}

module.exports = Operation;