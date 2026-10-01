const HandoverService = require('../services/HandoverService');
const apiResponse = require('../utils/apiResponse');

class HandoverController {
  // إجراء محضر تسليم الجثمان
  static async processHandover(req, res, next) {
    try {
      const payload = {
        ...req.body,
        actor_user_id: req.user.user_id,
        facility_id: req.user.organization_id
      };

      const result = await HandoverService.processHandover(payload);
      return apiResponse.success(res, 'تم محضر تسليم الجثمان وإغلاق الملف بنجاح', result, 201);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = HandoverController;