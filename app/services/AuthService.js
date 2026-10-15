const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const User = require('../models/User');
const ApiError = require('../errors/ApiError');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '12h';

if (!JWT_SECRET || !JWT_EXPIRES_IN) {
  // لا تشغّل النظام بسر افتراضي — هذا خطأ إعداد وليس تحذيراً
  throw new Error('JWT_SECRET أو JWT_EXPIRES_IN غير معرّف في متغيرات البيئة');
}

class AuthService {
  /**
   * تسجيل الدخول:
   * 1. التحقق من اسم المستخدم وكلمة المرور
   * 2. التحقق أن الحساب 'active' (لا يكفي JWT لاحقاً — نرفض من البداية)
   * 3. جلب الصلاحيات برموزها (permissions.code) — وليس أسماء العرض
   * 4. إصدار JWT + تحديث last_login_at
   */
  static async login(username, password) {
    let user;
    try {
      user = await User.findByUsername(username);
    } catch (error) {
      console.error('Error occurred during login:', error);
      throw ApiError.internal('حدث خطأ أثناء تسجيل الدخول');
    }

    if (!user) {
      // رسالة موحدة حتى لا نكشف أي اسم المستخدم موجود
      throw ApiError.unauthorized('اسم المستخدم أو كلمة المرور غير صحيحة');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw ApiError.unauthorized('اسم المستخدم أو كلمة المرور غير صحيحة');
    }

    if (user.status !== 'active') {
      throw ApiError.forbidden('حسابك غير مفعّل — يرجى مراجعة مسؤول جهتك');
    }

    // جلب الأدوار النشطة والصلاحيات برموزها
    const rolesRes = await pool.query(
      `SELECT r.name AS role_name, ur.organization_id
       FROM user_roles ur
       JOIN roles r ON r.id = ur.role_id
       WHERE ur.user_id = $1 AND ur.status = 'active' AND r.status = 'active'`,
      [user.id]
    );

    const permissionsRes = await pool.query(
      `SELECT DISTINCT p.code
       FROM user_roles ur
       JOIN role_permissions rp ON rp.role_id = ur.role_id
       JOIN permissions p ON p.id = rp.permission_id
       WHERE ur.user_id = $1 AND ur.status = 'active'`,
      [user.id]
    );

    const roles = rolesRes.rows;
    const isSystemAdmin = roles.some((r) => r.role_name === 'SYSTEM_ADMIN');
    const primaryRole = isSystemAdmin
      ? roles.find((r) => r.role_name === 'SYSTEM_ADMIN')
      : roles[0] || null;

    const payload = {
      user_id: user.id,
      username: user.username,
      organization_id: user.organization_id ,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    // تحديث آخر دخول
    await pool.query(
      `UPDATE users SET last_login_at = now() WHERE id = $1`,
      [user.id]
    );

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: primaryRole ? primaryRole.role_name : null,
        organization_id: user.organization_id,
        permissions: permissionsRes.rows.map((p) => p.code),
        is_system_admin: isSystemAdmin,
      },
    };
  }

  /**
   * بيانات المستخدم الحالي لـ GET /me
   * تعيد ملفاً كاملاً بما يحتاجه Flutter (UserModel)
   */
  static async getCurrentUser(userId) {
    const userRes = await pool.query(
      `SELECT u.id, u.username, u.full_name, u.email, u.phone, u.status
       FROM users u WHERE u.id = $1`,
      [userId]
    );

    if (userRes.rows.length === 0) {
      throw ApiError.notFound('المستخدم غير موجود');
    }

    const user = userRes.rows[0];

    const rolesRes = await pool.query(
      `SELECT r.name AS role_name, ur.organization_id, o.name AS organization_name
       FROM user_roles ur
       JOIN roles r ON r.id = ur.role_id
       LEFT JOIN organizations o ON o.id = ur.organization_id
       WHERE ur.user_id = $1 AND ur.status = 'active' AND r.status = 'active'
       ORDER BY ur.assigned_at DESC`,
      [userId]
    );

    const permissionsRes = await pool.query(
      `SELECT DISTINCT p.code
       FROM user_roles ur
       JOIN role_permissions rp ON rp.role_id = ur.role_id
       JOIN permissions p ON p.id = rp.permission_id
       WHERE ur.user_id = $1 AND ur.status = 'active'`,
      [userId]
    );

    const roles = rolesRes.rows;
    const isSystemAdmin = roles.some((r) => r.role_name === 'SYSTEM_ADMIN');
    const primaryRole = isSystemAdmin
      ? roles.find((r) => r.role_name === 'SYSTEM_ADMIN')
      : roles[0] || null;

    return {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      status: user.status,
      role: primaryRole ? primaryRole.role_name : null,
      organization_id: primaryRole ? primaryRole.organization_id : null,
      organization_name: primaryRole ? primaryRole.organization_name : null,
      permissions: permissionsRes.rows.map((p) => p.code),
      is_system_admin: isSystemAdmin,
    };
  }
}

module.exports = AuthService;