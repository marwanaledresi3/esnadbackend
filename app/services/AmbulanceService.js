const { pool } = require('../config/db');
const Incident = require('../models/Incident');
const Ambulance = require('../models/Ambulance');
const ApiError = require('../errors/ApiError');

class AmbulanceService {
  // توجيه سيارة إسعاف لبلاغ قائم
  static async dispatchAmbulance(payload) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. التأكد من وجود البلاغ وأنه مفتوح
      const incident = await Incident.findById(payload.incident_id);
      if (!incident) {
        throw ApiError.notFound('البلاغ المطلوب غير موجود');
      }
      if (incident.status === 'RESOLVED' || incident.status === 'CANCELLED') {
        throw ApiError.badRequest('لا يمكن توجيه إسعاف لبلاغ مغلق أو ملغى');
      }

      // 2. إنتاج مهمة التوجيه (Dispatch)
      const dispatchRecord = await Ambulance.createDispatch({
        incident_id: payload.incident_id,
        ambulance_id: payload.ambulance_id,
        paramedic_user_id: payload.paramedic_user_id,
        driver_name: payload.driver_name,
        notes: payload.notes
      }, client);

      // 3. تحديث حالة سيارة الإسعاف إلى DISPATCHED
      await Ambulance.updateStatus(payload.ambulance_id, 'DISPATCHED', client);

      // 4. تحديث حالة البلاغ إلى IN_PROGRESS
      await Incident.updateStatus(payload.incident_id, 'IN_PROGRESS', client);

      await client.query('COMMIT');
      return dispatchRecord;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = AmbulanceService;