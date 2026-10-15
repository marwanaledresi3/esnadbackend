// services/VehicleDispatchService.js
const { pool } = require('../config/db');
const VehicleDispatch = require('../models/VehicleDispatch');
const TransportMission = require('../models/TransportMission');
const ApiError = require('../errors/ApiError');

class VehicleDispatchService {
  /**
   * إنشاء أمر خروج سيارة وطاقمها وتعيين مهمة نقل
   */
  static async createDispatchOrder(payload, context) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. توليد رقم أمر الخروج
      const dispatch_order_number = `VDO-${Date.now().toString().slice(-6)}`;

      // 2. إدخال أمر خروج السيارة
      const dispatchOrder = await VehicleDispatch.create({
        dispatch_order_number,
        transport_request_id: payload.transport_request_id,
        hospital_id: context.organizationId,
        ambulance_id: payload.ambulance_id,
        driver_id: payload.driver_id,
        nurse_id: payload.nurse_id,
        destination_location: payload.destination_location,
        mission_type: payload.mission_type || 'TRANSPORT',
        issued_by: context.userId,
        notes: payload.notes
      }, client);

      // 3. ربط وتوثيق المهمة الميدانية (Transport Mission)
      await TransportMission.create({
        transport_request_id: payload.transport_request_id,
        dispatch_order_id: dispatchOrder.id,
        ambulance_id: payload.ambulance_id,
        driver_id: payload.driver_id,
        nurse_id: payload.nurse_id,
        status: 'assigned',
        notes: payload.notes
      }, client);

      // 4. تسجيل الحدث الأول (DISPATCHED)
      await VehicleDispatch.addTripEvent({
        dispatch_order_id: dispatchOrder.id,
        event_type: 'DISPATCHED',
        location: 'المستشفى',
        recorded_by: context.userId,
        notes: 'تم صدور أمر الخروج وتعيين الطاقم'
      }, client);

      // 5. تحديث حالة طلب النقل الرئيسي إلى assigned
      await client.query(
        `UPDATE transport_requests SET status = 'assigned' WHERE id = $1`,
        [payload.transport_request_id]
      );

      await client.query('COMMIT');
      return dispatchOrder;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * تسجيل حدث ميداني جديد في الرحلة (مغادرة، وصول، استلام، عودة)
   */
  static async recordTripEvent(dispatchOrderId, payload, context) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const dispatchOrder = await VehicleDispatch.findById(dispatchOrderId);
      if (!dispatchOrder) {
        throw ApiError.notFound('أمر خروج السيارة غير موجود');
      }

      // 1. إضافة الحدث
      const event = await VehicleDispatch.addTripEvent({
        dispatch_order_id: dispatchOrderId,
        event_type: payload.event_type, // مثال: LEFT_HOSPITAL, ARRIVED_LOCATION, RETURNED
        location: payload.location,
        recorded_by: context.userId,
        notes: payload.notes
      }, client);

      // 2. تحديث حالة أمر الخروج المقابلة
      let newStatus = null;
      if (payload.event_type === 'LEFT_HOSPITAL') newStatus = 'departed';
      if (payload.event_type === 'ARRIVED_LOCATION') newStatus = 'arrived_origin';
      if (payload.event_type === 'ARRIVED_DESTINATION') newStatus = 'arrived_destination';
      if (payload.event_type === 'RETURNED') newStatus = 'completed';

      if (newStatus) {
        await VehicleDispatch.updateStatus(dispatchOrderId, newStatus, client);
      }

      await client.query('COMMIT');
      return event;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * جلب أمر الخروج وسجل تتبعه
   */
  static async getDispatchDetails(dispatchOrderId) {
    const dispatchOrder = await VehicleDispatch.findById(dispatchOrderId);
    if (!dispatchOrder) {
      throw ApiError.notFound('أمر خروج السيارة غير موجود');
    }

    const events = await VehicleDispatch.getTripEvents(dispatchOrderId);
    return {
      ...dispatchOrder,
      events
    };
  }
}

module.exports = VehicleDispatchService;