const { pool } = require('../config/db');

class OrganizationMembership {
  // إنشاء أو إعادة تفعيل عضوية للمستخدم
  static async create(client, { userId, organizationId, status = 'ACTIVE' }) {
    const dbClient = client || pool;
     if (typeof dbClient.query !== 'function') {
    throw new Error(
      'Invalid database client: query() is not available'
    );
  }
    const query = `
      INSERT INTO organization_memberships (user_id, organization_id, status, created_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (user_id, organization_id) 
      DO UPDATE SET status = EXCLUDED.status, ended_at = NULL
      RETURNING *
    `;
    const res = await dbClient.query(query, [userId, organizationId, status]);
    return res.rows[0];
  }

  // التحقق من وجود عضوية نشطة لمستخدم داخل جهة
  static async findActiveMembership(userId, organizationId) {
    const query = `
      SELECT * FROM organization_memberships 
      WHERE user_id = $1 AND organization_id = $2 AND status = 'ACTIVE'
    `;
    const res = await pool.query(query, [userId, organizationId]);
    return res.rows[0] || null;
  }

  // تعليق أو إنهاء العضوية (Soft Operation)
  static async updateStatus(userId, organizationId, status) {
    const query = `
      UPDATE organization_memberships 
      SET status = $1, 
          ended_at = CASE WHEN $1 = 'ENDED' THEN NOW() ELSE ended_at END
      WHERE user_id = $2 AND organization_id = $3
      RETURNING *
    `;
    const res = await pool.query(query, [status, userId, organizationId]);
    return res.rows[0];
  }
}

module.exports = OrganizationMembership;