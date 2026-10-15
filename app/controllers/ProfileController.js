// controllers/ProfileController.js
const bcrypt = require('bcrypt');   // أو bcryptjs
const {pool} = require('../config/db');
const AuditLogService = require('../services/AuditLogService');

class ProfileController {
  /**
   * GET /profile
   * بيانات المستخدم الحالي + الجهة + الأدوار + الصلاحيات
   */
  static async getProfile(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'غير مصرح' });
      }

      // بيانات المستخدم
      const { rows: userRows } = await pool.query(
        `SELECT
           u.id, u.username, u.full_name, u.email, u.phone,
           u.status, u.created_at, u.last_login_at,
           u.organization_id,
           o.name AS organization_name
         FROM users u
         LEFT JOIN organizations o ON o.id = u.organization_id
         WHERE u.id = $1`,
        [userId],
      );

      if (userRows.length === 0) {
        return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
      }

      const user = userRows[0];

      // الأدوار
      const { rows: roleRows } = await pool.query(
        `SELECT DISTINCT r.id, r.name, r.description
         FROM user_roles ur
         INNER JOIN roles r ON r.id = ur.role_id
         WHERE ur.user_id = $1 AND ur.status = 'active'`,
        [userId],
      );

      // الصلاحيات
      const { rows: permRows } = await pool.query(
        `SELECT DISTINCT p.code, p.name, p.description
         FROM user_roles ur
         INNER JOIN role_permissions rp ON rp.role_id = ur.role_id
         INNER JOIN permissions p ON p.id = rp.permission_id
         WHERE ur.user_id = $1 AND ur.status = 'active'
         ORDER BY p.code`,
        [userId],
      );

      return res.json({
        success: true,
        data: {
          user,
          roles: roleRows,
          permissions: permRows,
        },
      });
    } catch (error) {
      console.error('ProfileController.getProfile', error);
      return res.status(500).json({
        success: false,
        message: 'تعذر جلب البيانات',
      });
    }
  }

  /**
   * PUT /profile
   * تحديث البيانات الشخصية
   */
  static async updateProfile(req, res) {
    try {
      const userId = req.user?.id;
      const { full_name, email, phone } = req.body;

      const { rows } = await pool.query(
        `UPDATE users
         SET full_name = COALESCE($1, full_name),
             email = COALESCE($2, email),
             phone = COALESCE($3, phone)
         WHERE id = $4
         RETURNING id, username, full_name, email, phone, organization_id`,
        [
          full_name || null,
          email || null,
          phone || null,
          userId,
        ],
      );

      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
      }

      // سجّل الحدث
      await AuditLogService.log({
        user_id: userId,
        action: 'PROFILE_UPDATE',
        entity_type: 'user',
        entity_id: userId,
        result: 'success',
        new_values: rows[0],
      });

      return res.json({
        success: true,
        message: 'تم تحديث البيانات',
        data: rows[0],
      });
    } catch (error) {
      console.error('ProfileController.updateProfile', error);
      return res.status(500).json({
        success: false,
        message: 'تعذر التحديث',
      });
    }
  }

  /**
   * POST /profile/change-password
   * تغيير كلمة المرور
   */
  static async changePassword(req, res) {
    try {
      const userId = req.user?.id;
      const { current_password, new_password } = req.body;

      if (!current_password || !new_password) {
        return res.status(400).json({
          success: false,
          message: 'current_password و new_password مطلوبان',
        });
      }

      if (new_password.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل',
        });
      }

      // اجلب كلمة المرور الحالية
      const { rows } = await pool.query(
        `SELECT password_hash FROM users WHERE id = $1`,
        [userId],
      );

      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
      }

      // تحقق من كلمة المرور الحالية
      const valid = await bcrypt.compare(current_password, rows[0].password_hash);
      if (!valid) {
        await AuditLogService.log({
          user_id: userId,
          action: 'PROFILE_CHANGE_PASSWORD',
          entity_type: 'user',
          entity_id: userId,
          result: 'failure',
        });

        return res.status(400).json({
          success: false,
          message: 'كلمة المرور الحالية غير صحيحة',
        });
      }

      // شفّر الجديدة
      const hashed = await bcrypt.hash(new_password, 10);

      await pool.query(
        `UPDATE users SET password_hash = $1 WHERE id = $2`,
        [hashed, userId],
      );

      await AuditLogService.log({
        user_id: userId,
        action: 'PROFILE_CHANGE_PASSWORD',
        entity_type: 'user',
        entity_id: userId,
        result: 'success',
      });

      return res.json({
        success: true,
        message: 'تم تغيير كلمة المرور بنجاح',
      });
    } catch (error) {
      console.error('ProfileController.changePassword', error);
      return res.status(500).json({
        success: false,
        message: 'تعذر تغيير كلمة المرور',
      });
    }
  }

  /**
   * GET /profile/activity
   * آخر أنشطة المستخدم
   */
  static async getActivity(req, res) {
    try {
      const userId = req.user?.id;
      const { limit = 30 } = req.query;

      const { rows } = await pool.query(
        `SELECT
           al.action,
           al.entity_type,
           al.entity_id,
           al.result,
           al.created_at,
           al.ip_address
         FROM audit_logs al
         WHERE al.user_id = $1
         ORDER BY al.created_at DESC
         LIMIT $2`,
        [userId, Number(limit)],
      );

      return res.json({ success: true, data: rows });
    } catch (error) {
      console.error('ProfileController.getActivity', error);
      return res.status(500).json({
        success: false,
        message: 'تعذر جلب الأنشطة',
      });
    }
  }
}

module.exports = ProfileController;