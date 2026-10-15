// controllers/TransportMissionController.js
const TransportMissionService = require('../services/TransportMissionService');
const apiResponse = require('../utils/apiResponse');

class TransportMissionController {
  // 1. إنشاء مهمة جديدة
  static async createMission(req, res, next) {
    try {
      const mission = await TransportMissionService.createMission(req.body, {
        userId: req.user.id,
        organizationId: req.currentOrganizationId,
      });

      return apiResponse.success(res, 'تم إنشاء وتعيين المهمة الميدانية بنجاح', mission, 201);
    } catch (err) {
      next(err);
    }
  }

  // 2. جلب قائمة المهام
  static async getMissions(req, res, next) {
    try {
      const missions = await TransportMissionService.getMissionsList({
        requestId: req.query.requestId,
        status: req.query.status,
        organizationId: req.currentOrganizationId,
      });

      return apiResponse.success(res, 'تم جلب قائمة المهام بنجاح', missions, 200);
    } catch (err) {
      next(err);
    }
  }

  // 3. جلب تفاصيل مهمة واحدة
  static async getMissionById(req, res, next) {
    try {
      const mission = await TransportMissionService.getMissionById(req.params.id);
      return apiResponse.success(res, 'تفاصيل المهمة الميدانية', mission, 200);
    } catch (err) {
      next(err);
    }
  }

  // 4. تحديث حالة المهمة (تتبع الخروج والوصول)
  static async updateStatus(req, res, next) {
    try {
      const updatedMission = await TransportMissionService.updateMissionStatus(
        req.params.id,
        req.body,
        {
          userId: req.user.id,
          organizationId: req.currentOrganizationId,
        }
      );

      return apiResponse.success(res, 'تم تحديث حالة المهمة بنجاح', updatedMission, 200);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = TransportMissionController;