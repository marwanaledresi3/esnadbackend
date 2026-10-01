const ForensicRequest = require('../models/ForensicRequest');
const ForensicService = require('../services/ForensicService');
const Case = require('../models/Case');
const apiResponse = require('../utils/apiResponse');
const ApiError = require('../errors/ApiError');

class ForensicController {
  // 1. إيجاد أو تقديم طلب فحص شرعي لحالة
  static async createRequest(req, res, next) {
    try {
      const { case_id, requesting_authority, request_type, notes } = req.body;

      if (!case_id || !requesting_authority || !request_type) {
        throw ApiError.badRequest('يرجى تقديم رقم الحالة، الجهة الطالبة، ونوع الفحص المطلوب');
      }

      const requestRecord = await ForensicRequest.create({
        case_id,
        requesting_authority,
        request_type,
        notes,
        requested_by_user_id: req.user.user_id
      });

      // توثيق طلب الفحص في الـ Timeline
      await Case.addEvent({
        case_id,
        event_type: 'FORENSIC_REQUESTED',
        description: `تم إحالة الحالة للطب الشرعي بناءً على طلب جهة: ${requesting_authority} (${request_type})`,
        facility_id: req.user.organization_id,
        actor_user_id: req.user.user_id,
        event_metadata: { forensic_request_id: requestRecord.forensic_request_id }
      });

      return apiResponse.success(res, 'تم تقديم طلب الفحص الشرعي بنجاح', requestRecord, 201);
    } catch (error) {
      next(error);
    }
  }

  // 2. رفع واعتماد نتائج التقرير الشرعي (الصفة التشريحية)
  static async submitReport(req, res, next) {
    try {
      const { forensicRequestId } = req.params;
      const payload = {
        ...req.body,
        forensic_request_id: forensicRequestId,
        actor_user_id: req.user.user_id,
        facility_id: req.user.organization_id
      };

      // في حال رفع مرفق تقرير ألماني/طبي
      if (req.file) {
        payload.report_attachment_url = req.file.path;
      }

      const report = await ForensicService.submitForensicReport(payload);
      return apiResponse.success(res, 'تم اعتماد وتثبيت التقرير الشرعي بنجاح', report);
    } catch (error) {
      next(error);
    }
  }

  // 3. عرض طلبات الفحص الشرعي للحالة
  static async getRequestsByCase(req, res, next) {
    try {
      const { caseId } = req.params;
      const requests = await ForensicRequest.findByCaseId(caseId);
      return apiResponse.success(res, 'طلبات وتقارير الفحص الشرعي للحالة', requests);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ForensicController;