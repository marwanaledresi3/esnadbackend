const { pool } = require('../config/db');
// models/SharedRecord.js

class SharedRecord {
  static async getAll({
    case_id,
    shared_with_organization_id,
    shared_by_user_id,
    status,
    limit = 100,
    offset = 0,
  } = {}) {
    let query = `
      SELECT
        sr.id,
        sr.case_id,
        c.case_number,
        c.case_type,
        c.case_status,
        p.full_name AS person_name,
        p.person_number,
        sr.shared_with_organization_id,
        o.name AS shared_with_organization_name,
        sr.shared_by_user_id,
        u.full_name AS shared_by_user_name,
        sr.status,
        sr.shared_at,
        sr.revoked_at,
        sr.reason
      FROM shared_records sr
      LEFT JOIN cases c ON c.id = sr.case_id
      LEFT JOIN persons p ON p.id = c.person_id
      LEFT JOIN organizations o ON o.id = sr.shared_with_organization_id
      LEFT JOIN users u ON u.id = sr.shared_by_user_id
      WHERE 1=1
    `;
    const params = [];
    let i = 1;

    if (case_id) {
      query += ` AND sr.case_id = $${i}`;
      params.push(case_id);
      i++;
    }
    if (shared_with_organization_id) {
      query += ` AND sr.shared_with_organization_id = $${i}`;
      params.push(shared_with_organization_id);
      i++;
    }
    if (shared_by_user_id) {
      query += ` AND sr.shared_by_user_id = $${i}`;
      params.push(shared_by_user_id);
      i++;
    }
    if (status) {
      query += ` AND sr.status = $${i}`;
      params.push(status);
      i++;
    }

    query += ` ORDER BY sr.shared_at DESC LIMIT $${i} OFFSET $${i + 1}`;
    params.push(limit, offset);

    const { rows } = await pool.query(query, params);
    return rows;
  }

  static async getById(id) {
    const { rows } = await pool.query(
      `
      SELECT
        sr.*,
        c.case_number,
        c.case_type,
        c.case_status,
        p.full_name AS person_name,
        p.person_number,
        o.name AS shared_with_organization_name,
        u.full_name AS shared_by_user_name
      FROM shared_records sr
      LEFT JOIN cases c ON c.id = sr.case_id
      LEFT JOIN persons p ON p.id = c.person_id
      LEFT JOIN organizations o ON o.id = sr.shared_with_organization_id
      LEFT JOIN users u ON u.id = sr.shared_by_user_id
      WHERE sr.id = $1
      `,
      [id],
    );
    return rows[0] || null;
  }

  /**
   * الحالات المُشاركة مع جهة معيّنة
   */
  static async getSharedWithOrganization(organizationId) {
    const { rows } = await pool.query(
      `
      SELECT
        sr.id,
        sr.case_id,
        c.case_number,
        c.case_type,
        c.case_status,
        c.arrival_datetime,
        c.opened_at,
        p.full_name AS person_name,
        p.person_number,
        sr.shared_at,
        u.full_name AS shared_by_user_name
      FROM shared_records sr
      INNER JOIN cases c ON c.id = sr.case_id
      LEFT JOIN persons p ON p.id = c.person_id
      LEFT JOIN users u ON u.id = sr.shared_by_user_id
      WHERE sr.shared_with_organization_id = $1
        AND sr.status = 'active'
      ORDER BY sr.shared_at DESC
      `,
      [organizationId],
    );
    return rows;
  }

  static async create(data) {
    const { rows } = await pool.query(
      `INSERT INTO shared_records (
         case_id, shared_with_organization_id,
         shared_by_user_id, status
       )
       VALUES ($1,$2,$3,'active')
       ON CONFLICT (case_id, shared_with_organization_id)
         WHERE status = 'active'
       DO UPDATE
       SET status = 'active',
           shared_at = now(),
           revoked_at = NULL,
           reason = NULL,
           shared_by_user_id = EXCLUDED.shared_by_user_id
       RETURNING *`,
      [
        data.case_id,
        data.shared_with_organization_id,
        data.shared_by_user_id,
      ],
    );
    return rows[0];
  }

  static async revoke(id, reason = null) {
    const { rows } = await pool.query(
      `UPDATE shared_records
       SET status = 'revoked',
           revoked_at = now(),
           reason = $1
       WHERE id = $2
       RETURNING *`,
      [reason, id],
    );
    return rows[0] || null;
  }

  static async delete(id) {
    const { rowCount } = await pool.query(
      `DELETE FROM shared_records WHERE id = $1`,
      [id],
    );
    return rowCount > 0;
  }

  static async count() {
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS total FROM shared_records WHERE status = 'active'`,
    );
    return rows[0]?.total ?? 0;
  }
}

module.exports = SharedRecord;