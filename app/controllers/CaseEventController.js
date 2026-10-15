// controllers/CaseEventController.js
const { pool } = require('../config/db');
const CaseEventModel = require('../models/CaseEventModel');
const apiResponse = require('../utils/apiResponse');
const ApiError = require('../errors/ApiError');

class CaseEventController {

  // تسجيل حدث عام أو خاص بالحالة
  static async recordEvent(req, res, next) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { case_id } = req.params;
      const {
        event_type_id,
        event_datetime,
        department_id,
        description,
        notes,
        // تفاصيل إضافية إن وجِدت بحسب نوع الحدث
        operation_data,
        diagnosis_data,
        disability_data,
        death_data
      } = req.body;

      const organizationId = req.currentOrganizationId;
      const userId = req.user.id;

      // 1. إنشاء سجل الحدث الأساسي
      const event = await CaseEventModel.createEvent({
        case_id,
        event_type_id,
        event_datetime,
        organization_id: organizationId,
        department_id,
        actor_user_id: userId,
        description,
        notes,
        created_by: userId
      }, client);

      // 2. معالجة البيانات الملحقة حسب نوع الحدث
      let additionalDetail = null;

      if (operation_data) {
        additionalDetail = await CaseEventModel.addOperationDetails({
          case_id,
          event_id: event.id,
          ...operation_data
        }, client);
      }

      if (diagnosis_data) {
        additionalDetail = await CaseEventModel.addDiagnosis({
          case_id,
          event_id: event.id,
          ...diagnosis_data
        }, client);
      }

      if (disability_data) {
        additionalDetail = await CaseEventModel.addDisability({
          case_id,
          ...disability_data
        }, client);
      }

      if (death_data) {
        additionalDetail = await CaseEventModel.addDeathRecord({
          case_id,
          event_id: event.id,
          ...death_data
        }, client);

        // تحديث حالة الحالة العامة في جدول cases إلى متوفى
        await client.query(`UPDATE cases SET current_status = 'DECEASED' WHERE id = $1`, [case_id]);
      }

      await client.query('COMMIT');

      return apiResponse.created(res, 'تم تسجيل الحدث في السجل الزمني بنجاح', {
        event,
        details: additionalDetail
      });
    } catch (error) {
      await client.query('ROLLBACK');
      next(error);
    } finally {
      client.release();
    }
  }

  // استعراض التايم لاين (Timeline) الخاص بالحالة
  static async getTimeline(req, res, next) {
    try {
      const { case_id } = req.params;
      const organizationId = req.currentOrganizationId;

      const timeline = await CaseEventModel.getCaseTimeline(case_id, organizationId);
      return apiResponse.success(res, 'السجل الزمني للأحداث', timeline);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = CaseEventController;