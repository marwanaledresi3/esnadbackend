// middlewares/requireSystemAdmin.js
const { pool } = require('../config/db');
const ApiError = require('../errors/ApiError');

const requireSystemAdmin = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      throw ApiError.unauthorized('جلسة المستخدم غير صالحة');
    }

    // الاستعلام المباشر من قاعدة البيانات لمنع أي تلاعب من تطبيق الهاتف/العميل
    const query = `
      SELECT u.id, u.status, r.name AS role_name
      FROM users u
      JOIN user_roles ur ON ur.user_id = u.id
      JOIN roles r ON r.id = ur.role_id
      WHERE u.id = $1 AND r.name = 'SYSTEM_ADMIN' AND u.status = 'active'
      LIMIT 1;
    `;

    const result = await pool.query(query, [req.user.id]);

    if (result.rows.length === 0) {
      throw ApiError.forbidden('وصول مرفوض: هذه العملية مخصصة لمدير النظام المركزي فقط');
    }

    req.isSystemAdmin = true;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = requireSystemAdmin;