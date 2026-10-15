// models/CaseEventModel.js
const { pool } = require('../config/db');
// models/CaseEvent.js

class CaseEvent {
  static async getByCaseId(caseId) {
    const { rows } = await pool.query(
      `
      SELECT
        ce.*,
        cet.code AS event_type_code,
        cet.name AS event_type_name,
        o.name AS organization_name,
        u.full_name AS actor_user_name
      FROM case_events ce
      LEFT JOIN case_event_types cet ON cet.id = ce.event_type_id
      LEFT JOIN organizations o ON o.id = ce.organization_id
      LEFT JOIN users u ON u.id = ce.actor_user_id
      WHERE ce.case_id = $1
      ORDER BY ce.event_datetime DESC
      `,
      [caseId],
    );
    return rows;
  }

  static async getById(id) {
    const { rows } = await pool.query(`SELECT * FROM case_events WHERE id = $1`, [id]);
    return rows[0] || null;
  }

  static async create(data) {
    const { rows } = await pool.query(
      `INSERT INTO case_events (
         case_id, event_type_id, event_datetime, organization_id,
         actor_user_id, status, description, notes, created_by
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        data.case_id,
        data.event_type_id,
        data.event_datetime || new Date(),
        data.organization_id,
        data.actor_user_id || null,
        data.status || 'confirmed',
        data.description || null,
        data.notes || null,
        data.created_by || null,
      ],
    );
    return rows[0];
  }

  static async delete(id) {
    const { rowCount } = await pool.query(`DELETE FROM case_events WHERE id = $1`, [id]);
    return rowCount > 0;
  }
}

module.exports = CaseEvent;