const Ambulance = require('../models/Ambulance');
const AmbulanceService = require('../services/AmbulanceService');
const apiResponse = require('../utils/apiResponse');

class AmbulanceController {
  // عرض سيارات الإسعاف الجاهزة للخدمة
  static async getAvailableAmbulances(req, res, next) {
    try {
      const ambulances = await Ambulance.findAvailable();
      return apiResponse.success(res, 'سيارات الإسعاف المتاحة', ambulances);
    } catch (error) {
      next(error);
    }
  }

  // إرسال وتكليف فريق إسعاف بمهمة بلاغ
  static async dispatchAmbulance(req, res, next) {
    try {
      const result = await AmbulanceService.dispatchAmbulance(req.body);
      return apiResponse.success(res, 'تم تكليف وتوجيه الإسعاف للموقع بنجاح', result, 201);
    } catch (error) {
      next(error);
    }
  }

  // تحديث حالة المهمة الإسعافية الميدانية (وصول / نقل / إنهاء)
  static async updateDispatchStatus(req, res, next) {
    try {
      const { dispatchId } = req.params;
      const { dispatch_status } = req.body;

      const updatedDispatch = await Ambulance.updateDispatchStatus(dispatchId, dispatch_status);
      return apiResponse.success(res, 'تم تحديث حالة المهمة الإسعافية بنجاح', updatedDispatch);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AmbulanceController;