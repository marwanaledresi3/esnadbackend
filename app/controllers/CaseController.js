const CaseService = require('../services/CaseService');
const Case = require('../models/Case');
const apiResponse = require('../utils/apiResponse');

class CaseController {
  // إدخال حالة جديدة
  static async createCase(req, res, next) {
    try {
      const payload = {
        ...req.body,
        actor_user_id: req.user.user_id,
        facility_id: req.user.organization_id
      };

      // إذا تم رفع صورة مجهول الهوية عبر Multer/Cloudinary
      if (req.file) {
        payload.photo_url = req.file.path;
      }

      const result = await CaseService.createNewCase(payload);
      return apiResponse.success(res, 'تم تسجيل الحالة بملف زمني بنجاح', result, 201);
    } catch (error) {
      next(error);
    }
  }

  // عرض تفاصيل الحالة والسجل الزمني الكامل (Timeline)
  static async getCaseDetails(req, res, next) {
    try {
      const { caseId } = req.params;
      const caseDetails = await Case.findByIdWithTimeline(caseId);

      if (!caseDetails) {
        return res.status(404).json({ success: false, message: 'الحالة غير موجودة' });
      }

      return apiResponse.success(res, 'تفاصيل ملف الحالة', caseDetails);
    } catch (error) {
      next(error);
    }
  }

  // إضافة تحديث أو حدث زمني للحالة
  static async addEvent(req, res, next) {
    try {
      const { caseId } = req.params;
      const eventPayload = {
        ...req.body,
        actor_user_id: req.user.user_id,
        facility_id: req.user.organization_id
      };

      const newEvent = await CaseService.addCaseEvent(caseId, eventPayload);
      return apiResponse.success(res, 'تم تدوين الحدث في الـ Timeline بنجاح', newEvent, 201);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = CaseController;