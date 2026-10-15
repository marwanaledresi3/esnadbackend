// models/Ambulance.js
const {pool} = require('../config/db');

class Ambulance {
  static async getAll({
    status,
    organization_id,
    search,
    limit = 200,
    offset = 0,
  } = {}) {
    let query = `
      SELECT
        a.id,
        a.organization_id,
        o.name AS organization_name,
        a.vehicle_code,
        a.vehicle_type,
        a.status,
        a.notes,
        a.created_at
      FROM ambulances a
      LEFT JOIN organizations o ON o.id = a.organization_id
      WHERE 1=1
    `;
    const params = [];
    let i = 1;

    if (status) {
      query += ` AND a.status = $${i}`;
      params.push(status);
      i++;
    }
    if (organization_id) {
      query += ` AND a.organization_id = $${i}`;
      params.push(organization_id);
      i++;
    }
    if (search) {
      query += ` AND (a.vehicle_code ILIKE $${i} OR a.vehicle_type ILIKE $${i})`;
      params.push(`%${search}%`);
      i++;
    }

    query += ` ORDER BY a.vehicle_code ASC LIMIT $${i} OFFSET $${i + 1}`;
    params.push(limit, offset);

    const { rows } = await pool.query(query, params);
    return rows;
  }

  static async getById(id) {
    const { rows } = await pool.query(
      `
      SELECT a.*, o.name AS organization_name
      FROM ambulances a
      LEFT JOIN organizations o ON o.id = a.organization_id
      WHERE a.id = $1
      `,
      [id],
    );
    return rows[0] || null;
  }

  static async getByCode(code) {
    const { rows } = await pool.query(
      `SELECT * FROM ambulances WHERE vehicle_code = $1`,
      [code],
    );
    return rows[0] || null;
  }

  static async create(data) {
    const { rows } = await pool.query(
      `INSERT INTO ambulances (
         organization_id, vehicle_code, vehicle_type, status, notes
       )
       VALUES ($1,$2,$3,$4,$5)
       RETURNING *`,
      [
        data.organization_id,
        data.vehicle_code,
        data.vehicle_type || null,
        data.status || 'available',
        data.notes || null,
      ],
    );
    return rows[0];
  }

  static async update(id, data) {
    const allowed = ['organization_id', 'vehicle_type', 'status', 'notes'];
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
      `UPDATE ambulances SET ${updates.join(', ')}
       WHERE id = $${i} RETURNING *`,
      params,
    );
    return rows[0] || null;
  }

  static async changeStatus(id, status) {
    const { rows } = await pool.query(
      `UPDATE ambulances SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id],
    );
    return rows[0] || null;
  }

  static async delete(id) {
    const { rowCount } = await pool.query(
      `DELETE FROM ambulances WHERE id = $1`,
      [id],
    );
    return rowCount > 0;
  }

  static async count() {
    const { rows } = await pool.query(`SELECT COUNT(*)::int AS total FROM ambulances`);
    return rows[0]?.total ?? 0;
  }
}

module.exports = Ambulance;