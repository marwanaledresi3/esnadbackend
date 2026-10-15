// models/VehicleDispatch.js
const { pool } = require('../config/db');

class VehicleDispatch {
  /**
   * إنشاء أمر خروج سيارة جديد
   */
  static async create(data, dbClient = pool) {
    const query = `
      INSERT INTO vehicle_dispatch_orders (
        dispatch_order_number,
        transport_request_id,
        hospital_id,
        ambulance_id,
        driver_id,
        nurse_id,
        destination_location,
        mission_type,
        status,
        issued_by,
        notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *;
    `;
    const values = [
      data.dispatch_order_number,
      data.transport_request_id,
      data.hospital_id,
      data.ambulance_id,
      data.driver_id,
      data.nurse_id,
      data.destination_location,
      data.mission_type,
      data.status || 'issued',
      data.issued_by,
      data.notes || null,
    ];

    const result = await dbClient.query(query, values);
    return result.rows[0];
  }

  /**
   * تسجيل حدث جديد في خط التتبع الزمني للرحلة
   */
  static async addTripEvent(eventData, dbClient = pool) {
    const query = `
      INSERT INTO vehicle_trip_events (
        dispatch_order_id,
        event_type,
        location,
        recorded_by,
        notes
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [
      eventData.dispatch_order_id,
      eventData.event_type,
      eventData.location || null,
      eventData.recorded_by || null,
      eventData.notes || null,
    ];

    const result = await dbClient.query(query, values);
    return result.rows[0];
  }

  /**
   * البحث عن أمر خروج بواسطة الـ ID مع جلب بيانات الطاقم والسيارة
   */
  static async findById(id) {
    const query = `
      SELECT 
        vdo.*,
        a.plate_number,
        a.vehicle_type,
        u_driver.full_name AS driver_name,
        u_driver.phone AS driver_phone,
        u_nurse.full_name AS nurse_name,
        o.name AS hospital_name
      FROM vehicle_dispatch_orders vdo
      LEFT JOIN ambulances a ON a.id = vdo.ambulance_id
      LEFT JOIN users u_driver ON u_driver.id = vdo.driver_id
      LEFT JOIN users u_nurse ON u_nurse.id = vdo.nurse_id
      LEFT JOIN organizations o ON o.id = vdo.hospital_id
      WHERE vdo.id = $1;
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * جلب أحداث التتبع الخاصة بأمر خروج معين
   */
  static async getTripEvents(dispatchOrderId) {
    const query = `
      SELECT 
        vte.*,
        u.full_name AS recorder_name
      FROM vehicle_trip_events vte
      LEFT JOIN users u ON u.id = vte.recorded_by
      WHERE vte.dispatch_order_id = $1
      ORDER BY vte.event_time ASC;
    `;
    const result = await pool.query(query, [dispatchOrderId]);
    return result.rows;
  }

  /**
   * تحديث حالة أمر الخروج
   */
  static async updateStatus(id, status, dbClient = pool) {
    const query = `
      UPDATE vehicle_dispatch_orders
      SET status = $1
      WHERE id = $2
      RETURNING *;
    `;
    const result = await dbClient.query(query, [status, id]);
    return result.rows[0];
  }
}

module.exports = VehicleDispatch;