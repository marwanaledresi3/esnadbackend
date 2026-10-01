const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

class User {
  // البحث عن مستخدم بواسطة اسم المستخدم
  static async findByUsername(username) {
    const query = `
      SELECT u.*, o.org_name, o.org_type 
      FROM users u
      JOIN organizations o ON u.organization_id = o.organization_id
      WHERE u.username = $1 AND u.is_active = true
    `;
    const res = await pool.query(query, [username]);
    return res.rows[0] || null;
  }

  // البحث عن مستخدم بـ ID
  static async findById(userId) {
    const query = `
      SELECT u.user_id, u.username, u.full_name, u.role_code, u.phone, u.is_active, 
             u.organization_id, o.org_name, o.org_type
      FROM users u
      JOIN organizations o ON u.organization_id = o.organization_id
      WHERE u.user_id = $1
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
      SELECT u.user_id, u.username, u.full_name, u.role_code, u.phone, u.is_active, 
             o.org_name, u.created_at
      FROM users u
      JOIN organizations o ON u.organization_id = o.organization_id
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
  static async updateStatus(userId, isActive) {
    const query = `
      UPDATE users 
      SET is_active = $1
      WHERE user_id = $2
      RETURNING user_id, username, is_active
    `;
    const res = await pool.query(query, [isActive, userId]);
    return res.rows[0];
  }
}

module.exports = User;
