// models/BodyCase.js
const {pool} = require('../config/db');

class BodyCase {
  static async getAll({
    search,
    status,
    custody_status,
    forensic_status,
    handover_status,
    identity_status,
    organization_id,
    current_organization_id,
    storage_location_id,
    from_date,
    to_date,
    limit = 100,
    offset = 0,
  } = {}) {
    let query = `
      SELECT
        bc.id,
        bc.case_id,
        c.case_number,
        c.case_type,
        c.case_status,
        p.id AS person_id,
        p.full_name AS person_name,
        p.person_number AS person_number,
        p.identity_status AS person_identity_status,
        bc.body_number,
        bc.identity_status,
        bc.received_at,
        bc.received_from_organization_id,
        rfo.name AS received_from_organization_name,
        bc.received_from_location,
        bc.receiving_user_id,
        ru.full_name AS receiving_user_name,
        bc.storage_location_id,
        sl.name AS storage_location_name,
        bc.custody_status,
        bc.forensic_status,
        bc.handover_status,
        bc.requires_forensic_exam,
        bc.notes,
        bc.current_organization_id,
        co.name AS current_organization_name,
        bc.current_location,
        bc.status,
        bc.created_at,
        bc.created_by
      FROM body_cases bc
      LEFT JOIN cases c ON c.id = bc.case_id
      LEFT JOIN persons p ON p.id = c.person_id
      LEFT JOIN organizations rfo ON rfo.id = bc.received_from_organization_id
      LEFT JOIN users ru ON ru.id = bc.receiving_user_id
      LEFT JOIN storage_locations sl ON sl.id = bc.storage_location_id
      LEFT JOIN organizations co ON co.id = bc.current_organization_id
      WHERE 1=1
    `;
    const params = [];
    let i = 1;

    if (search) {
      query += ` AND (
        bc.body_number ILIKE $${i}
        OR c.case_number ILIKE $${i}
        OR p.full_name ILIKE $${i}
        OR p.person_number ILIKE $${i}
      )`;
      params.push(`%${search}%`);
      i++;
    }

    if (status) {
      query += ` AND bc.status = $${i}`;
      params.push(status);
      i++;
    }
    if (custody_status) {
      query += ` AND bc.custody_status = $${i}`;
      params.push(custody_status);
      i++;
    }
    if (forensic_status) {
      query += ` AND bc.forensic_status = $${i}`;
      params.push(forensic_status);
      i++;
    }
    if (handover_status) {
      query += ` AND bc.handover_status = $${i}`;
      params.push(handover_status);
      i++;
    }
    if (identity_status) {
      query += ` AND bc.identity_status = $${i}`;
      params.push(identity_status);
      i++;
    }
    if (organization_id) {
      query += ` AND c.organization_id = $${i}`;
      params.push(organization_id);
      i++;
    }
    if (current_organization_id) {
      query += ` AND bc.current_organization_id = $${i}`;
      params.push(current_organization_id);
      i++;
    }
    if (storage_location_id) {
      query += ` AND bc.storage_location_id = $${i}`;
      params.push(storage_location_id);
      i++;
    }
    if (from_date) {
      query += ` AND bc.received_at >= $${i}`;
      params.push(from_date);
      i++;
    }
    if (to_date) {
      query += ` AND bc.received_at <= $${i}`;
      params.push(to_date);
      i++;
    }

    query += ` ORDER BY bc.received_at DESC LIMIT $${i} OFFSET $${i + 1}`;
    params.push(limit, offset);

    const { rows } = await pool.query(query, params);
    return rows;
  }

  static async getById(id) {
    const { rows } = await pool.query(
      `
      SELECT
        bc.*,
        c.case_number,
        c.case_type,
        c.case_status,
        p.full_name AS person_name,
        p.person_number AS person_number,
        rfo.name AS received_from_organization_name,
        ru.full_name AS receiving_user_name,
        sl.name AS storage_location_name,
        co.name AS current_organization_name
      FROM body_cases bc
      LEFT JOIN cases c ON c.id = bc.case_id
      LEFT JOIN persons p ON p.id = c.person_id
      LEFT JOIN organizations rfo ON rfo.id = bc.received_from_organization_id
      LEFT JOIN users ru ON ru.id = bc.receiving_user_id
      LEFT JOIN storage_locations sl ON sl.id = bc.storage_location_id
      LEFT JOIN organizations co ON co.id = bc.current_organization_id
      WHERE bc.id = $1
      `,
      [id],
    );
    return rows[0] || null;
  }

  static async getByCaseId(caseId) {
    const { rows } = await pool.query(
      `SELECT * FROM body_cases WHERE case_id = $1`,
      [caseId],
    );
    return rows[0] || null;
  }

  static async getByBodyNumber(bodyNumber) {
    const { rows } = await pool.query(
      `SELECT * FROM body_cases WHERE body_number = $1`,
      [bodyNumber],
    );
    return rows[0] || null;
  }

  /**
   * توليد رقم جثمان فريد: BODY-2026-00001
   */
  static async generateBodyNumber() {
    const year = new Date().getFullYear();
    const pattern = `BODY-${year}-%`;

    const { rows } = await pool.query(
      `SELECT body_number FROM body_cases
       WHERE body_number LIKE $1
       ORDER BY body_number DESC
       LIMIT 1`,
      [pattern],
    );

    let next = 1;
    if (rows.length > 0) {
      const parts = rows[0].body_number.split('-');
      const n = parseInt(parts[parts.length - 1], 10);
      if (!Number.isNaN(n)) next = n + 1;
    }

    return `BODY-${year}-${String(next).padStart(5, '0')}`;
  }

  static async create(data) {
    let number = data.body_number;
    if (!number) {
      number = await BodyCase.generateBodyNumber();
    }

    const { rows } = await pool.query(
      `INSERT INTO body_cases (
         case_id, body_number, identity_status, received_at,
         received_from_organization_id, received_from_location,
         receiving_user_id, storage_location_id,
         custody_status, forensic_status, handover_status,
         requires_forensic_exam, notes,
         current_organization_id, current_location, status,
         created_by
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       RETURNING *`,
      [
        data.case_id,
        number,
        data.identity_status || 'unknown',
        data.received_at || new Date(),
        data.received_from_organization_id || null,
        data.received_from_location || null,
        data.receiving_user_id || null,
        data.storage_location_id || null,
        data.custody_status || 'preserved',
        data.forensic_status || 'not_required',
        data.handover_status || 'not_authorized',
        data.requires_forensic_exam === true,
        data.notes || null,
        data.current_organization_id || null,
        data.current_location || null,
        data.status || 'registered',
        data.created_by || null,
      ],
    );
    return rows[0];
  }

  static async update(id, data) {
    const allowed = [
      'identity_status',
      'received_at',
      'received_from_organization_id',
      'received_from_location',
      'receiving_user_id',
      'storage_location_id',
      'custody_status',
      'forensic_status',
      'handover_status',
      'requires_forensic_exam',
      'notes',
      'current_organization_id',
      'current_location',
      'status',
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
      `UPDATE body_cases SET ${updates.join(', ')}
       WHERE id = $${i}
       RETURNING *`,
      params,
    );
    return rows[0] || null;
  }

  static async changeStatus(id, status) {
    const { rows } = await pool.query(
      `UPDATE body_cases SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id],
    );
    return rows[0] || null;
  }

  static async changeCustodyStatus(id, custody_status) {
    const { rows } = await pool.query(
      `UPDATE body_cases SET custody_status = $1 WHERE id = $2 RETURNING *`,
      [custody_status, id],
    );
    return rows[0] || null;
  }

  static async changeForensicStatus(id, forensic_status) {
    const { rows } = await pool.query(
      `UPDATE body_cases SET forensic_status = $1 WHERE id = $2 RETURNING *`,
      [forensic_status, id],
    );
    return rows[0] || null;
  }

  static async changeHandoverStatus(id, handover_status) {
    const { rows } = await pool.query(
      `UPDATE body_cases SET handover_status = $1 WHERE id = $2 RETURNING *`,
      [handover_status, id],
    );
    return rows[0] || null;
  }

  static async delete(id) {
    const { rowCount } = await pool.query(
      `DELETE FROM body_cases WHERE id = $1`,
      [id],
    );
    return rowCount > 0;
  }

  static async count() {
    const { rows } = await pool.query(`SELECT COUNT(*)::int AS total FROM body_cases`);
    return rows[0]?.total ?? 0;
  }
}

module.exports = BodyCase;