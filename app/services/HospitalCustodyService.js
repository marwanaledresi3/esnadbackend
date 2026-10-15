// services/HospitalCustodyService.js
const { pool } = require('../config/db');
const HospitalCustody = require('../models/HospitalCustody');
const ApiError = require('../errors/ApiError');

class HospitalCustodyService {
  /**
   * 1. استلام جثمان في المستشفى (سواء مباشر أو بطلب نقل مسبق)
   */
  static async receiveBodyCase(payload, context) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const body_number = payload.body_number || `BODY-${Date.now().toString().slice(-6)}`;

      const bodyCase = await HospitalCustody.createBodyCase({
        body_number,
        case_id: payload.case_id,
        person_id: payload.person_id,
        current_organization_id: context.organizationId,
        current_location: payload.current_location || 'المستشفى - الاستقبال',
        status: 'received',
        notes: payload.notes
      }, client);

      // إذا كان هناك طلب نقل مرتبط يتم تحديث حالته إلى completed
      if (payload.transport_request_id) {
        await client.query(
          `UPDATE transport_requests SET status = 'completed' WHERE id = $1`,
          [payload.transport_request_id]
        );
      }

      await client.query('COMMIT');
      return bodyCase;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 2. تسجيل وفاة جريح داخل المستشفى وتحويل مسار الحالة إلى جثمان
   */
  static async recordHospitalDeath(caseId, payload, context) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // جلب بيانات الحالة والتأكد من وجودها
      const caseRes = await client.query(`SELECT id, person_id FROM cases WHERE id = $1`, [caseId]);
      if (caseRes.rows.length === 0) {
        throw ApiError.notFound('ملف الحالة الطبية غير موجود');
      }
      const existingCase = caseRes.rows[0];

      // 1. إدخال سجل الوفاة الطبية
      const deathRecord = await HospitalCustody.createDeathRecord({
        case_id: caseId,
        hospital_id: context.organizationId,
        death_type: payload.death_type || 'AFTER_HOSPITAL_ARRIVAL',
        reported_by: context.userId,
        notes: payload.notes
      }, client);

      // 2. تحديث حالة الحالة الطبية الرئيسية إلى متوفى
      await client.query(`UPDATE cases SET case_status = 'deceased' WHERE id = $1`, [caseId]);

      // 3. إنشاء سجل الجثمان المرتبط بنفس الشخص والحالة
      const body_number = `BODY-${Date.now().toString().slice(-6)}`;
      const bodyCase = await HospitalCustody.createBodyCase({
        body_number,
        case_id: caseId,
        person_id: existingCase.person_id,
        current_organization_id: context.organizationId,
        current_location: 'المستشفى - قسم الثلاجة',
        status: 'received',
        notes: 'تحويل تلقائي بعد تسجيل حالة الوفاة بالمستشفى'
      }, client);

      await client.query('COMMIT');
      return { deathRecord, bodyCase };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 3. إيداع وحفظ الجثمان في ثلاجة المستشفى
   */
  static async storeInFridge(bodyCaseId, payload, context) {
    const bodyCase = await HospitalCustody.findBodyById(bodyCaseId);
    if (!bodyCase) {
      throw ApiError.notFound('سجل الجثمان غير موجود');
    }

    const updatedLocation = `ثلاجة حفظ الجثامين - خانة: ${payload.fridge_slot}`;
    const updatedBody = await HospitalCustody.updateStorageLocation(
      bodyCaseId,
      updatedLocation,
      'preserved'
    );

    return updatedBody;
  }
}

module.exports = HospitalCustodyService;