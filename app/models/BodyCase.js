const { pool } = require('../config/db');

class BodyCase {
  // تسجيل إدخال جثمان لثلاجة حفظ الموتى
  static async create({ case_id, fridge_number, slot_number, condition_notes, received_by_user_id }, client = pool) {
    const query = `
      INSERT INTO body_cases (case_id, fridge_number, slot_number, condition_notes, received_by_user_id, status)
      VALUES ($1, $2, $3, $4, $5, 'IN_MORTUARY')
      RETURNING *
    `;
    const values = [case_id, fridge_number, slot_number, condition_notes || null, received_by_user_id];
    const res = await client.query(query, values);
    return res.rows[0];
  }

  // البحث عن جثمان بواسطة ID الحالة
  static async findByCaseId(caseId) {
    const query = `
      SELECT b.*, c.case_number, p.full_name, p.identity_status, p.person_number
      FROM body_cases b
      JOIN cases c ON b.case_id = c.case_id
      JOIN persons p ON c.person_id = p.person_id
      WHERE b.case_id = $1
    `;
    const res = await pool.query(query, [caseId]);
    return res.rows[0] || null;
  }

  // تحديث حالة الجثمان في الثلاجة (تسليم / نقل)
  static async updateStatus(bodyCaseId, status, client = pool) {
    const query = `
      UPDATE body_cases
      SET status = $1, updated_at = NOW()
      WHERE body_case_id = $2
      RETURNING *
    `;
    const res = await client.query(query, [status, bodyCaseId]);
    return res.rows[0];
  }
}

module.exports = BodyCase;