// models/BodyRelease.js
const { pool } = require('../config/db');

class BodyRelease {
  /**
   * 1. إصدار أمر/تصريح تسليم جثمان جديد (من المحور)
   */
  static async createReleaseOrder(data, dbClient = pool) {
    const query = `
      INSERT INTO body_release_orders (
        order_number,
        body_case_id,
        hospital_id,
        recipient_name,
        recipient_id_number,
        relationship_to_deceased,
        authorization_id,
        status,
        issued_by,
        notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `;
    const values = [
      data.order_number,
      data.body_case_id,
      data.hospital_id,
      data.recipient_name,
      data.recipient_id_number,
      data.relationship_to_deceased || null,
      data.authorization_id || null,
      data.status || 'issued',
      data.issued_by,
      data.notes || null,
    ];

    const result = await dbClient.query(query, values);
    return result.rows[0];
  }

  /**
   * 2. تسجيل الفحص والتسليم المباشر للجثمان (في المستشفى)
   */
  static async createHandover(data, dbClient = pool) {
    const query = `
      INSERT INTO body_handovers (
        body_case_id,
        release_order_id,
        recipient_name,
        recipient_id_number,
        relationship,
        handed_over_by,
        handover_datetime,
        notes
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7)
      RETURNING *;
    `;
    const values = [
      data.body_case_id,
      data.release_order_id,
      data.recipient_name,
      data.recipient_id_number,
      data.relationship || null,
      data.handed_over_by,
      data.notes || null,
    ];

    const result = await dbClient.query(query, values);
    return result.rows[0];
  }

  /**
   * 3. إنشاء طلب فحص شرعي من المحور
   */
  static async createForensicRequest(data, dbClient = pool) {
    const query = `
      INSERT INTO forensic_requests (
        body_case_id,
        hospital_id,
        requested_by,
        reason,
        status,
        notes
      ) VALUES ($1, $2, $3, $4, 'pending', $5)
      RETURNING *;
    `;
    const values = [
      data.body_case_id,
      data.hospital_id,
      data.requested_by,
      data.reason,
      data.notes || null,
    ];

    const result = await dbClient.query(query, values);
    return result.rows[0];
  }

  /**
   * البحث عن أمر التسليم برقمه الفريد
   */
  static async findReleaseOrderById(id) {
    const query = `
      SELECT 
        bro.*,
        bc.body_number,
        o.name AS hospital_name
      FROM body_release_orders bro
      JOIN body_cases bc ON bc.id = bro.body_case_id
      LEFT JOIN organizations o ON o.id = bro.hospital_id
      WHERE bro.id = $1;
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }
}

module.exports = BodyRelease;