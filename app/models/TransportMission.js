// models/TransportMission.js
const { pool } = require('../config/db');

class TransportMission {
  /**
   * إنشاء مهمة جديدة مرتبطة بأمر خروج السيارة
   */
  static async create(data, dbClient = pool) {
    const query = `
      INSERT INTO transport_missions (
        transport_request_id,
        dispatch_order_id,
        ambulance_id,
        driver_id,
        nurse_id,
        status,
        notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const values = [
      data.transport_request_id,
      data.dispatch_order_id || null,
      data.ambulance_id,
      data.driver_id,
      data.nurse_id,
      data.status || 'assigned',
      data.notes || null,
    ];

    const result = await dbClient.query(query, values);
    return result.rows[0];
  }

  /**
   * البحث عن المهمة بواسطة المفتاح الرئيسي ID
   */
  static async findById(id) {
    const query = `
      SELECT 
        tm.*,
        a.plate_number,
        a.vehicle_type,
        u_driver.full_name AS driver_name,
        u_nurse.full_name AS nurse_name,
        vdo.dispatch_order_number
      FROM transport_missions tm
      LEFT JOIN ambulances a ON a.id = tm.ambulance_id
      LEFT JOIN users u_driver ON u_driver.id = tm.driver_id
      LEFT JOIN users u_nurse ON u_nurse.id = tm.nurse_id
      LEFT JOIN vehicle_dispatch_orders vdo ON vdo.id = tm.dispatch_order_id
      WHERE tm.id = $1;
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * جلب قائمة المهام المتاحة حسب طلب النقل أو الجهة
   */
  static async findAll({ requestId, organizationId, status }) {
    let query = `
      SELECT 
        tm.*,
        a.plate_number,
        u_driver.full_name AS driver_name,
        u_nurse.full_name AS nurse_name
      FROM transport_missions tm
      JOIN transport_requests tr ON tr.id = tm.transport_request_id
      LEFT JOIN ambulances a ON a.id = tm.ambulance_id
      LEFT JOIN users u_driver ON u_driver.id = tm.driver_id
      LEFT JOIN users u_nurse ON u_nurse.id = tm.nurse_id
      WHERE (tr.origin_organization_id = $1 OR tr.destination_organization_id = $1)
    `;
    const params = [organizationId];
    let paramIndex = 2;

    if (requestId) {
      query += ` AND tm.transport_request_id = $${paramIndex}`;
      params.push(requestId);
      paramIndex++;
    }

    if (status) {
      query += ` AND tm.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY tm.created_at DESC;`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * تحديث حالة المهمة
   */
  static async updateStatus(id, status, dbClient = pool) {
    const query = `
      UPDATE transport_missions
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *;
    `;
    const result = await dbClient.query(query, [status, id]);
    return result.rows[0];
  }
}

module.exports = TransportMission;