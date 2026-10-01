const { pool } = require('../config/db');

class Ambulance {
  // عرض السيارات المتاحة للخدمة
  static async findAvailable() {
    const query = `
      SELECT * FROM ambulances 
      WHERE status = 'AVAILABLE' AND is_active = true
      ORDER BY vehicle_number ASC
    `;
    const res = await pool.query(query);
    return res.rows;
  }

  // تحديث حالة سيارة الإسعاف (AVAILABLE, DISPATCHED, ON_SCENE, RETURNING, MAINTENANCE)
  static async updateStatus(ambulanceId, status, client = pool) {
    const query = `
      UPDATE ambulances 
      SET status = $1, updated_at = NOW()
      WHERE ambulance_id = $2
      RETURNING *
    `;
    const res = await client.query(query, [status, ambulanceId]);
    return res.rows[0];
  }

  // إنشاء مهمة توجيه إسعاف (Dispatch Mission)
  static async createDispatch({ incident_id, ambulance_id, paramedic_user_id, driver_name, notes }, client = pool) {
    const query = `
      INSERT INTO ambulance_dispatches (incident_id, ambulance_id, paramedic_user_id, driver_name, notes, dispatch_status)
      VALUES ($1, $2, $3, $4, $5, 'ASSIGNED')
      RETURNING *
    `;
    const values = [incident_id, ambulance_id, paramedic_user_id || null, driver_name || null, notes || null];
    const res = await client.query(query, values);
    return res.rows[0];
  }

  // تحديث مسار مهمة الإسعاف (ASSIGNED, EN_ROUTE, ON_SCENE, TRANSPORTING, COMPLETED)
  static async updateDispatchStatus(dispatchId, dispatch_status, client = pool) {
    const query = `
      UPDATE ambulance_dispatches
      SET dispatch_status = $1, updated_at = NOW()
      WHERE dispatch_id = $2
      RETURNING *
    `;
    const res = await client.query(query, [dispatch_status, dispatchId]);
    return res.rows[0];
  }
}

module.exports = Ambulance;