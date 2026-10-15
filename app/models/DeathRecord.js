// models/DeathRecord.js
const {pool} = require('../config/db');

class DeathRecord {
  static async getAll({
    case_id,
    hospital_id,
    cause_status,
    from_date,
    to_date,
    search,
    limit = 100,
    offset = 0,
  } = {}) {
    let query = `
      SELECT
        dr.id,
        dr.case_id,
        c.case_number,
        c.case_type,
        p.full_name AS person_name,
        p.person_number,
        dr.event_id,
        dr.death_datetime,
        dr.death_location,
        dr.death_context,
        dr.cause_status,
        dr.notes,
        dr.hospital_id,
        h.name AS hospital_name,
        dr.death_type,
        dr.reported_by,
        u.full_name AS reported_by_name,
        dr.reported_at
      FROM death_records dr
      LEFT JOIN cases c ON c.id = dr.case_id
      LEFT JOIN persons p ON p.id = c.person_id
      LEFT JOIN organizations h ON h.id = dr.hospital_id
      LEFT JOIN users u ON u.id = dr.reported_by
      WHERE 1=1
    `;
    const params = [];
    let i = 1;

    if (case_id) {
      query += ` AND dr.case_id = $${i}`;
      params.push(case_id);
      i++;
    }
    if (hospital_id) {
      query += ` AND dr.hospital_id = $${i}`;
      params.push(hospital_id);
      i++;
    }
    if (cause_status) {
      query += ` AND dr.cause_status = $${i}`;
      params.push(cause_status);
      i++;
    }
    if (from_date) {
      query += ` AND dr.death_datetime >= $${i}`;
      params.push(from_date);
      i++;
    }
    if (to_date) {
      query += ` AND dr.death_datetime <= $${i}`;
      params.push(to_date);
      i++;
    }
    if (search) {
      query += ` AND (c.case_number ILIKE $${i} OR p.full_name ILIKE $${i})`;
      params.push(`%${search}%`);
      i++;
    }

    query += ` ORDER BY dr.death_datetime DESC LIMIT $${i} OFFSET $${i + 1}`;
    params.push(limit, offset);

    const { rows } = await pool.query(query, params);
    return rows;
  }

  static async getById(id) {
    const { rows } = await pool.query(
      `
      SELECT
        dr.*,
        c.case_number,
        c.case_type,
        p.full_name AS person_name,
        p.person_number,
        h.name AS hospital_name,
        u.full_name AS reported_by_name
      FROM death_records dr
      LEFT JOIN cases c ON c.id = dr.case_id
      LEFT JOIN persons p ON p.id = c.person_id
      LEFT JOIN organizations h ON h.id = dr.hospital_id
      LEFT JOIN users u ON u.id = dr.reported_by
      WHERE dr.id = $1
      `,
      [id],
    );
    return rows[0] || null;
  }

  static async getByCaseId(caseId) {
    const { rows } = await pool.query(
      `SELECT * FROM death_records WHERE case_id = $1`,
      [caseId],
    );
    return rows[0] || null;
  }

  static async create(data) {
    const { rows } = await pool.query(
      `INSERT INTO death_records (
         case_id, event_id, death_datetime, death_location,
         death_context, cause_status, notes,
         hospital_id, death_type, reported_by
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        data.case_id,
        data.event_id || null,
        data.death_datetime || new Date(),
        data.death_location || null,
        data.death_context || null,
        data.cause_status || 'undetermined',
        data.notes || null,
        data.hospital_id || null,
        data.death_type || null,
        data.reported_by || null,
      ],
    );
    return rows[0];
  }

  static async update(id, data) {
    const allowed = [
      'event_id',
      'death_datetime',
      'death_location',
      'death_context',
      'cause_status',
      'notes',
      'hospital_id',
      'death_type',
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
      `UPDATE death_records SET ${updates.join(', ')}
       WHERE id = $${i} RETURNING *`,
      params,
    );
    return rows[0] || null;
  }

  static async delete(id) {
    const { rowCount } = await pool.query(
      `DELETE FROM death_records WHERE id = $1`,
      [id],
    );
    return rowCount > 0;
  }

  static async count() {
    const { rows } = await pool.query(`SELECT COUNT(*)::int AS total FROM death_records`);
    return rows[0]?.total ?? 0;
  }
}

module.exports = DeathRecord;