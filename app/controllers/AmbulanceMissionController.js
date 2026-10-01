const AmbulanceMission = require('../models/AmbulanceMission');
const apiResponse = require('../utils/apiResponse');

class AmbulanceMissionController {
  static async addMilestone(req, res, next) {
    try {
      const { dispatchId } = req.params;
      const milestone = await AmbulanceMission.logMilestone({
        dispatch_id: dispatchId,
        ...req.body,
        actor_user_id: req.user.user_id
      });
      return apiResponse.created(res, 'تم تسجيل نقطة التتبع للمهمة بنجاح', milestone);
    } catch (error) { next(error); }
  }

  static async getTimeline(req, res, next) {
    try {
      const { dispatchId } = req.params;
      const history = await AmbulanceMission.getMissionTimeline(dispatchId);
      return apiResponse.success(res, 'السجل الزمني لمهمة الإسعاف', history);
    } catch (error) { next(error); }
  }
}

module.exports = AmbulanceMissionController;