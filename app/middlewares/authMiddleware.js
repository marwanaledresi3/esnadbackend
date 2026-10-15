const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const ApiError = require('../errors/ApiError');

/**
 * authMiddleware
 * 1. يتحقق من وجود وصحة رمز Bearer Token (JWT).
 * 2. يجلب المستخدم من قاعدة البيانات ويتأكد من حقيقة أنه نشط (status = 'active').
 * 3. يجلب أدواره النشطة للتأكد من وجود دور SYSTEM_ADMIN.
 * 4. يحفظ بيانات المستخدم في req.user.
 */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('رمز التوثيق غير موجود أو غير صالح');
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      throw ApiError.unauthorized('جلسة الدخول انتهت أو غير صالحة');
    }

    const userRes = await pool.query(
      `SELECT
         u.id,
         u.username,
         u.full_name,
         u.status,
         u.email,
         u.phone,
         r.name AS role_name,
         ur.organization_id
       FROM users u
       LEFT JOIN user_roles ur
         ON ur.user_id = u.id AND ur.status = 'active'
       LEFT JOIN roles r
         ON r.id = ur.role_id AND r.status = 'active'
       WHERE u.id = $1`,
      [decoded.user_id]
    );

    if (userRes.rows.length === 0) {
      throw ApiError.unauthorized('حساب المستخدم غير موجود');
    }

    const firstRow = userRes.rows[0];
    if (firstRow.status !== 'active') {
      throw ApiError.unauthorized('حساب المستخدم معطل — يرجى مراجعة مسؤول الجهة');
    }

    const roles = userRes.rows
      .filter((row) => row.role_name)
      .map((row) => ({
        role_name: row.role_name,
        organization_id: row.organization_id,
      }));

    req.user = {
      id: firstRow.id,
      username: firstRow.username,
      full_name: firstRow.full_name,
      email: firstRow.email,
      phone: firstRow.phone,
      status: firstRow.status,
      organization_id: firstRow.organization_id,
      roles,
      is_system_admin: roles.some((r) => r.role_name === 'SYSTEM_ADMIN'),
    };

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authMiddleware;