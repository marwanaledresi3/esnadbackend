// controllers/CaseSharingController.js
const { pool } = require('../config/db');
const apiResponse = require('../utils/apiResponse');
const ApiError = require('../errors/ApiError');

class CaseSharingController {

  // مشاركة حالة مع جهة أخرى مرطبطة
  static async shareCase(req, res, next) {
    try {
      const { case_id, target_organization_id, reason } = req.body;
      const sourceOrgId = req.currentOrganizationId;
      const userId = req.user.id;

      // 1. التأكد من وجود رابط فعال بين الجهتين في organization_links
      const linkCheck = await pool.query(`
        SELECT id FROM organization_links 
        WHERE ((source_organization_id = $1 AND target_organization_id = $2)
           OR (source_organization_id = $2 AND target_organization_id = $1))
          AND status = 'active'
      `, [sourceOrgId, target_organization_id]);

      if (linkCheck.rows.length === 0) {
        throw ApiError.badRequest('لا توجد علاقة ربط رسمية وفعالة مع الجهة المستهدفة');
      }

      // 2. تسجيل المشاركة في shared_records
      const shareRes = await pool.query(`
        INSERT INTO shared_records (case_id, shared_with_organization_id, shared_by_user_id, reason, status)
        VALUES ($1, $2, $3, $4, 'active')
        ON CONFLICT (case_id, shared_with_organization_id) WHERE status = 'active'
        DO UPDATE SET shared_at = NOW(), reason = EXCLUDED.reason
        RETURNING *
      `, [case_id, target_organization_id, userId, reason || null]);

      // 3. كتابة السجل في audit_logs
      await pool.query(`
        INSERT INTO audit_logs (user_id, organization_id, action, entity_type, entity_id, result)
        VALUES ($1, $2, 'SHARE_CASE', 'CASE', $3, 'SUCCESS')
      `, [userId, sourceOrgId, case_id]);

      return apiResponse.created(res, 'تمت مشاركة الحالة مع الجهة المرتبطة بنجاح', shareRes.rows[0]);
    } catch (error) {
      next(error);
    }
  }

  // إلغاء مشاركة حالة
  static async revokeSharing(req, res, next) {
    try {
      const { shareId } = req.params;
      const userId = req.user.id;

      const result = await pool.query(`
        UPDATE shared_records 
        SET status = 'revoked', revoked_at = NOW()
        WHERE id = $1
        RETURNING *
      `, [shareId]);

      if (result.rows.length === 0) {
        throw ApiError.notFound('سجل المشاركة غير موجود');
      }

      return apiResponse.success(res, 'تم إلغاء مشاركة الحالة بنجاح');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = CaseSharingController;