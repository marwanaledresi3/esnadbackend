const BodyCase = require('../models/BodyCase');
const Case = require('../models/Case');
const apiResponse = require('../utils/apiResponse');
const ApiError = require('../errors/ApiError');

class BodyController {
  // إدخال جثمان إلى الثلاجة
 
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