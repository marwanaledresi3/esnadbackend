// models/Notification.js
const { pool } = require('../config/db');

class Notification {
  /**
   * جلب البلاغات مع فلترة
   */
  static async getAll({
    user_id,
    organization_id,
    source_organization_id,
    notification_type_id,
    is_read,
    priority,
    entity_type,
    entity_id,
    from_date,
    to_date,
    limit = 100,
    offset = 0,
  } = {}) {
    let query = `
      SELECT
        n.id,
        n.user_id,
        u.full_name AS user_name,
        n.organization_id,
        o.name AS organization_name,
        n.source_organization_id,
        so.name AS source_organization_name,
        n.notification_type_id,
        nt.code AS notification_type_code,
        nt.name AS notification_type_name,
        n.title,
        n.message,
        n.entity_type,
        n.entity_id,
        n.priority,
        n.is_read,
        n.created_at,
        n.read_at,
        n.received_at,
        n.closed_at,
        n.closed_by
      FROM notifications n
      LEFT JOIN users u ON u.id = n.user_id
      LEFT JOIN organizations o ON o.id = n.organization_id
      LEFT JOIN organizations so ON so.id = n.source_organization_id
      LEFT JOIN notification_types nt ON nt.id = n.notification_type_id
      WHERE 1=1
    `;
    const params = [];
    let i = 1;

    if (user_id) {
      query += ` AND n.user_id = $${i}`;
      params.push(user_id);
      i++;
    }
    if (organization_id) {
      query += ` AND n.organization_id = $${i}`;
      params.push(organization_id);
      i++;
    }
    if (source_organization_id) {
      query += ` AND n.source_organization_id = $${i}`;
      params.push(source_organization_id);
      i++;
    }
    if (notification_type_id) {
      query += ` AND n.notification_type_id = $${i}`;
      params.push(notification_type_id);
      i++;
    }
    if (is_read !== undefined) {
      query += ` AND n.is_read = $${i}`;
      params.push(is_read);
      i++;
    }
    if (priority) {
      query += ` AND n.priority = $${i}`;
      params.push(priority);
      i++;
    }
    if (entity_type) {
      query += ` AND n.entity_type = $${i}`;
      params.push(entity_type);
      i++;
    }
    if (entity_id) {
      query += ` AND n.entity_id = $${i}`;
      params.push(entity_id);
      i++;
    }
    if (from_date) {
      query += ` AND n.created_at >= $${i}`;
      params.push(from_date);
      i++;
    }
    if (to_date) {
      query += ` AND n.created_at <= $${i}`;
      params.push(to_date);
      i++;
    }

    query += ` ORDER BY n.created_at DESC LIMIT $${i} OFFSET $${i + 1}`;
    params.push(limit, offset);

    const { rows } = await pool .query(query, params);
    return rows;
  }

  static async getById(id) {
    const { rows } = await pool .query(
      `SELECT * FROM notifications WHERE id = $1`,
      [id],
    );
    return rows[0] || null;
  }

  static async create({
    user_id,
    organization_id,
    source_organization_id,
    notification_type_id,
    title,
    message,
    entity_type,
    entity_id,
    priority = 'normal',
     metadata = {},
  }) {
    const { rows } = await pool .query(
      `INSERT INTO notifications (
         user_id, organization_id, source_organization_id,
         notification_type_id, title, message,
         entity_type, entity_id, priority, metadata
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        user_id,
        organization_id || null,
        source_organization_id || null,
        notification_type_id || null,
        title,
        message,
        entity_type || null,
        entity_id || null,
        priority,
        JSON.stringify(metadata),
      ],
    );
    return rows[0];
  }

  static async markAsRead(id) {
    const { rows } = await pool .query(
      `UPDATE notifications
       SET is_read = true, read_at = now()
       WHERE id = $1
       RETURNING *`,
      [id],
    );
    return rows[0] || null;
  }

  static async markAllAsRead(userId) {
    const { rowCount } = await pool .query(
      `UPDATE notifications
       SET is_read = true, read_at = now()
       WHERE user_id = $1 AND is_read = false`,
      [userId],
    );
    return rowCount;
  }

  static async close(id, closedBy) {
    const { rows } = await pool .query(
      `UPDATE notifications
       SET closed_at = now(), closed_by = $1
       WHERE id = $2
       RETURNING *`,
      [closedBy, id],
    );
    return rows[0] || null;
  }

  static async unreadCount(userId) {
    const { rows } = await pool .query(
      `SELECT COUNT(*)::int AS count
       FROM notifications
       WHERE user_id = $1 AND is_read = false`,
      [userId],
    );
    return rows[0]?.count ?? 0;
  }

  static async delete(id) {
    const { rowCount } = await pool .query(
      `DELETE FROM notifications WHERE id = $1`,
      [id],
    );
    return rowCount > 0;
  }
}

module.exports = Notification;