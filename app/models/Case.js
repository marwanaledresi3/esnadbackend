const { pool } = require('../config/db');

class Case {
  // إنشاء حالة جديدة
  static async create({ case_number, person_id, current_status = 'OPEN', created_by_facility_id }, client = pool) {
    const query = `
      INSERT INTO cases (case_number, person_id, current_status, created_by_facility_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const res = await client.query(query, [case_number, person_id, current_status, created_by_facility_id]);
    return res.rows[0];
  }

  // إضافة حدث إلى الـ Timeline الموحد
  static async addEvent({ case_id, event_type, description, facility_id, actor_user_id, event_metadata }, client = pool) {
    const query = `
      INSERT INTO case_events (case_id, event_type, description, facility_id, actor_user_id, event_metadata)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [case_id, event_type, description, facility_id, actor_user_id, JSON.stringify(event_metadata || {})];
    const res = await client.query(query, values);
    return res.rows[0];
  }

  // جالب ملف الحالة المكتمل مع الـ Timeline
  static async findByIdWithTimeline(caseId) {
    const caseQuery = `
      SELECT c.*, p.person_number, p.identity_status, p.full_name, p.national_id, p.gender, p.photo_url,
             o.org_name AS facility_name
      FROM cases c
      JOIN persons p ON c.person_id = p.person_id
      LEFT JOIN organizations o ON c.created_by_facility_id = o.organization_id
      WHERE c.case_id = $1
    `;

    const eventsQuery = `
      SELECT e.*, u.full_name AS actor_name, o.org_name AS facility_name
      FROM case_events e
      LEFT JOIN users u ON e.actor_user_id = u.user_id
      LEFT JOIN organizations o ON e.facility_id = o.organization_id
      WHERE e.case_id = $1
      ORDER BY e.created_at ASC
    `;

    const caseRes = await pool.query(caseQuery, [caseId]);
    if (caseRes.rows.length === 0) return null;

    const eventsRes = await pool.query(eventsQuery, [caseId]);

    return {
      ...caseRes.rows[0],
      timeline: eventsRes.rows
    };
  }
}

module.exports = Case;