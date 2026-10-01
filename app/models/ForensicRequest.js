const { pool } = require('../config/db');

class ForensicRequest {
  // إنشاء طلب فحص شرعي جديد لحالة
  static async create({ case_id, requesting_authority, request_type, notes, requested_by_user_id }, client = pool) {
    const query = `
      INSERT INTO forensic_requests (
        case_id, requesting_authority, request_type, notes, requested_by_user_id, status
      )
      VALUES ($1, $2, $3, $4, $5, 'PENDING')
      RETURNING *
    `;
    const values = [case_id, requesting_authority, request_type, notes || null, requested_by_user_id];
    const res = await client.query(query, values);
    return res.rows[0];
  }

  // البحث عن طلب فحص بواسطة ID الحالة
  static async findByCaseId(caseId) {
    const query = `
      SELECT fr.*, c.case_number, u.full_name AS requester_name
      FROM forensic_requests fr
      JOIN cases c ON fr.case_id = c.case_id
      LEFT JOIN users u ON fr.requested_by_user_id = u.user_id
      WHERE fr.case_id = $1
      ORDER BY fr.created_at DESC
    `;
    const res = await pool.query(query, [caseId]);
    return res.rows;
  }

  // تسجيل/تحديث التقرير الشرعي والنتائج
  static async submitReport({ forensic_request_id, cause_of_death, external_examination, internal_examination, toxicological_notes, examiner_user_id, report_attachment_url }, client = pool) {
    const query = `
      UPDATE forensic_requests
      SET cause_of_death = $1,
          external_examination = $2,
          internal_examination = $3,
          toxicological_notes = $4,
          examiner_user_id = $5,
          report_attachment_url = $6,
          status = 'COMPLETED',
          completed_at = NOW(),
          updated_at = NOW()
      WHERE forensic_request_id = $7
      RETURNING *
    `;
    const values = [
      cause_of_death,
      external_examination || null,
      internal_examination || null,
      toxicological_notes || null,
      examiner_user_id,
      report_attachment_url || null,
      forensic_request_id
    ];
    const res = await client.query(query, values);
    return res.rows[0];
  }
}

module.ForensicRequest = ForensicRequest;
module.exports = ForensicRequest;