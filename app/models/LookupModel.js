// models/LookupModel.js
const {pool} = require('../config/db'); // افتراض وجود ملف الاتصال بقاعدة البيانات

class LookupModel {
  constructor(tableName) {
    this.tableName = tableName;
  }
 
  // جلب جميع العناصر (إمكانية فلترة العناصر الفعالة فقط active)
  async getAll({ activeOnly = true } = {}) {
    let query = `SELECT * FROM ${this.tableName}`;
    const values = [];

    if (activeOnly) {
      query += ` WHERE status = $1`;
      values.push('active');
    }

    query += ` ORDER BY name ASC`;
    const { rows } = await pool.query(query, values);
    return rows;
  }

  // جلب عنصر بواسطة الرقم المعرف ID
  async getById(id) {
    const query = `SELECT id, code, name, description, status, created_at, updated_at FROM ${this.tableName} WHERE id = $1`;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  }

  // جلب عنصر بواسطة الـ Code الفريد
  async getByCode(code) {
    const query = `SELECT id, code, name, description, status, created_at, updated_at FROM ${this.tableName} WHERE code = $1`;
    const { rows } = await pool.query(query, [code]);
    return rows[0] || null;
  }

  // إنشاء عنصر مرجعي جديد
  async create({ code, name, description, status = 'active' }) {
    const query = `
      INSERT INTO ${this.tableName} (code, name, description, status)
      VALUES ($1, $2, $3, $4)
      RETURNING id, code, name, description, status, created_at;
    `;
    const { rows } = await pool.query(query, [code, name, description, status]);
    return rows[0];
  }

  // تحديث بيانات عنصر مرجعي
  async update(id, { name, description, status }) {
    const query = `
      UPDATE ${this.tableName}
      SET name = COALESCE($1, name),
          description = COALESCE($2, description),
          status = COALESCE($3, status),
          updated_at = NOW()
      WHERE id = $4
      RETURNING id, code, name, description, status, updated_at;
    `;
    const { rows } = await pool.query(query, [name, description, status, id]);
    return rows[0] || null;
  }

  // تعطيل عنصر بدلاً من الحذف الفيزيائي (Soft Delete)
  async disable(id) {
    const query = `
      UPDATE ${this.tableName}
      SET status = 'inactive', updated_at = NOW()
      WHERE id = $1
      RETURNING id, code, name, status;
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  }
}

module.exports = LookupModel;