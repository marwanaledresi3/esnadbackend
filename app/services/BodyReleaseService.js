// services/BodyReleaseService.js
const { pool } = require('../config/db');
const BodyRelease = require('../models/BodyRelease');
const ApiError = require('../errors/ApiError');

class BodyReleaseService {
  /**
   * 1. إصدار أمر تسليم جثمان من المحور (Hub Action)
   */
  static async issueReleaseOrder(payload, context) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const order_number = `BRO-${Date.now().toString().slice(-6)}`;

      // إنشاء أمر التسليم
      const releaseOrder = await BodyRelease.createReleaseOrder({
        order_number,
        body_case_id: payload.body_case_id,
        hospital_id: payload.hospital_id,
        recipient_name: payload.recipient_name,
        recipient_id_number: payload.recipient_id_number,
        relationship_to_deceased: payload.relationship_to_deceased,
        authorization_id: payload.authorization_id,
        issued_by: context.userId,
        notes: payload.notes
      }, client);

      // تحديث حالة الجثمان لـ release_authorized
      await client.query(
        `UPDATE body_cases SET status = 'release_authorized' WHERE id = $1`,
        [payload.body_case_id]
      );

      await client.query('COMMIT');
      return releaseOrder;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 2. التحقق من الهوية وتنفيذ التسليم الفعلي في المستشفى (Hospital Action)
   */
  static async executeHandover(releaseOrderId, payload, context) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. جلب أمر التسليم الصادر والتحقق من تبعيته للمستشفى الحالي
      const releaseOrder = await BodyRelease.findReleaseOrderById(releaseOrderId);
      if (!releaseOrder) {
        throw ApiError.notFound('أمر تسليم الجثمان غير موجود');
      }

      if (releaseOrder.hospital_id !== context.organizationId) {
        throw ApiError.forbidden('أمر التسليم غير موجه لمستشفاكم الحالي');
      }

      // 2. التحقق من مطابقة رقم هوية المستلم الحاضر مع المذكور في أمر التسليم
      if (payload.recipient_id_number !== releaseOrder.recipient_id_number) {
        throw ApiError.badRequest('رقم هوية المستلم الحاضر غير مطابق لأمر التسليم الصادر من المحور');
      }

      // 3. تحديث أمر الخروج لـ executed ومطابقة الهوية
      await client.query(
        `UPDATE body_release_orders 
         SET identity_verified = TRUE, verification_method = $1, status = 'executed', executed_at = NOW()
         WHERE id = $2`,
        [payload.verification_method || 'فحص بطاقة شخصية', releaseOrderId]
      );

      // 4. إنشاء سجل التسليم النهائى
      const handover = await BodyRelease.createHandover({
        body_case_id: releaseOrder.body_case_id,
        release_order_id: releaseOrderId,
        recipient_name: releaseOrder.recipient_name,
        recipient_id_number: releaseOrder.recipient_id_number,
        relationship: releaseOrder.relationship_to_deceased,
        handed_over_by: context.userId,
        notes: payload.notes
      }, client);

      // 5. تفريغ الجثمان رسمياً من عهدة المستشفى (status = handed_over)
      await client.query(
        `UPDATE body_cases 
         SET status = 'handed_over', current_location = 'خروج نهائي - تم التسليم لذويه'
         WHERE id = $1`,
        [releaseOrder.body_case_id]
      );

      await client.query('COMMIT');
      return handover;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 3. طلب فحص الطب الشرعي
   */
  static async requestForensicExam(payload, context) {
    const forensicRequest = await BodyRelease.createForensicRequest({
      body_case_id: payload.body_case_id,
      hospital_id: payload.hospital_id,
      requested_by: context.userId,
      reason: payload.reason,
      notes: payload.notes
    });

    // تحديث حالة الجثمان لـ forensic_pending
    await pool.query(
      `UPDATE body_cases SET status = 'forensic_pending' WHERE id = $1`,
      [payload.body_case_id]
    );

    return forensicRequest;
  }
}

module.exports = BodyReleaseService;