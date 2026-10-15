// controllers/BodyReleaseController.js
const BodyReleaseService = require('../services/BodyReleaseService');
const apiResponse = require('../utils/apiResponse');

class BodyReleaseController {
  // 1. إصدار تصريح تسليم من المحور
  static async issueReleaseOrder(req, res, next) {
    try {
      const releaseOrder = await BodyReleaseService.issueReleaseOrder(req.body, {
        userId: req.user.id,
        organizationId: req.currentOrganizationId,
      });

      return apiResponse.success(res, 'تم إصدار أمر تسليم الجثمان بنجاح', releaseOrder, 201);
    } catch (err) {
      next(err);
    }
  }

  // 2. التحقق وتنفيذ التسليم المباشر في المستشفى
  static async executeHandover(req, res, next) {
    try {
      const handover = await BodyReleaseService.executeHandover(
        req.params.id,
        req.body,
        {
          userId: req.user.id,
          organizationId: req.currentOrganizationId,
        }
      );

      return apiResponse.success(res, 'تم التحقق من الهوية وتسليم الجثمان وإخلاء العهدة بنجاح', handover, 200);
    } catch (err) {
      next(err);
    }
  }

  // 3. طلب فحص طب شرعي
  static async requestForensicExam(req, res, next) {
    try {
      const forensicRequest = await BodyReleaseService.requestForensicExam(req.body, {
        userId: req.user.id,
        organizationId: req.currentOrganizationId,
      });

      return apiResponse.success(res, 'تم تقديم طلب الفحص الشرعي بنجاح', forensicRequest, 201);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = BodyReleaseController;