// models/BodyHandover.js
const {pool} = require('../config/db');

class BodyHandover {
  static async getAll({ body_case_id, authorization_id, from_date, to_date, limit = 100, offset = 0 } = {}) {
    let query = `
      SELECT
        bh.*,
        bc.body_number,
        c.case_number,
        p.full_name AS person_name,
        a.authorization_number,
        hou.full_name AS handed_over_by_name,
        ru.full_name AS received_by_name,
        d.title AS receipt_document_title
      FROM body_handovers bh
      LEFT JOIN body_cases bc ON bc.id = bh.body_case_id
      LEFT JOIN cases c ON c.id = bc.case_id
      LEFT JOIN persons p ON p.id = c.person_id
      LEFT JOIN authorizations a ON a.id = bh.authorization_id
      LEFT JOIN users hou ON hou.id = bh.handed_over_by
      LEFT JOIN users ru ON ru.id = bh.received_by
      LEFT JOIN documents d ON d.id = bh.receipt_document_id
      WHERE 1=1
    `;
    const params = [];
    let i = 1;
    if (body_case_id) { query += ` AND bh.body_case_id = $${i}`; params.push(body_case_id); i++; }
    if (authorization_id) { query += ` AND bh.authorization_id = $${i}`; params.push(authorization_id); i++; }
    if (from_date) { query += ` AND bh.handover_datetime >= $${i}`; params.push(from_date); i++; }
    if (to_date) { query += ` AND bh.handover_datetime <= $${i}`; params.push(to_date); i++; }

    query += ` ORDER BY bh.handover_datetime DESC LIMIT $${i} OFFSET $${i + 1}`;
    params.push(limit, offset);

    const { rows } = await pool.query(query, params);
    return rows;
  }

  static async getById(id) {
    const { rows } = await pool.query(
      `SELECT * FROM body_handovers WHERE id = $1`,
      [id],
    );
    return rows[0] || null;
  }

  static async create(data) {
    const { rows } = await pool.query(
      `INSERT INTO body_handovers (
         body_case_id, authorization_id,
         recipient_name, recipient_id_number, destination,
         handover_datetime, handed_over_by, received_by,
         receipt_document_id, notes, release_order_id
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        data.body_case_id,
        data.authorization_id,
        data.recipient_name,
        data.recipient_id_number || null,
        data.destination || null,
        data.handover_datetime || new Date(),
        data.handed_over_by || null,
        data.received_by || null,
        data.receipt_document_id || null,
        data.notes || null,
        data.release_order_id || null,
      ],
    );
    return rows[0];
  }

  static async delete(id) {
    const { rowCount } = await pool.query(`DELETE FROM body_handovers WHERE id = $1`, [id]);
    return rowCount > 0;
  }
}

module.exports = BodyHandover;