// controllers/HospitalCustodyController.js
const HospitalCustodyService = require('../services/HospitalCustodyService');
const apiResponse = require('../utils/apiResponse');

class HospitalCustodyController {
  // 1. تسجيل استلام جثمان
  static async receiveBody(req, res, next) {
    try {
      const bodyCase = await HospitalCustodyService.receiveBodyCase(req.body, {
        userId: req.user.id,
        organizationId: req.currentOrganizationId,
      });

      return apiResponse.success(res, 'تم تسجيل استلام الجثمان بنجاح', bodyCase, 201);
    } catch (err) {
      next(err);
    }
  }

  // 2. تسجيل وفاة جريح داخل المستشفى
  static async recordDeath(req, res, next) {
    try {
      const result = await HospitalCustodyService.recordHospitalDeath(
        req.params.caseId,
        req.body,
        {
          userId: req.user.id,
          organizationId: req.currentOrganizationId,
        }
      );

      return apiResponse.success(res, 'تم تسجيل الوفاة وتحويل الحالة إلى جثمان بنجاح', result, 201);
    } catch (err) {
      next(err);
    }
  }

  // 3. إيداع الجثمان في الثلاجة
  static async storeInFridge(req, res, next) {
    try {
      const updatedBody = await HospitalCustodyService.storeInFridge(
        req.params.id,
        req.body,
        {
          userId: req.user.id,
          organizationId: req.currentOrganizationId,
        }
      );

      return apiResponse.success(res, 'تم إيداع الجثمان بالثلاجة وتحديث حالة الحفظ', updatedBody, 200);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = HospitalCustodyController;