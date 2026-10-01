const { pool } = require('../config/db');

class Incident {
  // تسجيل بلاغ جديد
  static async create({ incident_number, caller_name, caller_phone, location_name, latitude, longitude, description, severity_level, reported_by_user_id }, client = pool) {
    const query = `
      INSERT INTO incidents (
        incident_number, caller_name, caller_phone, location_name, 
        latitude, longitude, description, severity_level, reported_by_user_id, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'OPEN')
      RETURNING *
    `;
    const values = [
      incident_number, caller_name || null, caller_phone || null, location_name,
      latitude || null, longitude || null, description || null, severity_level || 'NORMAL', reported_by_user_id
    ];
    const res = await client.query(query, values);
    return res.rows[0];
  }

  // البحث عن بلاغ بـ ID
  static async findById(incidentId) {
    const query = `
      SELECT i.*, u.full_name AS reporter_name
      FROM incidents i
      LEFT JOIN users u ON i.reported_by_user_id = u.user_id
      WHERE i.incident_id = $1
    `;
    const res = await pool.query(query, [incidentId]);
    return res.rows[0] || null;
  }

  // تحديث حالة البلاغ (DISPATCHED, IN_PROGRESS, RESOLVED, CANCELLED)
  static async updateStatus(incidentId, status, client = pool) {
    const query = `
      UPDATE incidents
      SET status = $1, updated_at = NOW()
      WHERE incident_id = $2
      RETURNING *
    `;
    const res = await client.query(query, [status, incidentId]);
    return res.rows[0];
  }

  // عرض قائمة البلاغات مع الفلترة
  static async findAll({ status, severity_level, limit = 20, offset = 0 }) {
    let query = `SELECT * FROM incidents WHERE 1=1`;
    const values = [];

    if (status) {
      values.push(status);
      query += ` AND status = $${values.length}`;
    }

    if (severity_level) {
      values.push(severity_level);
      query += ` AND severity_level = $${values.length}`;
    }

    values.push(limit, offset);
    query += ` ORDER BY created_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`;

    const res = await pool.query(query, values);
    return res.rows;
  }
}

module.exports = Incident;