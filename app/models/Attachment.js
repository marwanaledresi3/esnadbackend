const { pool } = require('../config/db');

class Attachment {
  static async create({ case_id, file_name, file_url, file_type, public_id, uploaded_by_user_id }, client = pool) {
    const query = `
      INSERT INTO attachments (case_id, file_name, file_url, file_type, public_id, uploaded_by_user_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [case_id, file_name, file_url, file_type || 'DOCUMENT', public_id || null, uploaded_by_user_id];
    const res = await client.query(query, values);
    return res.rows[0];
  }

  static async findByCaseId(caseId) {
    const query = `
      SELECT a.*, u.full_name AS uploader_name 
      FROM attachments a
      LEFT JOIN users u ON a.uploaded_by_user_id = u.user_id
      WHERE a.case_id = $1
      ORDER BY a.created_at DESC
    `;
    const res = await pool.query(query, [caseId]);
    return res.rows;
  }
}

module.exports = Attachment;