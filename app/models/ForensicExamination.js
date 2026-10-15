// models/ForensicExamination.js
const {pool} = require('../config/db');

class ForensicExamination {
  static async getByRequestId(requestId) {
    const { rows } = await pool.query(
      `
      SELECT
        fe.*,
        h.name AS hospital_name,
        d.title AS report_title,
        d.file_reference AS report_file
      FROM forensic_examinations fe
      LEFT JOIN organizations h ON h.id = fe.hospital_id
      LEFT JOIN documents d ON d.id = fe.report_document_id
      WHERE fe.forensic_request_id = $1
      ORDER BY fe.started_at DESC NULLS LAST, fe.issued_at DESC
      `,
      [requestId],
    );
    return rows;
  }

  static async getById(id) {
    const { rows } = await pool.query(
      `
      SELECT
        fe.*,
        h.name AS hospital_name,
        d.title AS report_title
      FROM forensic_examinations fe
      LEFT JOIN organizations h ON h.id = fe.hospital_id
      LEFT JOIN documents d ON d.id = fe.report_document_id
      WHERE fe.id = $1
      `,
      [id],
    );
    return rows[0] || null;
  }

  static async create({
    forensic_request_id,
    started_at,
    completed_at,
    examiner,
    result_status,
    report_document_id,
    notes,
    hospital_id,
  }) {
    const { rows } = await pool.query(
      `INSERT INTO forensic_examinations (
         forensic_request_id, started_at, completed_at,
         examiner, result_status, report_document_id,
         notes, hospital_id
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [
        forensic_request_id,
        started_at || null,
        completed_at || null,
        examiner || null,
        result_status || null,
        report_document_id || null,
        notes || null,
        hospital_id || null,
      ],
    );
    return rows[0];
  }

  static async update(id, data) {
    const allowed = [
      'started_at',
      'completed_at',
      'examiner',
      'result_status',
      'report_document_id',
      'notes',
      'hospital_id',
    ];
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
      `UPDATE forensic_examinations SET ${updates.join(', ')}
       WHERE id = $${i} RETURNING *`,
      params,
    );
    return rows[0] || null;
  }

  static async delete(id) {
    const { rowCount } = await pool.query(
      `DELETE FROM forensic_examinations WHERE id = $1`,
      [id],
    );
    return rowCount > 0;
  }

  static async countByRequest(requestId) {
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS total FROM forensic_examinations
       WHERE forensic_request_id = $1`,
      [requestId],
    );
    return rows[0]?.total ?? 0;
  }
}

module.exports = ForensicExamination;