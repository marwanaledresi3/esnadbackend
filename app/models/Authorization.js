// models/AuthorizationModel.js
// models/Authorization.js
const {pool } = require('../config/db');

class Authorization {
  /**
   * جلب التصاريح مع فلترة
   * @param {Object} filters
   * @param {string} [filters.status]
   * @param {string} [filters.issuer_organization_id]
   * @param {string} [filters.authorization_type_id]
   * @param {Date}   [filters.valid_from]
   * @param {Date}   [filters.valid_until]
   */
  static async getAll({
    status,
    issuer_organization_id,
    authorization_type_id,
    valid_from,
    valid_until,
    limit = 100,
    offset = 0,
  } = {}) {
    let query = `
      SELECT
        a.id,
        a.authorization_number,
        a.authorization_type_id,
        at.name AS authorization_type_name,
        at.code AS authorization_type_code,
        a.issuer_organization_id,
        o.name AS issuer_organization_name,
        a.issued_by_user_id,
        u.full_name AS issued_by_user_name,
        a.issued_at,
        a.valid_from,
        a.valid_until,
        a.status,
        a.document_id,
        a.notes,
        a.created_at,
        a.created_by
      FROM authorizations a
      LEFT JOIN authorization_types at ON at.id = a.authorization_type_id
      LEFT JOIN organizations o ON o.id = a.issuer_organization_id
      LEFT JOIN users u ON u.id = a.issued_by_user_id
      WHERE 1=1
    `;
    const params = [];
    let i = 1;

    if (status) {
      query += ` AND a.status = $${i}`;
      params.push(status);
      i++;
    }

    if (issuer_organization_id) {
      query += ` AND a.issuer_organization_id = $${i}`;
      params.push(issuer_organization_id);
      i++;
    }

    if (authorization_type_id) {
      query += ` AND a.authorization_type_id = $${i}`;
      params.push(authorization_type_id);
      i++;
    }

    if (valid_from) {
      query += ` AND a.valid_from >= $${i}`;
      params.push(valid_from);
      i++;
    }

    if (valid_until) {
      query += ` AND a.valid_until <= $${i}`;
      params.push(valid_until);
      i++;
    }

    query += ` ORDER BY a.created_at DESC LIMIT $${i} OFFSET $${i + 1}`;
    params.push(limit, offset);

    const { rows } = await pool .query(query, params);
    return rows;
  }

  /**
   * جلب تصريح واحد بمعرّفه مع أهدافه
   */
  static async getById(id) {
    const { rows } = await pool .query(
      `
      SELECT
        a.*,
        at.name AS authorization_type_name,
        at.code AS authorization_type_code,
        o.name AS issuer_organization_name,
        u.full_name AS issued_by_user_name
      FROM authorizations a
      LEFT JOIN authorization_types at ON at.id = a.authorization_type_id
      LEFT JOIN organizations o ON o.id = a.issuer_organization_id
      LEFT JOIN users u ON u.id = a.issued_by_user_id
      WHERE a.id = $1
      `,
      [id],
    );

    if (rows.length === 0) return null;

    const authorization = rows[0];

    // جلب الأهداف
    const { rows: targets } = await pool .query(
      `SELECT id, target_type, target_id
       FROM authorization_targets
       WHERE authorization_id = $1`,
      [id],
    );

    authorization.targets = targets;
    return authorization;
  }

  /**
   * جلب تصريح برقمه
   */
  static async getByNumber(number) {
    const { rows } = await pool .query(
      `SELECT * FROM authorizations WHERE authorization_number = $1`,
      [number],
    );
    return rows[0] || null;
  }

  /**
   * إنشاء تصريح جديد
   */
  static async create({
    authorization_number,
    authorization_type_id,
    issuer_organization_id,
    issued_by_user_id,
    issued_at,
    valid_from,
    valid_until,
    status = 'draft',
    document_id,
    notes,
    created_by,
  }) {
    const { rows } = await pool .query(
      `
      INSERT INTO authorizations (
        authorization_number,
        authorization_type_id,
        issuer_organization_id,
        issued_by_user_id,
        issued_at,
        valid_from,
        valid_until,
        status,
        document_id,
        notes,
        created_by
      )
      VALUES ($1,$2,$3,$4, COALESCE($5, now()), $6, $7, $8, $9, $10, $11)
      RETURNING *
      `,
      [
        authorization_number,
        authorization_type_id,
        issuer_organization_id,
        issued_by_user_id || null,
        issued_at || null,
        valid_from || null,
        valid_until || null,
        status,
        document_id || null,
        notes || null,
        created_by || null,
      ],
    );
    return rows[0];
  }

  /**
   * تحديث تصريح
   */
  static async update(id, data) {
    const allowed = [
      'valid_from',
      'valid_until',
      'status',
      'document_id',
      'notes',
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
    const { rows } = await pool .query(
      `UPDATE authorizations SET ${updates.join(', ')}
       WHERE id = $${i}
       RETURNING *`,
      params,
    );
    return rows[0] || null;
  }

  /**
   * إلغاء تصريح (revoke)
   */
  static async revoke(id) {
    const { rows } = await pool .query(
      `UPDATE authorizations
       SET status = 'revoked'
       WHERE id = $1
       RETURNING *`,
      [id],
    );
    return rows[0] || null;
  }

  /**
   * توليد رقم تصريح فريد
   * مثال: AUTH-2026-00001
   */
  static async generateNumber(prefix = 'AUTH') {
    const year = new Date().getFullYear();
    const pattern = `${prefix}-${year}-%`;

    const { rows } = await pool .query(
      `SELECT authorization_number
       FROM authorizations
       WHERE authorization_number LIKE $1
       ORDER BY authorization_number DESC
       LIMIT 1`,
      [pattern],
    );

    let next = 1;
    if (rows.length > 0) {
      const last = rows[0].authorization_number;
      const parts = last.split('-');
      const num = parseInt(parts[parts.length - 1], 10);
      if (!Number.isNaN(num)) next = num + 1;
    }

    return `${prefix}-${year}-${String(next).padStart(5, '0')}`;
  }
}

module.exports = Authorization;