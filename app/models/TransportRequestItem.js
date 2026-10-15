const {pool} = require('../config/db');

class TransportRequestItem {
    static async create(data, client = pool) {
        const { transport_request_id, case_id, body_case_id, notes, created_by } = data;
        const query = `
            INSERT INTO transport_request_items 
                (transport_request_id, case_id, body_case_id, notes, created_by)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;
        const values = [transport_request_id, case_id || null, body_case_id || null, notes, created_by];
        const res = await client.query(query, values);
        return res.rows[0];
    }

    static async findById(id) {
        const query = `
            SELECT tri.*, tr.status as request_status, tr.organization_id
            FROM transport_request_items tri
            JOIN transport_requests tr ON tri.transport_request_id = tr.id
            WHERE tri.id = $1
        `;
        const res = await pool.query(query, [id]);
        return res.rows[0];
    }

    static async findByRequestId(requestId) {
        const query = `
            SELECT tri.*, 
                   c.case_number, c.patient_name,
                   bc.body_code, bc.deceased_name
            FROM transport_request_items tri
            LEFT JOIN cases c ON tri.case_id = c.id
            LEFT JOIN body_cases bc ON tri.body_case_id = bc.id
            WHERE tri.transport_request_id = $1
            ORDER BY tri.created_at ASC
        `;
        const res = await pool.query(query, [requestId]);
        return res.rows;
    }

    static async delete(id, client = pool) {
        const res = await client.query('DELETE FROM transport_request_items WHERE id = $1 RETURNING *;', [id]);
        return res.rows[0];
    }
    /**
   * تحديث حالة طلب النقل (قبول أو رفض)
   */
  static async updateStatus(requestId, { status, rejectionReason, userId }, dbClient = pool) {
    const query = `
      UPDATE transport_requests
      SET 
        status = $1,
        rejection_reason = $2,
        updated_at = NOW()
      WHERE id = $3
      RETURNING *;
    `;
    const values = [
      status,
      rejectionReason || null,
      requestId
    ];

    const result = await dbClient.query(query, values);
    return result.rows[0] || null;
  }

 
}

module.exports = TransportRequestItem;