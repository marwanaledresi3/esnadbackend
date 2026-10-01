const BodyCase = require('../models/BodyCase');
const Case = require('../models/Case');
const apiResponse = require('../utils/apiResponse');
const ApiError = require('../errors/ApiError');

class BodyController {
  // إدخال جثمان إلى الثلاجة
  static async receiveBody(req, res, next) {
    try {
      const { case_id, fridge_number, slot_number, condition_notes } = req.body;

      if (!case_id || !fridge_number || !slot_number) {
        throw ApiError.badRequest('يرجى تحديد الحالة، رقم الثلاجة، ورقم العين/العين المخصصة');
      }

      const bodyRecord = await BodyCase.create({
        case_id,
        fridge_number,
        slot_number,
        condition_notes,
        received_by_user_id: req.user.user_id
      });

      // توثيق الحدث في الـ Timeline
      await Case.addEvent({
        case_id,
        event_type: 'BODY_PLACED_IN_MORTUARY',
        description: `تم إيداع الجثمان في الثلاجة رقم (${fridge_number}) - العين (${slot_number})`,
        facility_id: req.user.organization_id,
        actor_user_id: req.user.user_id,
        event_metadata: { fridge_number, slot_number }
      });

      return apiResponse.success(res, 'تم تسجيل إيداع الجثمان بالثلاجة بنجاح', bodyRecord, 201);
    } catch (error) {
      next(error);
    }
  }

  // الاستعلام عن موقع الجثمان بالثلاجة
  static async getBodyLocation(req, res, next) {
    try {
      const { caseId } = req.params;
      const bodyCase = await BodyCase.findByCaseId(caseId);

      if (!bodyCase) {
        throw ApiError.notFound('لا يوجد سجل جثمان مرتبط بهذه الحالة');
      }

      return apiResponse.success(res, 'بيانات موقع ومحضر الجثمان', bodyCase);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = BodyController;