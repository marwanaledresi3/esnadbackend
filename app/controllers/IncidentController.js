const Incident = require('../models/Incident');
const apiResponse = require('../utils/apiResponse');
const ApiError = require('../errors/ApiError');

class IncidentController {
  // استقبال وتمرير بلاغ جديد
  static async createIncident(req, res, next) {
    try {
      const { location_name, caller_name, caller_phone, latitude, longitude, description, severity_level } = req.body;

      if (!location_name) {
        throw ApiError.badRequest('موقع البلاغ مطلوب بشكل أساسي');
      }

      const timestamp = Date.now().toString().slice(-6);
      const incident_number = `INC-${timestamp}`;

      const newIncident = await Incident.create({
        incident_number,
        caller_name,
        caller_phone,
        location_name,
        latitude,
        longitude,
        description,
        severity_level,
        reported_by_user_id: req.user.user_id
      });

      return apiResponse.success(res, 'تم تسجيل البلاغ بنجاح', newIncident, 201);
    } catch (error) {
      next(error);
    }
  }

  // عرض البلاغات القائمة
  static async getIncidents(req, res, next) {
    try {
      const { status, severity_level, limit, offset } = req.query;
      const incidents = await Incident.findAll({ status, severity_level, limit, offset });
      return apiResponse.success(res, 'قائمة البلاغات', incidents);
    } catch (error) {
      next(error);
    }
  }

  // جلب تفاصيل بلاغ محدد
  static async getIncidentById(req, res, next) {
    try {
      const { incidentId } = req.params;
      const incident = await Incident.findById(incidentId);

      if (!incident) {
        throw ApiError.notFound('البلاغ غير موجود');
      }

      return apiResponse.success(res, 'تفاصيل البلاغ', incident);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = IncidentController;