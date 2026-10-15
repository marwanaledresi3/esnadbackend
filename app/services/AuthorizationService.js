// services/AuthorizationService.js
const db = require('../config/db');
const Authorization = require('../models/Authorization');

class AuthorizationService {
  /**
   * إنشاء تصريح مع أهدافه (targets)
   * targets: [{ target_type, target_id }]
   * مثال: [{ target_type: 'body_case', target_id: '<uuid>' }]
   */
  static async createFull({
    authorization_type_id,
    issuer_organization_id,
    issued_by_user_id,
    valid_from,
    valid_until,
    document_id,
    notes,
    targets = [],
    status = 'draft',
    created_by,
  }) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      // 1. توليد رقم التصريح
      const number = await Authorization.generateNumber();

      // 2. إنشاء التصريح
      const { rows } = await client.query(
        `INSERT INTO authorizations (
           authorization_number, authorization_type_id,
           issuer_organization_id, issued_by_user_id,
           valid_from, valid_until, status,
           document_id, notes, created_by
         )
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         RETURNING *`,
        [
          number,
          authorization_type_id,
          issuer_organization_id,
          issued_by_user_id || null,
          valid_from || null,
          valid_until || null,
          status,
          document_id || null,
          notes || null,
          created_by || null,
        ],
      );

      const authorization = rows[0];

      // 3. ربط الأهداف
      for (const t of targets) {
        await client.query(
          `INSERT INTO authorization_targets
             (authorization_id, target_type, target_id)
           VALUES ($1, $2, $3)
           ON CONFLICT (authorization_id, target_type, target_id) DO NOTHING`,
          [authorization.id, t.target_type, t.target_id],
        );
      }

      await client.query('COMMIT');

      authorization.targets = targets;
      return authorization;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * جلب تصاريح جثمان معيّن
   */
  static async getByTarget(targetType, targetId) {
    const { rows } = await db.query(
      `
      SELECT
        a.*,
        at.name AS authorization_type_name,
        at.code AS authorization_type_code,
        o.name AS issuer_organization_name,
        u.full_name AS issued_by_user_name
      FROM authorizations a
      INNER JOIN authorization_targets tgt ON tgt.authorization_id = a.id
      LEFT JOIN authorization_types at ON at.id = a.authorization_type_id
      LEFT JOIN organizations o ON o.id = a.issuer_organization_id
      LEFT JOIN users u ON u.id = a.issued_by_user_id
      WHERE tgt.target_type = $1 AND tgt.target_id = $2
      ORDER BY a.created_at DESC
      `,
      [targetType, targetId],
    );
    return rows;
  }

  /**
   * إصدار تصريح مرتبط بجثمان (اختصار)
   */
  static async createForBodyCase({
    body_case_id,
    authorization_type_id,
    issuer_organization_id,
    issued_by_user_id,
    valid_from,
    valid_until,
    notes,
    created_by,
  }) {
    return await AuthorizationService.createFull({
      authorization_type_id,
      issuer_organization_id,
      issued_by_user_id,
      valid_from,
      valid_until,
      notes,
      created_by,
      status: 'active',
      targets: [
        { target_type: 'body_case', target_id: body_case_id },
      ],
    });
  }

  static async list(filters) {
    return await Authorization.getAll(filters);
  }

  static async getById(id) {
    return await Authorization.getById(id);
  }

  static async update(id, data) {
    return await Authorization.update(id, data);
  }

  static async revoke(id) {
    return await Authorization.revoke(id);
  }
}

module.exports = AuthorizationService;