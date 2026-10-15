const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

class User {
  // البحث عن مستخدم بواسطة اسم المستخدم
  static async findByUsername(username) {
  const query = `
    SELECT
      u.id,
      u.username,
      u.password_hash,
      u.full_name,
      u.phone,
      u.email,
      u.status,
      u.last_login_at,
      u.created_at,

      ur.organization_id,
      r.id AS role_id,
      r.name AS role_name,

      o.name AS organization_name,
      o.organization_code,
      o.organization_type

    FROM users u

    LEFT JOIN user_roles ur
      ON ur.user_id = u.id
      AND ur.status = 'active'

    LEFT JOIN roles r
      ON r.id = ur.role_id

    LEFT JOIN organizations o
      ON o.id = ur.organization_id

    WHERE u.username = $1
      AND u.status = 'active'

    ORDER BY
      CASE
        WHEN r.name = 'SYSTEM_ADMIN' THEN 0
        ELSE 1
      END,
      ur.assigned_at DESC
  `;

  const res = await pool.query(query, [username]);

  return res.rows[0] || null;
}
  // البحث عن مستخدم بـ ID
  static async findById(userId) {
    const query = `
      SELECT u.id, u.username, u.full_name, u.role_code, u.phone, u.status, 
             u.organization_id, o.name, o.organization_type
      FROM users u
      JOIN organizations o ON u.organization_id = o.id
      WHERE u.id = $1
    `;
    const res = await pool.query(query, [userId]);
    return res.rows[0] || null;
  }

  // إنشاء حساب مستخدم جديد
  static async create({ organization_id, username, password_hash, full_name, role_code, phone }) {
    const query = `
      INSERT INTO users (organization_id, username, password_hash, full_name, role_code, phone)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING user_id, username, full_name, role_code, organization_id, created_at
    `;
    const values = [organization_id, username, password_hash, full_name, role_code, phone || null];
    const res = await pool.query(query, values);
    return res.rows[0];
  }

  // جلب قائمة المستخدمين مع فلترة وحساب الصفحات
  static async findAll({ organization_id, role_code, limit = 20, offset = 0 }) {
    let query = `
      SELECT u.id, u.username, u.full_name,  u.phone, u.status, u.organization_id,
             o.name, u.created_at
      FROM users u
      JOIN organizations o ON u.organization_id = o.id
      WHERE 1=1
    `;
    const values = [];

    if (organization_id) {
      values.push(organization_id);
      query += ` AND u.organization_id = $${values.length}`;
    }

    if (role_code) {
      values.push(role_code);
      query += ` AND u.role_code = $${values.length}`;
    }

    values.push(limit, offset);
    query += ` ORDER BY u.created_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`;

    const res = await pool.query(query, values);
    return res.rows;
  }

  // تحديث حالة الحساب (تفعيل / تعطيل)
  static async updateStatus(userId, status) {
    const query = `
      UPDATE users 
      SET status = $1
      WHERE id = $2
      RETURNING user_id, username, status
    `;
    const res = await pool.query(query, [status, userId]);
    return res.rows[0];
  }

  static async delete(userId) {
    const query = `
      DELETE FROM users
      WHERE user_id = $1
    `;
    const res = await pool.query(query, [userId]);
    return res.rows[0];
  }
}

module.exports = User;
