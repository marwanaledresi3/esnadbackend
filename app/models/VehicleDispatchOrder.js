// models/VehicleDispatchOrder.js
const {pool} = require('../config/db');

class VehicleDispatchOrder {
  static async getAll({ status, hospital_id, transport_request_id, limit = 100, offset = 0 } = {}) {
    let query = `
      SELECT
        vdo.*,
        h.name AS hospital_name,
        a.vehicle_code AS ambulance_code,
        a.vehicle_type AS ambulance_type,
        d.full_name AS driver_name,
        n.full_name AS nurse_name,
        tr.request_number AS transport_request_number
      FROM vehicle_dispatch_orders vdo
      LEFT JOIN organizations h ON h.id = vdo.hospital_id
      LEFT JOIN ambulances a ON a.id = vdo.ambulance_id
      LEFT JOIN users d ON d.id = vdo.driver_id
      LEFT JOIN users n ON n.id = vdo.nurse_id
      LEFT JOIN transport_requests tr ON tr.id = vdo.transport_request_id
      WHERE 1=1
    `;
    const params = [];
    let i = 1;
    if (status) { query += ` AND vdo.status = $${i}`; params.push(status); i++; }
    if (hospital_id) { query += ` AND vdo.hospital_id = $${i}`; params.push(hospital_id); i++; }
    if (transport_request_id) { query += ` AND vdo.transport_request_id = $${i}`; params.push(transport_request_id); i++; }

    query += ` ORDER BY vdo.issued_at DESC LIMIT $${i} OFFSET $${i + 1}`;
    params.push(limit, offset);

    const { rows } = await pool.query(query, params);
    return rows;
  }

  static async getById(id) {
    const { rows } = await pool.query(
      `SELECT * FROM vehicle_dispatch_orders WHERE id = $1`,
      [id],
    );
    if (rows.length === 0) return null;
    const order = rows[0];

    // جلب أحداث الرحلة
    const { rows: events } = await pool.query(
      `SELECT * FROM vehicle_trip_events
       WHERE dispatch_order_id = $1
       ORDER BY event_time DESC`,
      [id],
    );
    order.trip_events = events;

    return order;
  }

  static async generateNumber() {
    const year = new Date().getFullYear();
    const pattern = `VDO-${year}-%`;
    const { rows } = await pool.query(
      `SELECT dispatch_order_number FROM vehicle_dispatch_orders
       WHERE dispatch_order_number LIKE $1 ORDER BY dispatch_order_number DESC LIMIT 1`,
      [pattern],
    );
    let next = 1;
    if (rows.length > 0) {
      const parts = rows[0].dispatch_order_number.split('-');
      const n = parseInt(parts[parts.length - 1], 10);
      if (!Number.isNaN(n)) next = n + 1;
    }
    return `VDO-${year}-${String(next).padStart(5, '0')}`;
  }

  static async create(data) {
    let number = data.dispatch_order_number;
    if (!number) number = await VehicleDispatchOrder.generateNumber();

    const { rows } = await pool.query(
      `INSERT INTO vehicle_dispatch_orders (
         dispatch_order_number, transport_request_id, hospital_id,
         ambulance_id, driver_id, nurse_id,
         destination_location, mission_type,
         departure_at, expected_return_at, status,
         issued_by, notes
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        number,
        data.transport_request_id,
        data.hospital_id,
        data.ambulance_id,
        data.driver_id,
        data.nurse_id,
        data.destination_location,
        data.mission_type,
        data.departure_at || null,
        data.expected_return_at || null,
        data.status || 'issued',
        data.issued_by,
        data.notes || null,
      ],
    );
    return rows[0];
  }

  static async updateStatus(id, status) {
    const { rows } = await pool.query(
      `UPDATE vehicle_dispatch_orders SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id],
    );
    return rows[0] || null;
  }

  // ==================== Trip Events ====================
  static async addTripEvent(data) {
    const { rows } = await pool.query(
      `INSERT INTO vehicle_trip_events (
         dispatch_order_id, event_type, event_time, location, recorded_by, notes
       )
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [
        data.dispatch_order_id,
        data.event_type,
        data.event_time || new Date(),
        data.location || null,
        data.recorded_by || null,
        data.notes || null,
      ],
    );
    return rows[0];
  }

  static async delete(id) {
    const { rowCount } = await pool.query(`DELETE FROM vehicle_dispatch_orders WHERE id = $1`, [id]);
    return rowCount > 0;
  }
}

module.exports = VehicleDispatchOrder;