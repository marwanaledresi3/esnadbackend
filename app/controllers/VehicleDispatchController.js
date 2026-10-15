// controllers/VehicleDispatchController.js
const VehicleDispatchService = require('../services/VehicleDispatchService');
const apiResponse = require('../utils/apiResponse');

class VehicleDispatchController {
  // 1. إصدار أمر خروج سيارة وطاقم
  static async createDispatch(req, res, next) {
    try {
      const dispatchOrder = await VehicleDispatchService.createDispatchOrder(req.body, {
        userId: req.user.id,
        organizationId: req.currentOrganizationId,
      });

      return apiResponse.success(res, 'تم إصدار أمر خروج السيارة وتعيين الطاقم بنجاح', dispatchOrder, 201);
    } catch (err) {
      next(err);
    }
  }

  // 2. تسجيل حدث رحلة (تتبع الخروج والوصول)
  static async recordEvent(req, res, next) {
    try {
      const event = await VehicleDispatchService.recordTripEvent(
        req.params.id,
        req.body,
        {
          userId: req.user.id,
          organizationId: req.currentOrganizationId,
        }
      );

      return apiResponse.success(res, 'تم تسجيل حدث الرحلة بنجاح', event, 201);
    } catch (err) {
      next(err);
    }
  }

  // 3. جلب تفاصيل أمر الخروج وتتبعه
  static async getDispatchDetails(req, res, next) {
    try {
      const details = await VehicleDispatchService.getDispatchDetails(req.params.id);
      return apiResponse.success(res, 'تفاصيل أمر خروج السيارة والتتبع', details, 200);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = VehicleDispatchController;