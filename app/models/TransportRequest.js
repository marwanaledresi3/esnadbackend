// models/TransportRequest.js
const {pool} = require('../config/db');

class TransportRequest {
  static async getAll({
    status,
    requester_organization_id,
    receiving_organization_id,
    transport_type,
    priority,
    from_date,
    to_date,
    limit = 100,
    offset = 0,
  } = {}) {
    let query = `
      SELECT
        tr.id,
        tr.request_number,
        tr.requester_organization_id,
        ro.name AS requester_organization_name,
        tr.receiving_organization_id,
        recv.name AS receiving_organization_name,
        tr.requested_at,
        tr.requested_for,
        tr.origin_location,
        tr.destination,
        tr.transport_type,
        tr.priority,
        tr.reason,
        tr.authorization_id,
        tr.status,
        tr.requested_by,
        u.full_name AS requested_by_name,
        tr.approved_by,
        tr.approved_at,
        tr.notes
      FROM transport_requests tr
      LEFT JOIN organizations ro ON ro.id = tr.requester_organization_id
      LEFT JOIN organizations recv ON recv.id = tr.receiving_organization_id
      LEFT JOIN users u ON u.id = tr.requested_by
      WHERE 1=1
    `;
    const params = [];
    let i = 1;

    if (status) {
      query += ` AND tr.status = $${i}`;
      params.push(status);
      i++;
    }
    if (requester_organization_id) {
      query += ` AND tr.requester_organization_id = $${i}`;
      params.push(requester_organization_id);
      i++;
    }
    if (receiving_organization_id) {
      query += ` AND tr.receiving_organization_id = $${i}`;
      params.push(receiving_organization_id);
      i++;
    }
    if (transport_type) {
      query += ` AND tr.transport_type = $${i}`;
      params.push(transport_type);
      i++;
    }
    if (priority) {
      query += ` AND tr.priority = $${i}`;
      params.push(priority);
      i++;
    }
    if (from_date) {
      query += ` AND tr.requested_at >= $${i}`;
      params.push(from_date);
      i++;
    }
    if (to_date) {
      query += ` AND tr.requested_at <= $${i}`;
      params.push(to_date);
      i++;
    }

    query += ` ORDER BY tr.requested_at DESC LIMIT $${i} OFFSET $${i + 1}`;
    params.push(limit, offset);

    const { rows } = await pool.query(query, params);
    return rows;
  }

  static async getById(id) {
    const { rows } = await pool.query(
      `
      SELECT
        tr.*,
        ro.name AS requester_organization_name,
        recv.name AS receiving_organization_name,
        u.full_name AS requested_by_name
      FROM transport_requests tr
      LEFT JOIN organizations ro ON ro.id = tr.requester_organization_id
      LEFT JOIN organizations recv ON recv.id = tr.receiving_organization_id
      LEFT JOIN users u ON u.id = tr.requested_by
      WHERE tr.id = $1
      `,
      [id],
    );
    if (rows.length === 0) return null;

    const request = rows[0];

    // جلب عناصر الطلب
    const { rows: items } = await pool.query(
      `SELECT * FROM transport_request_items WHERE transport_request_id = $1`,
      [id],
    );
    request.items = items;

    return request;
  }

  static async generateNumber() {
    const year = new Date().getFullYear();
    const pattern = `TR-${year}-%`;

    const { rows } = await pool.query(
      `SELECT request_number FROM transport_requests
       WHERE request_number LIKE $1
       ORDER BY request_number DESC LIMIT 1`,
      [pattern],
    );

    let next = 1;
    if (rows.length > 0) {
      const parts = rows[0].request_number.split('-');
      const n = parseInt(parts[parts.length - 1], 10);
      if (!Number.isNaN(n)) next = n + 1;
    }
    return `TR-${year}-${String(next).padStart(5, '0')}`;
  }

  static async create(data) {
    const { rows } = await pool.query(
      `INSERT INTO transport_requests (
         request_number, requester_organization_id, receiving_organization_id,
         requested_for, origin_location, destination, transport_type,
         priority, reason, authorization_id, status, requested_by, notes
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        data.request_number,
        data.requester_organization_id,
        data.receiving_organization_id || null,
        data.requested_for || null,
        data.origin_location || null,
        data.destination || null,
        data.transport_type,
        data.priority || null,
        data.reason || null,
        data.authorization_id || null,
        data.status || 'pending',
        data.requested_by || null,
        data.notes || null,
      ],
    );
    return rows[0];
  }

  static async updateStatus(id, status, approvedBy = null) {
    const { rows } = await pool.query(
      `UPDATE transport_requests
       SET status = $1,
           approved_by = COALESCE($2, approved_by),
           approved_at = CASE WHEN $2::uuid IS NOT NULL THEN now() ELSE approved_at END
       WHERE id = $3
       RETURNING *`,
      [status, approvedBy, id],
    );
    return rows[0] || null;
  }

  static async update(id, data) {
    const allowed = [
      'receiving_organization_id',
      'requested_for',
      'origin_location',
      'destination',
      'transport_type',
      'priority',
      'reason',
      'authorization_id',
      'notes',
    ];
    const updates = [];
    const params = [];
    let i = 1;
    for (const key of allowed) {
      if (data[key] !== undefined) {
        updates.push(`${key} = $${i}`);
        params.push(data[key]);
        i++;
      }
    }
    if (updates.length === 0) return null;
    params.push(id);

    const { rows } = await pool.query(
      `UPDATE transport_requests SET ${updates.join(', ')}
       WHERE id = $${i} RETURNING *`,
      params,
    );
    return rows[0] || null;
  }

  static async addItem({ transport_request_id, case_id, body_case_id, notes }) {
    const { rows } = await pool.query(
      `INSERT INTO transport_request_items
         (transport_request_id, case_id, body_case_id, notes)
       VALUES ($1,$2,$3,$4)
       RETURNING *`,
      [transport_request_id, case_id || null, body_case_id || null, notes || null],
    );
    return rows[0];
  }

  static async deleteItem(itemId) {
    const { rowCount } = await pool.query(
      `DELETE FROM transport_request_items WHERE id = $1`,
      [itemId],
    );
    return rowCount > 0;
  }
}

module.exports = TransportRequest;