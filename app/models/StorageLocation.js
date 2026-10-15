// models/StorageLocation.js
const {pool} = require('../config/db');

class StorageLocation {
  static async getAll({
    organization_id,
    location_type,
    status,
    search,
    limit = 200,
    offset = 0,
  } = {}) {
    let query = `
      SELECT
        sl.id,
        sl.organization_id,
        o.name AS organization_name,
        sl.name,
        sl.location_type,
        sl.capacity,
        sl.status,
        -- حساب عدد الجثامين الحالية في هذا الموقع
        (SELECT COUNT(*)::int FROM body_cases bc
         WHERE bc.storage_location_id = sl.id
           AND bc.custody_status = 'preserved') AS current_occupancy
      FROM storage_locations sl
      LEFT JOIN organizations o ON o.id = sl.organization_id
      WHERE 1=1
    `;
    const params = [];
    let i = 1;

    if (organization_id) {
      query += ` AND sl.organization_id = $${i}`;
      params.push(organization_id);
      i++;
    }
    if (location_type) {
      query += ` AND sl.location_type = $${i}`;
      params.push(location_type);
      i++;
    }
    if (status) {
      query += ` AND sl.status = $${i}`;
      params.push(status);
      i++;
    }
    if (search) {
      query += ` AND sl.name ILIKE $${i}`;
      params.push(`%${search}%`);
      i++;
    }

    query += ` ORDER BY sl.name ASC LIMIT $${i} OFFSET $${i + 1}`;
    params.push(limit, offset);

    const { rows } = await pool.query(query, params);
    return rows;
  }

  static async getById(id) {
    const { rows } = await pool.query(
      `
      SELECT
        sl.*,
        o.name AS organization_name,
        (SELECT COUNT(*)::int FROM body_cases bc
         WHERE bc.storage_location_id = sl.id
           AND bc.custody_status = 'preserved') AS current_occupancy
      FROM storage_locations sl
      LEFT JOIN organizations o ON o.id = sl.organization_id
      WHERE sl.id = $1
      `,
      [id],
    );
    return rows[0] || null;
  }

  static async create(data) {
    const { rows } = await pool.query(
      `INSERT INTO storage_locations (
         organization_id, name, location_type, capacity, status
       )
       VALUES ($1,$2,$3,$4,$5)
       RETURNING *`,
      [
        data.organization_id,
        data.name,
        data.location_type,
        data.capacity || null,
        data.status || 'active',
      ],
    );
    return rows[0];
  }

  static async update(id, data) {
    const allowed = ['name', 'location_type', 'capacity', 'status'];
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
      `UPDATE storage_locations SET ${updates.join(', ')}
       WHERE id = $${i} RETURNING *`,
      params,
    );
    return rows[0] || null;
  }

  static async changeStatus(id, status) {
    const { rows } = await pool.query(
      `UPDATE storage_locations SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id],
    );
    return rows[0] || null;
  }

  static async delete(id) {
    // تحقق من عدم وجود جثامين مرتبطة
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS count FROM body_cases WHERE storage_location_id = $1`,
      [id],
    );
    if (rows[0].count > 0) {
      const err = new Error(
        `لا يمكن الحذف — يوجد ${rows[0].count} جثمان مرتبط بهذا الموقع`,
      );
      err.statusCode = 409;
      throw err;
    }

    const { rowCount } = await pool.query(
      `DELETE FROM storage_locations WHERE id = $1`,
      [id],
    );
    return rowCount > 0;
  }

  static async count() {
    const { rows } = await pool.query(`SELECT COUNT(*)::int AS total FROM storage_locations`);
    return rows[0]?.total ?? 0;
  }
}

module.exports = StorageLocation;