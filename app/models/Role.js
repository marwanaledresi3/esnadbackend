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
}

module.exports = Role;