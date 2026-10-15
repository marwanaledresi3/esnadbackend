// models/ReportRequest.js
const {pool} = require('../config/db');

class ReportRequest {
  static async getAll({ status, user_id, organization_id, limit = 100, offset = 0 } = {}) {
    let query = `
      SELECT
        rr.*,
        u.full_name AS user_name,
        o.name AS organization_name,
        rt.name AS report_type_name,
        rt.code AS report_type_code
      FROM report_requests rr
      LEFT JOIN users u ON u.id = rr.user_id
      LEFT JOIN organizations o ON o.id = rr.organization_id
      LEFT JOIN report_types rt ON rt.id = rr.report_type_id
      WHERE 1=1
    `;
    const params = [];
    let i = 1;
    if (status) { query += ` AND rr.status = $${i}`; params.push(status); i++; }
    if (user_id) { query += ` AND rr.user_id = $${i}`; params.push(user_id); i++; }
    if (organization_id) { query += ` AND rr.organization_id = $${i}`; params.push(organization_id); i++; }

    query += ` ORDER BY rr.requested_at DESC LIMIT $${i} OFFSET $${i + 1}`;
    params.push(limit, offset);

    const { rows } = await pool.query(query, params);
    return rows;
  }

  static async getById(id) {
    const { rows } = await pool.query(`SELECT * FROM report_requests WHERE id = $1`, [id]);
    return rows[0] || null;
  }

  static async create(data) {
    const { rows } = await pool.query(
      `INSERT INTO report_requests (
         user_id, organization_id, report_type_id,
         period_from, period_to, filters, status
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [
        data.user_id,
        data.organization_id,
        data.report_type_id,
        data.period_from || null,
        data.period_to || null,
        data.filters ? JSON.stringify(data.filters) : null,
        data.status || 'pending',
      ],
    );
    return rows[0];
  }

  static async updateStatus(id, status) {
    const { rows } = await pool.query(
      `UPDATE report_requests
       SET status = $1,
           completed_at = CASE WHEN $1 = 'completed' THEN now() ELSE completed_at END
       WHERE id = $2 RETURNING *`,
      [status, id],
    );
    return rows[0] || null;
  }

  static async delete(id) {
    const { rowCount } = await pool.query(`DELETE FROM report_requests WHERE id = $1`, [id]);
    return rowCount > 0;
  }
}

module.exports = ReportRequest;