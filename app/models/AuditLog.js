// models/AuditLogModel.js
const { pool } = require('../config/db');
// models/AuditLog.js

class AuditLog {
  static async getAll({
    user_id,
    organization_id,
    action,
    entity_type,
    entity_id,
    result,
    from_date,
    to_date,
    search,
    limit = 100,
    offset = 0,
  } = {}) {
    let query = `
      SELECT
        al.id,
        al.user_id,
        u.full_name AS user_name,
        u.username AS user_username,
        al.organization_id,
        o.name AS organization_name,
        al.action,
        al.entity_type,
        al.entity_id,
        al.result,
        al.old_values,
        al.new_values,
        al.ip_address,
        al.user_agent,
        al.created_at
      FROM audit_logs al
      LEFT JOIN users u ON u.id = al.user_id
      LEFT JOIN organizations o ON o.id = al.organization_id
      WHERE 1=1
    `;
    const params = [];
    let i = 1;

    if (user_id) {
      query += ` AND al.user_id = $${i}`;
      params.push(user_id);
      i++;
    }
    if (organization_id) {
      query += ` AND al.organization_id = $${i}`;
      params.push(organization_id);
      i++;
    }
    if (action) {
      query += ` AND al.action = $${i}`;
      params.push(action);
      i++;
    }
    if (entity_type) {
      query += ` AND al.entity_type = $${i}`;
      params.push(entity_type);
      i++;
    }
    if (entity_id) {
      query += ` AND al.entity_id = $${i}`;
      params.push(entity_id);
      i++;
    }
    if (result) {
      query += ` AND al.result = $${i}`;
      params.push(result);
      i++;
    }
    if (from_date) {
      query += ` AND al.created_at >= $${i}`;
      params.push(from_date);
      i++;
    }
    if (to_date) {
      query += ` AND al.created_at <= $${i}`;
      params.push(to_date);
      i++;
    }
    if (search) {
      query += ` AND (al.action ILIKE $${i} OR al.entity_type ILIKE $${i})`;
      params.push(`%${search}%`);
      i++;
    }

    query += ` ORDER BY al.created_at DESC LIMIT $${i} OFFSET $${i + 1}`;
    params.push(limit, offset);

    const { rows } = await pool.query(query, params);
    return rows;
  }

  static async getById(id) {
    const { rows } = await pool.query(
      `
      SELECT
        al.*,
        u.full_name AS user_name,
        u.username AS user_username,
        o.name AS organization_name
      FROM audit_logs al
      LEFT JOIN users u ON u.id = al.user_id
      LEFT JOIN organizations o ON o.id = al.organization_id
      WHERE al.id = $1
      `,
      [id],
    );
    return rows[0] || null;
  }

  static async log({
    user_id,
    organization_id,
    action,
    entity_type,
    entity_id,
    result = 'success',
    old_values,
    new_values,
    ip_address,
    user_agent,
  }) {
    const { rows } = await pool.query(
      `INSERT INTO audit_logs (
         user_id, organization_id, action, entity_type, entity_id,
         result, old_values, new_values, ip_address, user_agent
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        user_id || null,
        organization_id || null,
        action,
        entity_type || null,
        entity_id || null,
        result,
        old_values ? JSON.stringify(old_values) : null,
        new_values ? JSON.stringify(new_values) : null,
        ip_address || null,
        user_agent || null,
      ],
    );
    return rows[0];
  }

  static async getDistinctActions() {
    const { rows } = await pool.query(
      `SELECT DISTINCT action FROM audit_logs ORDER BY action`,
    );
    return rows.map((r) => r.action);
  }

  static async getDistinctEntityTypes() {
    const { rows } = await pool.query(
      `SELECT DISTINCT entity_type FROM audit_logs
       WHERE entity_type IS NOT NULL
       ORDER BY entity_type`,
    );
    return rows.map((r) => r.entity_type);
  }

  static async getStats({ from_date, to_date } = {}) {
    let where = 'WHERE 1=1';
    const params = [];
    let i = 1;

    if (from_date) {
      where += ` AND created_at >= $${i}`;
      params.push(from_date);
      i++;
    }
    if (to_date) {
      where += ` AND created_at <= $${i}`;
      params.push(to_date);
      i++;
    }

    const { rows } = await pool.query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE result = 'success')::int AS success_count,
         COUNT(*) FILTER (WHERE result = 'failure')::int AS failure_count,
         COUNT(*) FILTER (WHERE result = 'denied')::int AS denied_count,
         COUNT(DISTINCT user_id)::int AS unique_users
       FROM audit_logs ${where}`,
      params,
    );
    return rows[0];
  }

  static async deleteOlderThan(days) {
    const { rowCount } = await pool.query(
      `DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '${days} days'`,
    );
    return rowCount;
  }
}

module.exports = AuditLog;