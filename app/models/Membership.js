const { pool } = require('../config/db');

class MembershipModel {
  // إضافة عضوية جديدة في جهة
  static async addMember(userId, organizationId, approvedBy, client = pool) {
    const query = `
      INSERT INTO organization_memberships (user_id, organization_id, status, approved_by)
      VALUES ($1, $2, 'active', $3)
      ON CONFLICT (user_id, organization_id) DO UPDATE SET status = 'active'
      RETURNING *
    `;
    const result = await client.query(query, [userId, organizationId, approvedBy]);
    return result.rows[0];
  }

  // تعيين دور للمستخدم داخل جهة
  static async assignRole(userId, organizationId, roleId, assignedBy, client = pool) {
    const query = `
      INSERT INTO user_roles (user_id, organization_id, role_id, status, assigned_by)
      VALUES ($1, $2, $3, 'active', $4)
      RETURNING *
    `;
    const result = await client.query(query, [userId, organizationId, roleId, assignedBy]);
    return result.rows[0];
  }
}

module.exports = MembershipModel;