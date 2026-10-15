// services/UserAdminService.js
const { pool } = require('../config/db');
const ApiError = require('../errors/ApiError');

class UserAdminService {
  /**
   * 1. جلب قائمة المستخدمين مع التفلترة بالبحث وحالة الحساب
   */
  static async getUsers({ search, status, organizationId }) {
    let query = `
      SELECT 
        u.id,
        u.full_name,
        u.username,
        u.email,
        u.phone,
        u.status,
        r.name AS is_system_admin,
       
        u.created_at
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND u.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (search) {
      query += ` AND (u.full_name ILIKE $${paramIndex} OR u.username ILIKE $${paramIndex} OR u.phone ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY u.created_at DESC;`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * 2. تغيير حالة حساب المستخدم (تفعيل / قبول / تجميد)
   */
  static async updateUserStatus(userId, status, context) {
    if (!['active', 'pending', 'suspended'].includes(status)) {
      throw ApiError.badRequest('حالة الحساب غير صالحة');
    }

    const query = `
      UPDATE users
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, full_name, username, status;
    `;

    const result = await pool.query(query, [status, userId]);
    if (result.rows.length === 0) {
      throw ApiError.notFound('المستخدم غير موجود');
    }

    // تسجيل العملية في audit_logs
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, result)
       VALUES ($1, $2, 'USER', $3, 'SUCCESS')`,
      [context.userId, `UPDATE_USER_STATUS_${status.toUpperCase()}`, userId]
    );

    return result.rows[0];
  }

  /**
   * 3. إسناد دور دوراني للمستخدم داخل جهة معينة
   */
  static async assignUserRole({ targetUserId, roleId, organizationId }, context) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // إدخال أو تحديث دور المستخدم في جدول user_roles
      const insertQuery = `
        INSERT INTO user_roles (user_id, role_id, organization_id, status, assigned_at)
        VALUES ($1, $2, $3, 'active', NOW())
        ON CONFLICT (user_id, role_id, organization_id) 
        DO UPDATE SET status = 'active', assigned_at = NOW()
        RETURNING *;
      `;

      const result = await client.query(insertQuery, [
        targetUserId,
        roleId,
        organizationId || null,
      ]);

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = UserAdminService;