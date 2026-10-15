const { pool } = require('../config/db');
const ApiError = require('../errors/ApiError');

/**
 * organizationMiddleware
 * يحدد الجهة التي يعمل بها المستخدم حالياً بناءً على الهيدر (x-organization-id).
 * يدعم مدير النظام (SYSTEM_ADMIN) للعمل بحرية مع أو بدون جهة محددة.
 */
const organizationMiddleware = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      throw ApiError.unauthorized('المستخدم غير موثق');
    }

    const userId = req.user.id;
    const organizationId = req.user.organization_id;

    // 1. معالجة حالة مدير النظام المركزي (SYSTEM_ADMIN)
    if (req.user.is_system_admin) {
      req.organizationMembership = null;
      req.currentRoleName = 'SYSTEM_ADMIN';

      // إذا أرسل مدير النظام x-organization-id اختياريًا لتمثيل جهة معينة
      if (organizationId) {
        const orgRes = await pool.query(
          `SELECT id, name, organization_type, province_id, status
           FROM organizations WHERE id = $1 LIMIT 1`,
          [organizationId]
        );
        if (orgRes.rows.length > 0) {
          req.currentOrganizationId = orgRes.rows[0].id;
          req.currentOrganization = orgRes.rows[0];
        }
      } else {
        req.currentOrganizationId = null;
        req.currentOrganization = null;
      }

      return next(); // إكمال الطلب بنجاح لمدير النظام دون فرض عضوية
    }

    // 2. معالجة المستخدمين العاديين (يتطلب تحديد الجهة والعضوية الفعالة)
    if (!organizationId) {
      throw ApiError.forbidden('يرجى تحديد الجهة التي تعمل باسمها حالياً عبر الهيدر (x-organization-id)');
    }

    // أ) التحقق من وجود وحالة الجهة
    const organizationResult = await pool.query(
      `SELECT id, name, organization_type, province_id, status
       FROM organizations
       WHERE id = $1
       LIMIT 1`,
      [organizationId]
    );

    if (organizationResult.rows.length === 0) {
      throw ApiError.notFound('الجهة المحددة غير موجودة');
    }

    const organization = organizationResult.rows[0];
    if (organization.status !== 'active') {
      throw ApiError.forbidden('الجهة المحددة موقوفة');
    }

    // ب) التحقق من عضوية المستخدم في هذه الجهة
    const membershipResult = await pool.query(
      `SELECT id, user_id, organization_id, status, joined_at, ended_at
       FROM organization_memberships
       WHERE user_id = $1 AND organization_id = $2
       LIMIT 1`,
      [userId, organizationId]
    );

    if (membershipResult.rows.length === 0) {
      throw ApiError.forbidden('المستخدم ليس عضواً في هذه الجهة');
    }

    const membership = membershipResult.rows[0];
    if (membership.status !== 'active') {
      throw ApiError.forbidden('عضوية المستخدم في هذه الجهة غير مفعّلة');
    }

    // ج) جلب اسم الدور الفعّال للمستخدم داخل هذه الجهة
    const roleResult = await pool.query(
      `SELECT r.name
       FROM user_roles ur
       JOIN roles r ON r.id = ur.role_id
       WHERE ur.user_id = $1
         AND ur.organization_id = $2
         AND ur.status = 'active'
         AND r.status = 'active'
       ORDER BY ur.assigned_at DESC
       LIMIT 1`,
      [userId, organizationId]
    );

    req.currentOrganizationId = organization.id;
    req.currentOrganization = organization;
    req.organizationMembership = membership;
    req.currentRoleName = roleResult.rows.length > 0 ? roleResult.rows[0].name : null;

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = organizationMiddleware;