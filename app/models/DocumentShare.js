// models/DocumentShare.js
const {pool} = require('../config/db');

class DocumentShare {
  static async getAll({
    document_id,
    shared_with_organization_id,
    shared_by_user_id,
    status,
    limit = 100,
    offset = 0,
  } = {}) {
    let query = `
      SELECT
        ds.id,
        ds.document_id,
        d.title AS document_title,
        d.document_number,
        ds.shared_with_organization_id,
        o.name AS shared_with_organization_name,
        ds.shared_by_user_id,
        u.full_name AS shared_by_user_name,
        ds.permission,
        ds.status,
        ds.shared_at,
        ds.revoked_at,
        ds.reason
      FROM document_shares ds
      LEFT JOIN documents d ON d.id = ds.document_id
      LEFT JOIN organizations o ON o.id = ds.shared_with_organization_id
      LEFT JOIN users u ON u.id = ds.shared_by_user_id
      WHERE 1=1
    `;
    const params = [];
    let i = 1;

    if (document_id) {
      query += ` AND ds.document_id = $${i}`;
      params.push(document_id);
      i++;
    }
    if (shared_with_organization_id) {
      query += ` AND ds.shared_with_organization_id = $${i}`;
      params.push(shared_with_organization_id);
      i++;
    }
    if (shared_by_user_id) {
      query += ` AND ds.shared_by_user_id = $${i}`;
      params.push(shared_by_user_id);
      i++;
    }
    if (status) {
      query += ` AND ds.status = $${i}`;
      params.push(status);
      i++;
    }

    query += ` ORDER BY ds.shared_at DESC LIMIT $${i} OFFSET $${i + 1}`;
    params.push(limit, offset);

    const { rows } = await pool.query(query, params);
    return rows;
  }

  static async getById(id) {
    const { rows } = await pool.query(
      `
      SELECT
        ds.*,
        d.title AS document_title,
        d.document_number,
        o.name AS shared_with_organization_name,
        u.full_name AS shared_by_user_name
      FROM document_shares ds
      LEFT JOIN documents d ON d.id = ds.document_id
      LEFT JOIN organizations o ON o.id = ds.shared_with_organization_id
      LEFT JOIN users u ON u.id = ds.shared_by_user_id
      WHERE ds.id = $1
      `,
      [id],
    );
    return rows[0] || null;
  }

  /**
   * المستندات المُشاركة مع جهة معيّنة
   */
  static async getSharedWithOrganization(organizationId) {
    const { rows } = await pool.query(
      `
      SELECT
        ds.id,
        ds.document_id,
        d.title AS document_title,
        d.document_number,
        d.mime_type,
        d.file_size,
        ds.permission,
        ds.shared_at,
        u.full_name AS shared_by_user_name
      FROM document_shares ds
      INNER JOIN documents d ON d.id = ds.document_id
      LEFT JOIN users u ON u.id = ds.shared_by_user_id
      WHERE ds.shared_with_organization_id = $1
        AND ds.status = 'active'
        AND d.status = 'active'
      ORDER BY ds.shared_at DESC
      `,
      [organizationId],
    );
    return rows;
  }

  static async create(data) {
    const { rows } = await pool.query(
      `INSERT INTO document_shares (
         document_id, shared_with_organization_id,
         shared_by_user_id, permission, status
       )
       VALUES ($1,$2,$3,$4,'active')
       ON CONFLICT (document_id, shared_with_organization_id) DO UPDATE
       SET status = 'active',
           permission = EXCLUDED.permission,
           shared_at = now(),
           revoked_at = NULL,
           reason = NULL
       RETURNING *`,
      [
        data.document_id,
        data.shared_with_organization_id,
        data.shared_by_user_id,
        data.permission || 'view',
      ],
    );
    return rows[0];
  }

  static async revoke(id, reason = null) {
    const { rows } = await pool.query(
      `UPDATE document_shares
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
      `DELETE FROM document_shares WHERE id = $1`,
      [id],
    );
    return rowCount > 0;
  }

  static async count() {
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS total FROM document_shares WHERE status = 'active'`,
    );
    return rows[0]?.total ?? 0;
  }
}

module.exports = DocumentShare;