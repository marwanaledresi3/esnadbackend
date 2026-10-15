const { pool } = require('../config/db');

class SharedRecord {
  // إضافة سجل مشاركة صريح
  static async create({ entityType, entityId, ownerOrganizationId, sharedWithOrganizationId, sharedByUserId }) {
    const query = `
      INSERT INTO shared_records (
        entity_type, entity_id, owner_organization_id, 
        shared_with_organization_id, shared_by_user_id, status, shared_at
      )
      VALUES ($1, $2, $3, $4, $5, 'ACTIVE', NOW())
      RETURNING *
    `;
    const res = await pool.query(query, [
      entityType, entityId, ownerOrganizationId, sharedWithOrganizationId, sharedByUserId
    ]);
    return res.rows[0];
  }

  // التأكد من أن المورد مملوك للجهة المصدرة
  static async verifyOwnership(entityType, entityId, organizationId) {
    let tableName = '';
    let orgColumn = 'organization_id';

    switch (entityType) {
      case 'CASE': tableName = 'cases'; break;
      case 'DOCUMENT': tableName = 'documents'; orgColumn = 'owner_organization_id'; break;
      case 'REPORT': tableName = 'reports'; break;
      case 'FORENSIC_REQUEST': tableName = 'forensic_requests'; orgColumn = 'requesting_organization_id'; break;
      case 'BODY_CASE': tableName = 'body_cases'; orgColumn = 'current_organization_id'; break;
      case 'TRANSPORT_REQUEST': tableName = 'transport_requests'; orgColumn = 'requesting_organization_id'; break;
      default: return false;
    }

    const query = `SELECT 1 FROM ${tableName} WHERE id = $1 AND ${orgColumn} = $2`;
    const res = await pool.query(query, [entityId, organizationId]);
    return res.rows.length > 0;
  }

  // التحقق مما إذا كان السجل مشاركاً حالياً وحالته ACTIVE للجهة المستلمة
  static async findActiveShare(entityType, entityId, sharedWithOrganizationId) {
    const query = `
      SELECT * FROM shared_records 
      WHERE entity_type = $1 
        AND entity_id = $2 
        AND shared_with_organization_id = $3 
        AND status = 'ACTIVE'
    `;
    const res = await pool.query(query, [entityType, entityId, sharedWithOrganizationId]);
    return res.rows[0] || null;
  }

  // إلغاء المشاركة وتوثيق السبب والمستخدم المنفذ بدون Hard Delete
  static async revoke(sharedRecordId, revokedByUserId, reason) {
    const query = `
      UPDATE shared_records 
      SET status = 'REVOKED', 
          revoked_at = NOW(), 
          revoked_by_user_id = $2, 
          reason = $3
      WHERE id = $1 AND status = 'ACTIVE'
      RETURNING *
    `;
    const res = await pool.query(query, [sharedRecordId, revokedByUserId, reason]);
    return res.rows[0] || null;
  }
}

module.exports = SharedRecord;