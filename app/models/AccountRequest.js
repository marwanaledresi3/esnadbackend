const { pool } = require('../config/db');

class AccountRequest {
  // جلب الطلب مع القفل للمعالجة الذرية داخل Transaction
  static async findByIdForUpdate( id) {
    const query = `
      SELECT * FROM account_requests 
      WHERE id = $1 
      FOR UPDATE
    `;
    const res = await pool.query(query, [id]);
    return res.rows[0] || null;
  }

  // تحديث حالة الطلب (APPROVED / REJECTED)
  static async updateStatus(id, status, reviewedByUserId, rejectionReason = null, client) {
    if (!client) {
    throw new Error(
      'Database client is required for audit logging'
    );
  }

    const query = `
      UPDATE account_requests 
      SET status = $1, 
          reviewed_by = $2, 
          reviewed_at = NOW(),
          rejection_reason = $3
      WHERE id = $4
      RETURNING *
    `;
    const res = await client.query(query, [status, reviewedByUserId, rejectionReason, id]);
    return res.rows[0];
  }

  // إنشاء طلب حساب جديد
  static async create(data, client) {
    if (!client) {
    throw new Error(
      'Database client is required for audit logging'
    );
  }

    const { fullName, phoneNumber, username, passwordHash, email, jobTitle, organizationId, provinceId, requestReason } = data;
    const query = `
      INSERT INTO account_requests (
        full_name, requested_username, password_hash, phone, email,  job_title, 
        organization_id, province_id, reason, status, submitted_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', NOW())
      RETURNING *
    `;
    const res = await client.query(query, [
      fullName, username, passwordHash, phoneNumber, email, jobTitle, organizationId, provinceId, requestReason
    ]);
    return res.rows[0];
  }

  // استعلام الطلبات الخاصة بجهة معينة
  static async findByOrganization(organizationId, limit = 20, offset = 0) {
    const query = `
      SELECT * FROM account_requests 
      WHERE organization_id = $1 
      ORDER BY submitted_at DESC 
      LIMIT $2 OFFSET $3
    `;
    const res = await pool.query(query, [organizationId, limit, offset]);
    return res.rows;
  }
  static async getRequestsList({  organizationId, status }) {
    let  query = `
      SELECT 
        ar.id,
        ar.province_id,
        ar.organization_id,
        ar.full_name,
        ar.phone,
        ar.requested_username AS username,
        ar.job_title,
        ar.reason,
        ar.status,
        ar.submitted_at,
        ar.reviewed_at,
        ar.rejection_reason,
        o.name AS organization_name,
        p.name AS province_name
      FROM account_requests ar
      JOIN organizations o ON o.id = ar.organization_id
      JOIN provinces p ON p.id = ar.province_id
      WHERE 1=1
      
    `;

     const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND ar.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    if (organizationId) {
      query += ` AND ar.organization_id = $${paramIndex}`;
      params.push(organizationId);
      paramIndex++;
    }
    query += ` ORDER BY ar.submitted_at DESC`;


    const result = await pool.query(query, [...params]);
    return result.rows;
  }
}

module.exports = AccountRequest;