const { pool } = require('../config/db');
const Person = require('../models/Person');
const Case = require('../models/Case');
const ApiError = require('../errors/ApiError');

class CaseService {
  // فتح حالة جديدة وحجز رقم الشخص
  static async createNewCase(payload) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. توليد رقم موحد للشخص والحالة
      const timestamp = Date.now().toString().slice(-6);
      const person_number = `PRN-${timestamp}`;
      const case_number = `CASE-${timestamp}`;

      // 2. إنشاء سجل الشخص
      const person = await Person.create({
        person_number,
        identity_status: payload.identity_status || 'UNKNOWN',
        national_id: payload.national_id,
        full_name: payload.full_name,
        gender: payload.gender,
        age_estimate: payload.age_estimate,
        photo_url: payload.photo_url
      }, client);

      // 3. فتح ملف الحالة
      const newCase = await Case.create({
        case_number,
        person_id: person.person_id,
        current_status: 'OPEN',
        created_by_facility_id: payload.facility_id
      }, client);

      // 4. تدوين حدث الافتتاح في الـ Timeline
      await Case.addEvent({
        case_id: newCase.case_id,
        event_type: 'CASE_CREATED',
        description: `تم فتح ملف الحالة بواسطة الجهة: ${payload.facility_name || 'النظام'}`,
        facility_id: payload.facility_id,
        actor_user_id: payload.actor_user_id,
        event_metadata: { initial_entry: payload.entry_notes || '' }
      }, client);

      await client.query('COMMIT');
      return { case: newCase, person };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // إضافة حدث مساري جديد للمف
  static async addCaseEvent(caseId, eventPayload) {
    const caseData = await Case.findByIdWithTimeline(caseId);
    if (!caseData) {
      throw ApiError.notFound('ملف الحالة غير موجود');
    }

    const event = await Case.addEvent({
      case_id: caseId,
      event_type: eventPayload.event_type,
      description: eventPayload.description,
      facility_id: eventPayload.facility_id,
      actor_user_id: eventPayload.actor_user_id,
      event_metadata: eventPayload.event_metadata
    });

    return event;
  }
}

module.exports = CaseService;