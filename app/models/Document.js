// models/Document.js
const {pool} = require('../config/db');

class Document {
  static async getAll({
    status,
    document_type_id,
    issued_by_organization_id,
    uploaded_by,
    entity_type,
    entity_id,
    search,
    from_date,
    to_date,
    limit = 100,
    offset = 0,
  } = {}) {
    let query = `
      SELECT
        d.id,
        d.document_number,
        d.document_type_id,
        dt.name AS document_type_name,
        dt.code AS document_type_code,
        d.title,
        d.issued_by_organization_id,
        o.name AS issued_by_organization_name,
        d.issued_at,
        d.file_reference,
        d.file_size,
        d.mime_type,
        d.file_hash,
        d.encryption_version,
        d.status,
        d.uploaded_by,
        u.full_name AS uploaded_by_name,
        d.uploaded_at
      FROM documents d
      LEFT JOIN document_types dt ON dt.id = d.document_type_id
      LEFT JOIN organizations o ON o.id = d.issued_by_organization_id
      LEFT JOIN users u ON u.id = d.uploaded_by
    `;

    // إذا كان هناك فلترة على الكيان، ربط مع document_links
    if (entity_type && entity_id) {
      query += `
        INNER JOIN document_links dl ON dl.document_id = d.id
        WHERE dl.entity_type = $1 AND dl.entity_id = $2
      `;
    } else {
      query += ` WHERE 1=1 `;
    }

    const params = [];
    let i = entity_type && entity_id ? 3 : 1;

    if (entity_type && entity_id) {
      params.push(entity_type, entity_id);
    }

    if (status) {
      query += ` AND d.status = $${i}`;
      params.push(status);
      i++;
    }
    if (document_type_id) {
      query += ` AND d.document_type_id = $${i}`;
      params.push(document_type_id);
      i++;
    }
    if (issued_by_organization_id) {
      query += ` AND d.issued_by_organization_id = $${i}`;
      params.push(issued_by_organization_id);
      i++;
    }
    if (uploaded_by) {
      query += ` AND d.uploaded_by = $${i}`;
      params.push(uploaded_by);
      i++;
    }
    if (search) {
      query += ` AND (d.title ILIKE $${i} OR d.document_number ILIKE $${i})`;
      params.push(`%${search}%`);
      i++;
    }
    if (from_date) {
      query += ` AND d.uploaded_at >= $${i}`;
      params.push(from_date);
      i++;
    }
    if (to_date) {
      query += ` AND d.uploaded_at <= $${i}`;
      params.push(to_date);
      i++;
    }

    query += ` ORDER BY d.uploaded_at DESC LIMIT $${i} OFFSET $${i + 1}`;
    params.push(limit, offset);

    const { rows } = await pool.query(query, params);
    return rows;
  }

  static async getById(id) {
    const { rows } = await pool.query(
      `
      SELECT
        d.*,
        dt.name AS document_type_name,
        dt.code AS document_type_code,
        o.name AS issued_by_organization_name,
        u.full_name AS uploaded_by_name
      FROM documents d
      LEFT JOIN document_types dt ON dt.id = d.document_type_id
      LEFT JOIN organizations o ON o.id = d.issued_by_organization_id
      LEFT JOIN users u ON u.id = d.uploaded_by
      WHERE d.id = $1
      `,
      [id],
    );
    if (rows.length === 0) return null;

    const doc = rows[0];

    // جلب الروابط
    const { rows: links } = await pool.query(
      `SELECT id, entity_type, entity_id FROM document_links WHERE document_id = $1`,
      [id],
    );
    doc.links = links;

    return doc;
  }

  static async generateNumber(prefix = 'DOC') {
    const year = new Date().getFullYear();
    const pattern = `${prefix}-${year}-%`;

    const { rows } = await pool.query(
      `SELECT document_number FROM documents
       WHERE document_number LIKE $1
       ORDER BY document_number DESC LIMIT 1`,
      [pattern],
    );

    let next = 1;
    if (rows.length > 0) {
      const parts = rows[0].document_number.split('-');
      const n = parseInt(parts[parts.length - 1], 10);
      if (!Number.isNaN(n)) next = n + 1;
    }
    return `${prefix}-${year}-${String(next).padStart(5, '0')}`;
  }

  static async create(data) {
    let number = data.document_number;
    if (!number) {
      number = await Document.generateNumber();
    }

    const { rows } = await pool.query(
      `INSERT INTO documents (
         document_number, document_type_id, title,
         issued_by_organization_id, issued_at,
         file_reference, file_size, mime_type, file_hash,
         encryption_version, status, uploaded_by
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [
        number,
        data.document_type_id || null,
        data.title,
        data.issued_by_organization_id || null,
        data.issued_at || null,
        data.file_reference,
        data.file_size || null,
        data.mime_type || null,
        data.file_hash || null,
        data.encryption_version || null,
        data.status || 'active',
        data.uploaded_by || null,
      ],
    );
    return rows[0];
  }

  static async update(id, data) {
    const allowed = ['title', 'document_type_id', 'status', 'issued_at', 'issued_by_organization_id'];
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
      `UPDATE documents SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`,
      params,
    );
    return rows[0] || null;
  }

  static async delete(id) {
    const { rowCount } = await pool.query(`DELETE FROM documents WHERE id = $1`, [id]);
    return rowCount > 0;
  }

  // ==================== Links ====================
  static async link(documentId, entityType, entityId) {
    const { rows } = await pool.query(
      `INSERT INTO document_links (document_id, entity_type, entity_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (document_id, entity_type, entity_id) DO NOTHING
       RETURNING *`,
      [documentId, entityType, entityId],
    );
    return rows[0];
  }

  static async unlink(id) {
    const { rowCount } = await pool.query(`DELETE FROM document_links WHERE id = $1`, [id]);
    return rowCount > 0;
  }

  static async getLinks(documentId) {
    const { rows } = await pool.query(
      `SELECT * FROM document_links WHERE document_id = $1`,
      [documentId],
    );
    return rows;
  }
}

module.exports = Document;