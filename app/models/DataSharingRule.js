const { pool } = require('../config/db');

class DataSharingRule {
  // إنشاء أو تحديث قاعدة مشاركة بيانات مقيدة بعلاقة ربط
  static async upsertRule({ organizationLinkId, entityType, permissionType = 'VIEW', isActive = true }) {
    const query = `
      INSERT INTO data_sharing_rules (organization_link_id, entity_type, permission_type, is_active, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (organization_link_id, entity_type) 
      DO UPDATE SET permission_type = EXCLUDED.permission_type, is_active = EXCLUDED.is_active
      RETURNING *
    `;
    const res = await pool.query(query, [organizationLinkId, entityType, permissionType, isActive]);
    return res.rows[0];
  }

  // التحقق مما إذا كانت هناك قاعدة مشاركة مفعّلة لنوع الكيان ضمن العلاقة
  static async isRuleActive(organizationLinkId, entityType) {
    const query = `
      SELECT is_active 
      FROM data_sharing_rules 
      WHERE organization_link_id = $1 AND entity_type = $2 AND is_active = true
    `;
    const res = await pool.query(query, [organizationLinkId, entityType]);
    return res.rows.length > 0;
  }

  // جلب كافة القواعد الخاصة بعلاقة ربط محددة
  static async findByLink(organizationLinkId) {
    const query = `
      SELECT * FROM data_sharing_rules 
      WHERE organization_link_id = $1
    `;
    const res = await pool.query(query, [organizationLinkId]);
    return res.rows;
  }
}

module.exports = DataSharingRule;