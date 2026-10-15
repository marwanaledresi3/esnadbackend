// controllers/DocumentAuthorizationController.js
const { pool } = require('../config/db');
const AuthorizationModel = require('../models/AuthorizationModel');
const DocumentModel = require('../models/DocumentModel');
const apiResponse = require('../utils/apiResponse');
const ApiError = require('../errors/ApiError');

class DocumentAuthorizationController {

  // 1. رفع وتسجيل وثيقة مشفرة
  static async uploadDocument(req, res, next) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const userId = req.user.id;
      const organizationId = req.currentOrganizationId;

      const {
        document_number,
        document_type_id,
        title,
        issued_at,
        file_reference, // تم الحصول عليه بعد معالجة رفع الملف وتشفيره من الميدل وير
        file_size,
        mime_type,
        file_hash, // بصمة SHA-256 المحسوبة عند الرفع
        entity_type,
        entity_id
      } = req.body;

      const document = await DocumentModel.createDocument({
        document_number,
        document_type_id,
        title,
        issued_by_organization_id: organizationId,
        issued_at,
        file_reference,
        file_size,
        mime_type,
        file_hash,
        uploaded_by: userId,
        entity_type,
        entity_id
      }, client);

      await client.query('COMMIT');
      return apiResponse.created(res, 'تم رفع وتوثيق المستند المشفر بنجاح', document);
    } catch (error) {
      await client.query('ROLLBACK');
      next(error);
    } finally {
      client.release();
    }
  }

  // 2. إصدار وتسجيل تصريح رسمي
  static async issueAuthorization(req, res, next) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const userId = req.user.id;
      const organizationId = req.currentOrganizationId;

      const {
        authorization_number,
        authorization_type_id,
        valid_from,
        valid_until,
        document_id,
        notes,
        target_type,
        target_id
      } = req.body;

      const authorization = await AuthorizationModel.createAuthorization({
        authorization_number,
        authorization_type_id,
        issuer_organization_id: organizationId,
        issued_by_user_id: userId,
        valid_from,
        valid_until,
        document_id,
        notes,
        created_by: userId,
        target_type,
        target_id
      }, client);

      // تحديث حالة الطلبات المربوطة إن وجِدت (مثلاً: حالة طلب الطب الشرعي إلى AUTHORIZED)
      if (target_type === 'FORENSIC_REQUEST') {
        await client.query(
          `UPDATE forensic_requests SET status = 'AUTHORIZED', authorization_id = $1 WHERE id = $2`,
          [authorization.id, target_id]
        );
      }

      await client.query('COMMIT');
      return apiResponse.created(res, 'تم إصدار واعتماد التصريح الرسمي بنجاح', authorization);
    } catch (error) {
      await client.query('ROLLBACK');
      next(error);
    } finally {
      client.release();
    }
  }

  // 3. مشاركة وثيقة مع جهة معينة
  static async shareDocument(req, res, next) {
    try {
      const { document_id, shared_with_organization_id, permission, reason } = req.body;
      const userId = req.user.id;

      const share = await DocumentModel.shareDocument({
        document_id,
        shared_with_organization_id,
        shared_by_user_id: userId,
        permission,
        reason
      });

      return apiResponse.created(res, 'تمت مشاركة الوثيقة مع الجهة المطلوبة بنجاح', share);
    } catch (error) {
      next(error);
    }
  }

  // 4. إلغاء مشاركة وثيقة
  static async revokeDocumentShare(req, res, next) {
    try {
      const { shareId } = req.params;
      const userId = req.user.id;

      const revokedShare = await DocumentModel.revokeDocumentShare(shareId, userId);
      if (!revokedShare) {
        throw ApiError.notFound('سجل المشاركة غير موجود');
      }

      return apiResponse.success(res, 'تم إلغاء مشاركة الوثيقة مع الاحتفاظ بالسجل التاريخي بنجاح');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = DocumentAuthorizationController;