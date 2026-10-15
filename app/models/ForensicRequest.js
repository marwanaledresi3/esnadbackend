// models/ForensicRequest.js
const {pool} = require('../config/db');

class ForensicRequest {
  static async getAll({
    status,
    body_case_id,
    requested_by,
    hospital_id,
    from_date,
    to_date,
    limit = 100,
    offset = 0,
  } = {}) {
    let query = `
      SELECT
        fr.id,
        fr.body_case_id,
        bc.body_number,
        c.case_number,
        p.full_name AS person_name,
        p.person_number AS person_number,
        fr.request_number,
        fr.reason,
        fr.requested_at,
        fr.requested_by,
        u.full_name AS requested_by_name,
        fr.authorization_id,
        a.authorization_number,
        fr.status,
        fr.completed_at,
        fr.report_document_id,
        fr.notes,
        fr.hospital_id,
        h.name AS hospital_name,
        fr.issued_at
      FROM forensic_requests fr
      LEFT JOIN body_cases bc ON bc.id = fr.body_case_id
      LEFT JOIN cases c ON c.id = bc.case_id
      LEFT JOIN persons p ON p.id = c.person_id
      LEFT JOIN users u ON u.id = fr.requested_by
      LEFT JOIN authorizations a ON a.id = fr.authorization_id
      LEFT JOIN organizations h ON h.id = fr.hospital_id
      WHERE 1=1
    `;
    const params = [];
    let i = 1;

    if (status) {
      query += ` AND fr.status = $${i}`;
      params.push(status);
      i++;
    }
    if (body_case_id) {
      query += ` AND fr.body_case_id = $${i}`;
      params.push(body_case_id);
      i++;
    }
    if (requested_by) {
      query += ` AND fr.requested_by = $${i}`;
      params.push(requested_by);
      i++;
    }
    if (hospital_id) {
      query += ` AND fr.hospital_id = $${i}`;
      params.push(hospital_id);
      i++;
    }
    if (from_date) {
      query += ` AND fr.requested_at >= $${i}`;
      params.push(from_date);
      i++;
    }
    if (to_date) {
      query += ` AND fr.requested_at <= $${i}`;
      params.push(to_date);
      i++;
    }

    query += ` ORDER BY fr.requested_at DESC LIMIT $${i} OFFSET $${i + 1}`;
    params.push(limit, offset);

    const { rows } = await pool.query(query, params);
    return rows;
  }

  static async getById(id) {
    const { rows } = await pool.query(
      `
      SELECT
        fr.*,
        bc.body_number,
        c.case_number,
        p.full_name AS person_name,
        u.full_name AS requested_by_name,
        a.authorization_number,
        h.name AS hospital_name
      FROM forensic_requests fr
      LEFT JOIN body_cases bc ON bc.id = fr.body_case_id
      LEFT JOIN cases c ON c.id = bc.case_id
      LEFT JOIN persons p ON p.id = c.person_id
      LEFT JOIN users u ON u.id = fr.requested_by
      LEFT JOIN authorizations a ON a.id = fr.authorization_id
      LEFT JOIN organizations h ON h.id = fr.hospital_id
      WHERE fr.id = $1
      `,
      [id],
    );
    if (rows.length === 0) return null;

    const request = rows[0];

    // جلب الفحوصات المرتبطة
    const { rows: exams } = await pool.query(
      `SELECT * FROM forensic_examinations WHERE forensic_request_id = $1
       ORDER BY started_at DESC`,
      [id],
    );
    request.examinations = exams;

    return request;
  }

  static async getByBodyCaseId(bodyCaseId) {
    const { rows } = await pool.query(
      `SELECT * FROM forensic_requests WHERE body_case_id = $1
       ORDER BY requested_at DESC`,
      [bodyCaseId],
    );
    return rows;
  }

  static async generateRequestNumber() {
    const year = new Date().getFullYear();
    const pattern = `FR-${year}-%`;

    const { rows } = await pool.query(
      `SELECT request_number FROM forensic_requests
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
    return `FR-${year}-${String(next).padStart(5, '0')}`;
  }

  static async create(data) {
    let number = data.request_number;
    if (!number) {
      number = await ForensicRequest.generateRequestNumber();
    }

    const { rows } = await pool.query(
      `INSERT INTO forensic_requests (
         body_case_id, request_number, reason, requested_by,
         authorization_id, status, notes, hospital_id
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [
        data.body_case_id,
        number,
        data.reason || null,
        data.requested_by || null,
        data.authorization_id || null,
        data.status || 'awaiting_authorization',
        data.notes || null,
        data.hospital_id || null,
      ],
    );
    return rows[0];
  }

  static async update(id, data) {
    const allowed = [
      'reason',
      'authorization_id',
      'status',
      'completed_at',
      'report_document_id',
      'notes',
      'hospital_id',
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
      `UPDATE forensic_requests SET ${updates.join(', ')}
       WHERE id = $${i} RETURNING *`,
      params,
    );
    return rows[0] || null;
  }

  static async changeStatus(id, status) {
    const { rows } = await pool.query(
      `UPDATE forensic_requests SET status = $1,
         completed_at = CASE WHEN $1 = 'completed' THEN now() ELSE completed_at END
       WHERE id = $2 RETURNING *`,
      [status, id],
    );
    return rows[0] || null;
  }

  static async delete(id) {
    const { rowCount } = await pool.query(
      `DELETE FROM forensic_requests WHERE id = $1`,
      [id],
    );
    return rowCount > 0;
  }

  static async count() {
    const { rows } = await pool.query(`SELECT COUNT(*)::int AS total FROM forensic_requests`);
    return rows[0]?.total ?? 0;
  }

  // ==================== Examinations ====================
  static async addExamination({
    forensic_request_id,
    started_at,
    completed_at,
    examiner,
    result_status,
    report_document_id,
    notes,
  }) {
    const { rows } = await pool.query(
      `INSERT INTO forensic_examinations (
         forensic_request_id, started_at, completed_at,
         examiner, result_status, report_document_id, notes
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [
        forensic_request_id,
        started_at || null,
        completed_at || null,
        examiner || null,
        result_status || null,
        report_document_id || null,
        notes || null,
      ],
    );
    return rows[0];
  }

  static async updateExamination(id, data) {
    const allowed = [
      'started_at',
      'completed_at',
      'examiner',
      'result_status',
      'report_document_id',
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
      `UPDATE forensic_examinations SET ${updates.join(', ')}
       WHERE id = $${i} RETURNING *`,
      params,
    );
    return rows[0] || null;
  }

  static async deleteExamination(id) {
    const { rowCount } = await pool.query(
      `DELETE FROM forensic_examinations WHERE id = $1`,
      [id],
    );
    return rowCount > 0;
  }
}

module.exports = ForensicRequest;