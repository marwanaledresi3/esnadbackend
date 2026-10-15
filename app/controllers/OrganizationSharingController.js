// controllers/OrganizationSharingController.js
const { pool } = require('../config/db');
const OrganizationSharingModel = require('../models/OrganizationSharingModel');
const apiResponse = require('../utils/apiResponse');
const ApiError = require('../errors/ApiError');
const { logAuditEvent } = require('../middlewares/auditMiddleware');

class OrganizationSharingController {

  // 1. اعتماد طلب حساب (خاص بـ Organization Admin لجهته فقط)
  static async approveAccountRequest(req, res, next) {
    try {
      const { requestId } = req.params;
      const { role_id } = req.body;
      const adminUserId = req.user.id;
      const adminOrgId = req.currentOrganizationId;
      const isSystemAdmin = req.user.is_system_admin;

      // جلب طلب الحساب للتحقق من التبعية للجهة
      const reqRes = await pool.query(`SELECT * FROM account_requests WHERE id = $1`, [requestId]);
      if (reqRes.rows.length === 0) throw ApiError.notFound('طلب الحساب غير موجود');

      const accountReq = reqRes.rows[0];

      // قيد: منع مسؤول الجهة من اعتماد طلب تابع لجهة أخرى
      if (!isSystemAdmin && accountReq.organization_id !== adminOrgId) {
        throw ApiError.forbidden('لا تملك صلاحية اعتماد طلبات الحسابات لجهات أخرى');
      }

      const defaultPasswordHash = '$2b$10$e80A1.D.iO.2001.DefaultHashedPassword'; // مثال للـ Hash
      const result = await OrganizationSharingModel.approveAccountRequest({
        requestId,
        reviewedByUserId: adminUserId,
        roleId: role_id,
        defaultPasswordHash
      });

      await logAuditEvent(req, {
        actionType: 'ACCOUNT_REQUEST_APPROVED',
        entityType: 'ACCOUNT_REQUEST',
        entityId: requestId,
        newValues: { approved_user_id: result.userId }
      });

      return apiResponse.success(res, 'تمت الموافقة على طلب الحساب وإنشاء العضوية بنجاح', result);
    } catch (error) {
      next(error);
    }
  }

  // 2. إنشاء علاقة بين جهتين (حصرية لـ SYSTEM_ADMIN)
  static async createOrganizationLink(req, res, next) {
    try {
      if (!req.user.is_system_admin) {
        throw ApiError.forbidden('إنشاء وتوصيل العلاقات بين الجهات حصرية لمدير النظام (System Admin)');
      }

      const { source_organization_id, target_organization_id, link_type } = req.body;

      if (source_organization_id === target_organization_id) {
        throw ApiError.badRequest('لا يمكن إنشاء علاقة ربط للجهة مع نفسها');
      }

      const query = `
        INSERT INTO organization_links (
          source_organization_id, target_organization_id, link_type, status, created_by, created_at
        )
        VALUES ($1, $2, $3, 'active', $4, NOW())
        RETURNING *
      `;
      const result = await pool.query(query, [source_organization_id, target_organization_id, link_type, req.user.id]);

      await logAuditEvent(req, {
        actionType: 'ORGANIZATION_LINK_CREATED',
        entityType: 'ORGANIZATION_LINK',
        entityId: result.rows[0].id,
        newValues: result.rows[0]
      });

      return apiResponse.created(res, 'تم إنشاء وتفعيل علاقة الربط بين الجهتين بنجاح', result.rows[0]);
    } catch (error) {
      next(error);
    }
  }

  // 3. إضافة قاعدة مشاركة بيانات مقيدة بعلاقة (System Admin)
  static async createSharingRule(req, res, next) {
    try {
      if (!req.user.is_system_admin) {
        throw ApiError.forbidden('إدارة قواعد المشاركة صريحة بمدير النظام');
      }

      const { organization_link_id, entity_type, permission_type } = req.body;

      const query = `
        INSERT INTO data_sharing_rules (organization_link_id, entity_type, permission_type, is_active)
        VALUES ($1, $2, $3, true)
        ON CONFLICT (organization_link_id, entity_type) 
        DO UPDATE SET is_active = true, permission_type = EXCLUDED.permission_type
        RETURNING *
      `;
      const result = await pool.query(query, [organization_link_id, entity_type, permission_type || 'VIEW']);

      await logAuditEvent(req, {
        actionType: 'SHARING_RULE_CREATED',
        entityType: 'DATA_SHARING_RULE',
        entityId: result.rows[0].id,
        newValues: result.rows[0]
      });

      return apiResponse.created(res, 'تم تحديد قاعدة مشاركة البيانات بنجاح', result.rows[0]);
    } catch (error) {
      next(error);
    }
  }

  // 4. تنفيذ مشاركة سجل صريحة (Explicit Record Sharing)
  static async shareRecord(req, res, next) {
    try {
      const { entity_type, entity_id, target_organization_id } = req.body;
      const userId = req.user.id;
      const userOrgId = req.currentOrganizationId;

      // التحقق من وجود علاقة وقاعدة مشاركة تسمح بذات الكيان
      const ruleCheck = await pool.query(
        `SELECT dsr.is_active, ol.status as link_status
         FROM organization_links ol
         JOIN data_sharing_rules dsr ON dsr.organization_link_id = ol.id
         WHERE ol.source_organization_id = $1 
           AND ol.target_organization_id = $2 
           AND dsr.entity_type = $3`,
        [userOrgId, target_organization_id, entity_type]
      );

      if (ruleCheck.rows.length === 0 || ruleCheck.rows[0].link_status !== 'active' || !ruleCheck.rows[0].is_active) {
        throw ApiError.badRequest('لا توجد علاقة مسجلة أو قاعدة مشاركة مفعّلة تجيز مشاركة هذا النوع مع الجهة المستهدفة');
      }

      const shared = await OrganizationSharingModel.shareRecord({
        entity_type,
        entity_id,
        owner_organization_id: userOrgId,
        shared_with_organization_id: target_organization_id,
        shared_by_user_id: userId
      });

      await logAuditEvent(req, {
        actionType: 'RECORD_SHARED',
        entityType: entity_type,
        entityId: entity_id,
        newValues: { shared_with: target_organization_id }
      });

      return apiResponse.created(res, 'تمت مشاركة السجل بنجاح', shared);
    } catch (error) {
      next(error);
    }
  }

  // 5. إلغاء/سحب مشاركة سجل
  static async revokeSharing(req, res, next) {
    try {
      const { shareId } = req.params;
      const { reason } = req.body;

      const revoked = await OrganizationSharingModel.revokeRecordShare(shareId, req.user.id, reason);
      if (!revoked) {
        throw ApiError.notFound('سجل المشاركة غير موجود أو ملغى سابقاً');
      }

      await logAuditEvent(req, {
        actionType: 'RECORD_SHARE_REVOKED',
        entityType: revoked.entity_type,
        entityId: revoked.entity_id,
        newValues: { reason }
      });

      return apiResponse.success(res, 'تم سحب وإلغاء مشاركة السجل وتدوين السبب بنجاح', revoked);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = OrganizationSharingController;