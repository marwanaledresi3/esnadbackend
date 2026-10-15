


// models/Role.js

const { pool } = require('../config/db');

class Role {
  /**
   * البحث عن أدوار مستخدم معين
   * @param {number} userId - The ID of the user
   * @returns {Array<string>} An array of role names (e.g., ['admin', 'employee'])
   */
  static async findUserRoles(userId) {
    const query = `
      SELECT r.name_en FROM roles r
      JOIN user_roles ur ON r.role_id = ur.role_id
      WHERE ur.user_id = $1;
    `;
    const result = await pool.query(query, [userId]);
    // .map(row => row.name_en) ستحول مصفوفة الكائنات إلى مصفوفة نصوص
    // [{ name_en: 'admin' }, { name_en: 'employee' }] -> ['admin', 'employee']
    return result.rows.map(row => row.name_en);
  }
  // إنشاء دور جديد
  static async create({ name, description, status = 'active' }, client = pool) {
    const query = `
      INSERT INTO roles (
        name,
        description,
        status
      )
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const result = await client.query(query, [
      name,
      description || null,
      status,
    ]);

    return result.rows[0];
  }

  // جلب جميع الأدوار
  static async findAll() {
    const query = `
      SELECT *
      FROM roles
      ORDER BY name ASC
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  // البحث عن دور بواسطة UUID
  static async findById(id) {
    const query = `
      SELECT *
      FROM roles
      WHERE id = $1
      LIMIT 1
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  // البحث عن دور بواسطة الاسم
  static async findByName(name) {
    const query = `
      SELECT *
      FROM roles
      WHERE name = $1
      LIMIT 1
    `;

    const result = await pool.query(query, [name]);
    return result.rows[0] || null;
  }

  // تحديث بيانات الدور
  static async update(id, { name, description, status }) {
    const query = `
      UPDATE roles
      SET
        name = $1,
        description = $2,
        status = $3
      WHERE id = $4
      RETURNING *
    `;

    const result = await pool.query(query, [
      name,
      description || null,
      status,
      id,
    ]);

    return result.rows[0] || null;
  }

  // حذف دور
  static async delete(id) {
    const query = `
      DELETE FROM roles
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  // جلب الأدوار النشطة فقط
  static async findActive() {
    const query = `
      SELECT *
      FROM roles
      WHERE status = 'active'
      ORDER BY name ASC
    `;

    const result = await pool.query(query);
    return result.rows;
  }
}

module.exports = Role;