// models/Report.js
const {pool} = require('../config/db');

class Report {
  static async getAll({
    status, report_type_id, organization_id, generated_by,
    from_date, to_date, search, limit = 100, offset = 0,
  } = {}) {
    let query = `
      SELECT
        r.id,
        r.report_number,
        r.report_type_id,
        rt.code AS report_type_code,
        rt.name AS report_type_name,
        r.organization_id,
        o.name AS organization_name,
        r.period_from,
        r.period_to,
        r.generated_by,
        u.full_name AS generated_by_name,
        r.generated_at,
        r.status,
        r.file_document_id,
        d.title AS file_document_title,
        d.file_reference AS file_reference,
        r.notes
      FROM reports r
      LEFT JOIN report_types rt ON rt.id = r.report_type_id
      LEFT JOIN organizations o ON o.id = r.organization_id
      LEFT JOIN users u ON u.id = r.generated_by
      LEFT JOIN documents d ON d.id = r.file_document_id
      WHERE 1=1
    `;
    const params = [];
    let i = 1;

    if (status) {
      query += ` AND r.status = $${i}`;
      params.push(status);
      i++;
    }
    if (report_type_id) {
      query += ` AND r.report_type_id = $${i}`;
      params.push(report_type_id);
      i++;
    }
    if (organization_id) {
      query += ` AND r.organization_id = $${i}`;
      params.push(organization_id);
      i++;
    }
    if (generated_by) {
      query += ` AND r.generated_by = $${i}`;
      params.push(generated_by);
      i++;
    }
    if (from_date) {
      query += ` AND r.generated_at >= $${i}`;
      params.push(from_date);
      i++;
    }
    if (to_date) {
      query += ` AND r.generated_at <= $${i}`;
      params.push(to_date);
      i++;
    }
    if (search) {
      query += ` AND r.report_number ILIKE $${i}`;
      params.push(`%${search}%`);
      i++;
    }

    query += ` ORDER BY r.generated_at DESC LIMIT $${i} OFFSET $${i + 1}`;
    params.push(limit, offset);

    const { rows } = await pool.query(query, params);
    return rows;
  }

  static async getById(id) {
    const { rows } = await pool.query(
      `
      SELECT
        r.*,
        rt.code AS report_type_code,
        rt.name AS report_type_name,
        o.name AS organization_name,
        u.full_name AS generated_by_name,
        d.title AS file_document_title,
        d.file_reference AS file_reference
      FROM reports r
      LEFT JOIN report_types rt ON rt.id = r.report_type_id
      LEFT JOIN organizations o ON o.id = r.organization_id
      LEFT JOIN users u ON u.id = r.generated_by
      LEFT JOIN documents d ON d.id = r.file_document_id
      WHERE r.id = $1
      `,
      [id],
    );
    if (rows.length === 0) return null;

    const report = rows[0];

    // جلب المشاركات
    const { rows: shares } = await pool.query(
      `SELECT * FROM report_shares WHERE report_id = $1`,
      [id],
    );
    report.shares = shares;

    return report;
  }

  static async generateNumber() {
    const year = new Date().getFullYear();
    const pattern = `RPT-${year}-%`;
    const { rows } = await pool.query(
      `SELECT report_number FROM reports
       WHERE report_number LIKE $1 ORDER BY report_number DESC LIMIT 1`,
      [pattern],
    );
    let next = 1;
    if (rows.length > 0) {
      const parts = rows[0].report_number.split('-');
      const n = parseInt(parts[parts.length - 1], 10);
      if (!Number.isNaN(n)) next = n + 1;
    }
    return `RPT-${year}-${String(next).padStart(5, '0')}`;
  }

  static async create(data) {
    let number = data.report_number;
    if (!number) number = await Report.generateNumber();

    const { rows } = await pool.query(
      `INSERT INTO reports (
         report_number, report_type_id, organization_id,
         period_from, period_to, generated_by, status,
         file_document_id, notes
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [
        number,
        data.report_type_id,
        data.organization_id,
        data.period_from || null,
        data.period_to || null,
        data.generated_by || null,
        data.status || 'generated',
        data.file_document_id || null,
        data.notes || null,
      ],
    );
    return rows[0];
  }

  static async update(id, data) {
    const allowed = ['status', 'file_document_id', 'notes'];
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
      `UPDATE reports SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`,
      params,
    );
    return rows[0] || null;
  }

  static async delete(id) {
    const { rowCount } = await pool.query(`DELETE FROM reports WHERE id = $1`, [id]);
    return rowCount > 0;
  }

  // ==================== Shares ====================
  static async share(reportId, orgId, userId, permission) {
    const { rows } = await pool.query(
      `INSERT INTO report_shares (
         report_id, shared_with_organization_id, shared_by_user_id, permission, status
       )
       VALUES ($1,$2,$3,$4,'active')
       ON CONFLICT (report_id, shared_with_organization_id) DO UPDATE
       SET status = 'active', permission = EXCLUDED.permission, shared_at = now()
       RETURNING *`,
      [reportId, orgId, userId, permission || 'view'],
    );
    return rows[0];
  }

  static async revokeShare(shareId, reason) {
    const { rows } = await pool.query(
      `UPDATE report_shares
       SET status = 'revoked', revoked_at = now(), reason = $1
       WHERE id = $2 RETURNING *`,
      [reason || null, shareId],
    );
    return rows[0] || null;
  }

  static async getSharedWith(organizationId) {
    const { rows } = await pool.query(
      `
      SELECT
        rs.*,
        r.report_number,
        r.report_type_id,
        rt.name AS report_type_name,
        r.period_from,
        r.period_to
      FROM report_shares rs
      INNER JOIN reports r ON r.id = rs.report_id
      LEFT JOIN report_types rt ON rt.id = r.report_type_id
      WHERE rs.shared_with_organization_id = $1
        AND rs.status = 'active'
      ORDER BY rs.shared_at DESC
      `,
      [organizationId],
    );
    return rows;
  }
}

module.exports = Report;