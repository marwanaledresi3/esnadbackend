// models/Diagnosis.js
const {pool} = require('../config/db');

class Diagnosis {
  static async getByCaseId(caseId) {
    const { rows } = await pool.query(
      `
      SELECT
        d.*,
        dt.code AS diagnosis_type_code,
        dt.name AS diagnosis_type_name
      FROM diagnoses d
      LEFT JOIN diagnosis_types dt ON dt.id = d.diagnosis_type_id
      WHERE d.case_id = $1
      ORDER BY d.is_primary DESC, d.diagnosed_at DESC
      `,
      [caseId],
    );
    return rows;
  }

  static async create(data) {
    // إذا كان primary، ألغِ primary من الآخرين
    if (data.is_primary) {
      await pool.query(`UPDATE diagnoses SET is_primary = false WHERE case_id = $1`, [data.case_id]);
    }
    const { rows } = await pool.query(
      `INSERT INTO diagnoses (case_id, diagnosis_type_id, diagnosed_at, is_primary, notes)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [
        data.case_id,
        data.diagnosis_type_id,
        data.diagnosed_at || new Date(),
        data.is_primary === true,
        data.notes || null,
      ],
    );
    return rows[0];
  }

  static async delete(id) {
    const { rowCount } = await pool.query(`DELETE FROM diagnoses WHERE id = $1`, [id]);
    return rowCount > 0;
  }
}

module.exports = Diagnosis;