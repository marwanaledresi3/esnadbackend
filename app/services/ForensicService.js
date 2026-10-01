const { pool } = require('../config/db');
const ForensicRequest = require('../models/ForensicRequest');
const Case = require('../models/Case');
const ApiError = require('../errors/ApiError');

class ForensicService {
  // توثيق التقرير الشرعي وإغلاق إجراء الفحص
  static async submitForensicReport(payload) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. تسجيل نتائج التقرير الشرعي
      const report = await ForensicRequest.submitReport({
        forensic_request_id: payload.forensic_request_id,
        cause_of_death: payload.cause_of_death,
        external_examination: payload.external_examination,
        internal_examination: payload.internal_examination,
        toxicological_notes: payload.toxicological_notes,
        examiner_user_id: payload.actor_user_id,
        report_attachment_url: payload.report_attachment_url
      }, client);

      if (!report) {
        throw ApiError.notFound('طلب الفحص الشرعي غير موجود');
      }

      // 2. تدوين الحدث الطبي في السجل الزمني (Timeline) للحالة
      await Case.addEvent({
        case_id: report.case_id,
        event_type: 'FORENSIC_REPORT_SUBMITTED',
        description: `تم الانتهاء من الفحص الشرعي وإصدار التقرير. سبب الوفاة: ${payload.cause_of_death}`,
        facility_id: payload.facility_id,
        actor_user_id: payload.actor_user_id,
        event_metadata: {
          forensic_request_id: report.forensic_request_id,
          cause_of_death: payload.cause_of_death,
          attachment: payload.report_attachment_url || null
        }
      }, client);

      await client.query('COMMIT');
      return report;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = ForensicService;