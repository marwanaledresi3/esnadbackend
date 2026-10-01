const { pool } = require('../config/db');
const BodyCase = require('../models/BodyCase');
const Handover = require('../models/Handover');
const Case = require('../models/Case');
const ApiError = require('../errors/ApiError');

class HandoverService {
  // معالجة محضر تسليم الجثمان وإغلاق الملف
  static async processHandover(payload) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. التحقق من وجود الجثمان بالثلاجة
      const bodyCase = await BodyCase.findByCaseId(payload.case_id);
      if (!bodyCase) {
        throw ApiError.notFound('لم يتم العثور على سجل الجثمان في الثلاجة لهذه الحالة');
      }

      if (bodyCase.status === 'HANDED_OVER') {
        throw ApiError.badRequest('تم تسليم هذا الجثمان سابقاً');
      }

      // 2. تسجيل محضر التسليم
      const handoverRecord = await Handover.create({
        case_id: payload.case_id,
        receiver_name: payload.receiver_name,
        receiver_id_number: payload.receiver_id_number,
        receiver_relationship: payload.receiver_relationship,
        receiver_phone: payload.receiver_phone,
        is_official_entity: payload.is_official_entity,
        handover_notes: payload.handover_notes,
        handed_over_by_user_id: payload.actor_user_id
      }, client);

      // 3. تحديث حالة الجثمان إلى HANDED_OVER
      await BodyCase.updateStatus(bodyCase.body_case_id, 'HANDED_OVER', client);

      // 4. تحديث حالة ملف الحالة إلى CLOSED
      await client.query(
        `UPDATE cases SET current_status = 'CLOSED', updated_at = NOW() WHERE case_id = $1`,
        [payload.case_id]
      );

      // 5. تدوين حدث التسليم النهائي في السجل الزمني (Timeline)
      await Case.addEvent({
        case_id: payload.case_id,
        event_type: 'BODY_HANDED_OVER',
        description: `تم تسليم الجثمان رسمياً إلى: ${payload.receiver_name} (${payload.receiver_relationship || 'جهة رسمية'}) - رقم الهوية: ${payload.receiver_id_number}`,
        facility_id: payload.facility_id,
        actor_user_id: payload.actor_user_id,
        event_metadata: { handover_id: handoverRecord.handover_id }
      }, client);

      await client.query('COMMIT');
      return handoverRecord;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = HandoverService;