// models/Recipient.js
const {pool} = require('../config/db');

class Recipient {
  // ══════════════════════════════════════════════
  // READ
  // ══════════════════════════════════════════════
  static async getAll(organizationId, { limit = 100, offset = 0 } = {}) {
    const { rows } = await pool.query(
      `SELECT * FROM recipients
       WHERE organization_id = $1
       ORDER BY full_name ASC
       LIMIT $2 OFFSET $3`,
      [organizationId, limit, offset],
    );
    return rows;
  }

  static async getById(id) {
    const { rows } = await pool.query(
      `SELECT * FROM recipients WHERE id = $1`,
      [id],
    );
    return rows[0] || null;
  }

  static async search(organizationId, query) {
    const { rows } = await pool.query(
      `SELECT * FROM recipients
       WHERE organization_id = $1
         AND (
           full_name ILIKE $2
           OR id_number ILIKE $2
           OR phone ILIKE $2
         )
       ORDER BY full_name ASC
       LIMIT 20`,
      [organizationId, `%${query}%`],
    );
    return rows;
  }

  // ══════════════════════════════════════════════
  // CREATE
  // ══════════════════════════════════════════════
  static async create(data) {
    const { rows } = await pool.query(
      `INSERT INTO recipients (
         organization_id, full_name, id_number, id_type,
         phone, relationship, address, id_verified,
         verified_by, verified_at, verification_method,
         id_document_url, notes, metadata, created_by
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [
        data.organization_id,
        data.full_name,
        data.id_number || null,
        data.id_type || 'national_id',
        data.phone || null,
        data.relationship || null,
        data.address || null,
        data.id_verified === true,
        data.verified_by || null,
        data.verified_at || null,
        data.verification_method || null,
        data.id_document_url || null,
        data.notes || null,
        data.metadata ? JSON.stringify(data.metadata) : '{}',
        data.created_by || null,
      ],
    );
    return rows[0];
  }

  static async update(id, data) {
    const allowed = [
      'full_name', 'id_number', 'id_type', 'phone',
      'relationship', 'address', 'id_verified',
      'verified_by', 'verified_at', 'verification_method',
      'id_document_url', 'notes', 'metadata', 'updated_by',
    ];
    const updates = [];
    const params = [];
    let i = 1;

    for (const key of allowed) {
      if (data[key] !== undefined) {
        updates.push(`${key} = $${i}`);
        params.push(
          key === 'metadata' && data[key] !== null
            ? JSON.stringify(data[key])
            : data[key],
        );
        i++;
      }
    }

    if (updates.length === 0) return null;
    updates.push(`updated_at = now()`);
    params.push(id);

    const { rows } = await pool.query(
      `UPDATE recipients SET ${updates.join(', ')}
       WHERE id = $${i}
       RETURNING *`,
      params,
    );
    return rows[0] || null;
  }

  static async delete(id) {
    const { rowCount } = await pool.query(
      `DELETE FROM recipients WHERE id = $1`,
      [id],
    );
    return rowCount > 0;
  }
 
static async isLinked(id) {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS count
     FROM authorization_recipient_links
     WHERE recipient_id = $1`,
    [id],
  );
  return (rows[0]?.count ?? 0) > 0;
}

// ══════════════════════════════════════════════
// تصاريح مستلم معيّن
// ══════════════════════════════════════════════
static async getAuthorizations(id) {
  const { rows } = await pool.query(
    `SELECT
       a.id,
       a.authorization_number,
       a.status,
       a.issued_at,
       a.valid_from,
       a.valid_until,
       at.name AS authorization_type_name,
       arl.created_at AS linked_at
     FROM authorization_recipient_links arl
     INNER JOIN authorizations a ON a.id = arl.authorization_id
     LEFT JOIN authorization_types at ON at.id = a.authorization_type_id
     WHERE arl.recipient_id = $1
     ORDER BY arl.created_at DESC`,
    [id],
  );
  return rows;
}

// ══════════════════════════════════════════════
// عدد المستلمين في جهة
// ══════════════════════════════════════════════
static async countByOrganization(organizationId) {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS total FROM recipients
     WHERE organization_id = $1`,
    [organizationId],
  );
  return rows[0]?.total ?? 0;
}
}

module.exports = Recipient;