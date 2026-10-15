// models/BodyReleaseOrder.js
const {pool} = require('../config/db');

class BodyReleaseOrder {
  static async getAll({
    status, body_case_id, hospital_id,
    from_date, to_date, limit = 100, offset = 0,
  } = {}) {
    let query = `
      SELECT
        bro.*,
        bc.body_number,
        c.case_number,
        p.full_name AS person_name,
        p.person_number AS person_number,
        h.name AS hospital_name,
        a.authorization_number,
        u.full_name AS issued_by_name
      FROM body_release_orders bro
      LEFT JOIN body_cases bc ON bc.id = bro.body_case_id
      LEFT JOIN cases c ON c.id = bc.case_id
      LEFT JOIN persons p ON p.id = c.person_id
      LEFT JOIN organizations h ON h.id = bro.hospital_id
      LEFT JOIN authorizations a ON a.id = bro.authorization_id
      LEFT JOIN users u ON u.id = bro.issued_by
      WHERE 1=1
    `;
    const params = [];
    let i = 1;
    if (status) { query += ` AND bro.status = $${i}`; params.push(status); i++; }
    if (body_case_id) { query += ` AND bro.body_case_id = $${i}`; params.push(body_case_id); i++; }
    if (hospital_id) { query += ` AND bro.hospital_id = $${i}`; params.push(hospital_id); i++; }
    if (from_date) { query += ` AND bro.issued_at >= $${i}`; params.push(from_date); i++; }
    if (to_date) { query += ` AND bro.issued_at <= $${i}`; params.push(to_date); i++; }

    query += ` ORDER BY bro.issued_at DESC LIMIT $${i} OFFSET $${i + 1}`;
    params.push(limit, offset);

    const { rows } = await pool.query(query, params);
    return rows;
  }

  static async getById(id) {
    const { rows } = await pool.query(
      `SELECT * FROM body_release_orders WHERE id = $1`,
      [id],
    );
    return rows[0] || null;
  }

  static async generateOrderNumber() {
    const year = new Date().getFullYear();
    const pattern = `BRO-${year}-%`;
    const { rows } = await pool.query(
      `SELECT order_number FROM body_release_orders
       WHERE order_number LIKE $1 ORDER BY order_number DESC LIMIT 1`,
      [pattern],
    );
    let next = 1;
    if (rows.length > 0) {
      const parts = rows[0].order_number.split('-');
      const n = parseInt(parts[parts.length - 1], 10);
      if (!Number.isNaN(n)) next = n + 1;
    }
    return `BRO-${year}-${String(next).padStart(5, '0')}`;
  }

  static async create(data) {
    let number = data.order_number;
    if (!number) number = await BodyReleaseOrder.generateOrderNumber();

    const { rows } = await pool.query(
      `INSERT INTO body_release_orders (
         order_number, body_case_id, hospital_id,
         recipient_name, recipient_id_number, relationship_to_deceased,
         identity_verified, verification_method, authorization_id,
         status, issued_by, notes
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [
        number,
        data.body_case_id,
        data.hospital_id,
        data.recipient_name,
        data.recipient_id_number,
        data.relationship_to_deceased || null,
        data.identity_verified === true,
        data.verification_method || null,
        data.authorization_id || null,
        data.status || 'issued',
        data.issued_by,
        data.notes || null,
      ],
    );
    return rows[0];
  }

  static async update(id, data) {
    const allowed = ['status', 'executed_at', 'notes', 'identity_verified', 'verification_method'];
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
      `UPDATE body_release_orders SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`,
      params,
    );
    return rows[0] || null;
  }

  static async execute(id) {
    const { rows } = await pool.query(
      `UPDATE body_release_orders
       SET status = 'executed', executed_at = now()
       WHERE id = $1 RETURNING *`,
      [id],
    );
    return rows[0] || null;
  }

  static async delete(id) {
    const { rowCount } = await pool.query(`DELETE FROM body_release_orders WHERE id = $1`, [id]);
    return rowCount > 0;
  }
}

module.exports = BodyReleaseOrder;