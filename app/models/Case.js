// models/Case.js
const {pool} = require('../config/db');

class Case {
  /**
   * جلب الحالات مع فلاتر
   */
  static async getAll({
    search,
    case_type,
    case_status,
    person_id,
    organization_id,
    source_organization_id,
    priority,
    from_date,
    to_date,
    limit = 100,
    offset = 0,
  } = {}) {
    let query = `
      SELECT
        c.id,
        c.case_number,
        c.person_id,
        p.full_name AS person_name,
        p.person_number AS person_number,
        c.case_type,
        c.case_status,
        c.arrival_datetime,
        c.source_organization_id,
        so.name AS source_organization_name,
        c.source_location,
        c.referral_number,
        c.referral_datetime,
        c.priority,
        c.department_id,
        c.current_location,
        c.notes,
        c.organization_id,
        o.name AS organization_name,
        c.opened_at,
        c.closed_at,
        c.opened_by,
        u.full_name AS opened_by_name,
        c.updated_at
      FROM cases c
      LEFT JOIN persons p ON p.id = c.person_id
      LEFT JOIN organizations so ON so.id = c.source_organization_id
      LEFT JOIN organizations o ON o.id = c.organization_id
      LEFT JOIN users u ON u.id = c.opened_by
      WHERE 1=1
    `;
    const params = [];
    let i = 1;

    if (search) {
      query += ` AND (
        c.case_number ILIKE $${i}
        OR c.referral_number ILIKE $${i}
        OR p.full_name ILIKE $${i}
        OR p.person_number ILIKE $${i}
      )`;
      params.push(`%${search}%`);
      i++;
    }

    if (case_type) {
      query += ` AND c.case_type = $${i}`;
      params.push(case_type);
      i++;
    }

    if (case_status) {
      query += ` AND c.case_status = $${i}`;
      params.push(case_status);
      i++;
    }

    if (person_id) {
      query += ` AND c.person_id = $${i}`;
      params.push(person_id);
      i++;
    }

    if (organization_id) {
      query += ` AND c.organization_id = $${i}`;
      params.push(organization_id);
      i++;
    }

    if (source_organization_id) {
      query += ` AND c.source_organization_id = $${i}`;
      params.push(source_organization_id);
      i++;
    }

    if (priority) {
      query += ` AND c.priority = $${i}`;
      params.push(priority);
      i++;
    }

    if (from_date) {
      query += ` AND c.opened_at >= $${i}`;
      params.push(from_date);
      i++;
    }

    if (to_date) {
      query += ` AND c.opened_at <= $${i}`;
      params.push(to_date);
      i++;
    }

    query += ` ORDER BY c.opened_at DESC LIMIT $${i} OFFSET $${i + 1}`;
    params.push(limit, offset);

    const { rows } = await pool.query(query, params);
    return rows;
  }

  static async getById(id) {
    const { rows } = await pool.query(
      `
      SELECT
        c.*,
        p.full_name AS person_name,
        p.person_number AS person_number,
        so.name AS source_organization_name,
        o.name AS organization_name,
        u.full_name AS opened_by_name
      FROM cases c
      LEFT JOIN persons p ON p.id = c.person_id
      LEFT JOIN organizations so ON so.id = c.source_organization_id
      LEFT JOIN organizations o ON o.id = c.organization_id
      LEFT JOIN users u ON u.id = c.opened_by
      WHERE c.id = $1
      `,
      [id],
    );
    return rows[0] || null;
  }

  /**
   * توليد رقم حالة فريد: CASE-2026-00001
   */
  static async generateCaseNumber() {
    const year = new Date().getFullYear();
    const pattern = `CASE-${year}-%`;

    const { rows } = await pool.query(
      `SELECT case_number FROM cases
       WHERE case_number LIKE $1
       ORDER BY case_number DESC
       LIMIT 1`,
      [pattern],
    );

    let next = 1;
    if (rows.length > 0) {
      const parts = rows[0].case_number.split('-');
      const n = parseInt(parts[parts.length - 1], 10);
      if (!Number.isNaN(n)) next = n + 1;
    }

    return `CASE-${year}-${String(next).padStart(5, '0')}`;
  }

  static async create({
    case_number,
    person_id,
    case_type,
    case_status = 'new',
    arrival_datetime,
    source_organization_id,
    source_location,
    referral_number,
    referral_datetime,
    priority,
    department_id,
    current_location,
    notes,
    organization_id,
    opened_by,
  }) {
    let number = case_number;
    if (!number) {
      number = await Case.generateCaseNumber();
    }

    const { rows } = await pool.query(
      `INSERT INTO cases (
         case_number, person_id, case_type, case_status,
         arrival_datetime, source_organization_id, source_location,
         referral_number, referral_datetime, priority,
         department_id, current_location, notes,
         organization_id, opened_by
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [
        number,
        person_id || null,
        case_type,
        case_status,
        arrival_datetime || null,
        source_organization_id || null,
        source_location || null,
        referral_number || null,
        referral_datetime || null,
        priority || null,
        department_id || null,
        current_location || null,
        notes || null,
        organization_id,
        opened_by || null,
      ],
    );
    return rows[0];
  }

  static async update(id, data) {
    const allowed = [
      'person_id',
      'case_type',
      'case_status',
      'arrival_datetime',
      'source_organization_id',
      'source_location',
      'referral_number',
      'referral_datetime',
      'priority',
      'department_id',
      'current_location',
      'notes',
      'organization_id',
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

    updates.push(`updated_at = now()`);
    params.push(id);

    const { rows } = await pool.query(
      `UPDATE cases SET ${updates.join(', ')}
       WHERE id = $${i}
       RETURNING *`,
      params,
    );
    return rows[0] || null;
  }

  /**
   * إغلاق الحالة
   */
  static async close(id) {
    const { rows } = await pool.query(
      `UPDATE cases
       SET case_status = 'closed',
           closed_at = now(),
           updated_at = now()
       WHERE id = $1
       RETURNING *`,
      [id],
    );
    return rows[0] || null;
  }

  /**
   * تغيير الحالة (status)
   */
  static async changeStatus(id, status) {
    const { rows } = await pool.query(
      `UPDATE cases
       SET case_status = $1,
           updated_at = now(),
           closed_at = CASE WHEN $1 = 'closed' THEN now() ELSE closed_at END
       WHERE id = $2
       RETURNING *`,
      [status, id],
    );
    return rows[0] || null;
  }

  static async delete(id) {
    const { rowCount } = await pool.query(
      `DELETE FROM cases WHERE id = $1`,
      [id],
    );
    return rowCount > 0;
  }

  static async count() {
    const { rows } = await pool.query(`SELECT COUNT(*)::int AS total FROM cases`);
    return rows[0]?.total ?? 0;
  }
}

module.exports = Case;