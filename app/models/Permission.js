
// models/Permission.js

const { pool } = require('../config/db');

class Permission {
  // إنشاء صلاحية جديدة
  static async create({ code, name, description }, client = pool) {
    const query = `
      INSERT INTO public.permissions (
        code,
        name,
        description
      )
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const result = await client.query(query, [
      code,
      name,
      description || null,
    ]);

    return result.rows[0];
  }

  // جلب جميع الصلاحيات
  static async findAll() {
    const query = `
      SELECT *
      FROM public.permissions
      ORDER BY name ASC
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  // البحث عن صلاحية بواسطة UUID
  static async findById(id) {
    const query = `
      SELECT *
      FROM public.permissions
      WHERE id = $1
      LIMIT 1
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  // البحث عن صلاحية بواسطة الكود
  static async findByCode(code) {
    const query = `
      SELECT *
      FROM public.permissions
      WHERE code = $1
      LIMIT 1
    `;

    const result = await pool.query(query, [code]);
    return result.rows[0] || null;
  }

  // تحديث بيانات الصلاحية
  static async update(id, { code, name, description }) {
    const query = `
      UPDATE public.permissions
      SET
        code = $1,
        name = $2,
        description = $3
      WHERE id = $4
      RETURNING *
    `;

    const result = await pool.query(query, [
      code,
      name,
      description || null,
      id,
    ]);

    return result.rows[0] || null;
  }

  // حذف صلاحية
  static async delete(id) {
    const query = `
      DELETE FROM public.permissions
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  // جلب صلاحيات دور معين
  static async findByRoleId(roleId) {
    const query = `
      SELECT
        p.id,
        p.code,
        p.name,
        p.description
      FROM public.permissions AS p
      INNER JOIN public.role_permissions AS rp
        ON rp.permission_id = p.id
      WHERE rp.role_id = $1
      ORDER BY p.name ASC
    `;

    const result = await pool.query(query, [roleId]);
    return result.rows;
  }
}

module.exports = Permission;
