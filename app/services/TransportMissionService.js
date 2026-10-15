// services/TransportMissionService.js
const { pool } = require('../config/db');
const TransportMission = require('../models/TransportMission');
const ApiError = require('../errors/ApiError');

class TransportMissionService {
    static ALLOWED_STATUS_TRANSITIONS = {
    assigned: ['dispatched', 'cancelled'],
    dispatched: ['departed', 'cancelled'],
    departed: ['arrived_origin', 'cancelled'],
    arrived_origin: ['loading', 'cancelled'],
    loading: ['transporting', 'cancelled'],
    transporting: ['arrived_destination', 'cancelled'],
    arrived_destination: ['completed'],
    completed: [],
    cancelled: []
  };

  /**
   * التحقق من سلامة وتسلسل انتقال حالة المهمة الميدانية
   */
  static validateStatusTransition(currentStatus, newStatus) {
    const allowedNextStatuses = this.ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
    
    if (!allowedNextStatuses.includes(newStatus)) {
      throw ApiError.badRequest(
        `غير مسموح بنقل حالة المهمة الميدانية من (${currentStatus}) إلى (${newStatus}) مباشرة`
      );
    }
  }
  /**
   * إنشاء وتعيين مهمة جديدة
   */
  static async createMission(payload, context) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. إنشاء المهمة
      const newMission = await TransportMission.create({
        transport_request_id: payload.transport_request_id,
        dispatch_order_id: payload.dispatch_order_id,
        ambulance_id: payload.ambulance_id,
        driver_id: payload.driver_id,
        nurse_id: payload.nurse_id,
        status: 'assigned',
        notes: payload.notes
      }, client);

      // 2. تحديث حالة طلب النقل الرئيسي إلى assigned
      await client.query(
        `UPDATE transport_requests SET status = 'assigned' WHERE id = $1`,
        [payload.transport_request_id]
      );

      await client.query('COMMIT');
      return newMission;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * جلب تفاصيل مهمة معينة
   */
  static async getMissionById(missionId) {
    const mission = await TransportMission.findById(missionId);
    if (!mission) {
      throw ApiError.notFound('المهمة الميدانية غير موجودة');
    }
    return mission;
  }

  /**
   * جلب قائمة المهام بناءً على التصفية والجهة النشطة
   */
  static async getMissionsList({ requestId, status, organizationId }) {
    return await TransportMission.findAll({
      requestId,
      status,
      organizationId
    });
  }

  /**
   * تحديث حالة المهمة وتسجيل الأحداث اللحظية (تتبع الرحلة)
   */
  static async updateMissionStatus(missionId, { status, location, notes }, context) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. التأكد من وجود المهمة
      const mission = await TransportMission.findById(missionId);
      if (!mission) {
        throw ApiError.notFound('المهمة الميدانية غير موجودة');
      }

      // 2. تحديث حالة المهمة
      const updatedMission = await TransportMission.updateStatus(missionId, status, client);

      // 3. تسليط الأحداث الميدانية بجدول تتبع الرحلة في حال وجود أمر خروج مركب
      if (mission.dispatch_order_id) {
        await client.query(
          `INSERT INTO vehicle_trip_events (
            dispatch_order_id, event_type, location, recorded_by, notes
          ) VALUES ($1, $2, $3, $4, $5)`,
          [
            mission.dispatch_order_id,
            status.toUpperCase(), // مثال: DEPARTED, ARRIVED_LOCATION, COMPLETED
            location || null,
            context.userId,
            notes || null
          ]
        );
      }

      await client.query('COMMIT');
      return updatedMission;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = TransportMissionService;