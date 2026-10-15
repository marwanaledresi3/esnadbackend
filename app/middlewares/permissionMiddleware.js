const { pool } = require('../config/db');
const ApiError = require('../errors/ApiError');

/**
 * permissionMiddleware
 * يتحقق من صلاحيات العمليات العامة في النظام.
 */
const permissionMiddleware = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      if (req.user.is_system_admin) {
        return next();
      }

      const userId = req.user.id;
      const orgId = req.user.organization_id;

      if (!orgId) {
        console.log('req...',req.currentOrganizationId);
        throw ApiError.forbidden('لم يتم تحديد الجهة الحالية');
      }

      const permRes = await pool.query(
        `SELECT p.code
         FROM user_roles ur
         JOIN role_permissions rp ON ur.role_id = rp.role_id
         JOIN permissions p ON rp.permission_id = p.id
         JOIN roles r ON r.id = ur.role_id
         WHERE ur.user_id = $1
           AND ur.organization_id = $2
           AND ur.status = 'active'
           AND r.status = 'active'
           AND p.code = $3`,
        [userId, orgId, requiredPermission]
      );

      if (permRes.rows.length === 0) {
        throw ApiError.forbidden(`تتطلب هذه العملية صلاحية: [${requiredPermission}]`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = permissionMiddleware;