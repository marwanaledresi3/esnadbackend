// models/AuthorizationRecipientLink.js
const {pool} = require('../config/db');

class AuthorizationRecipientLink {
  /**
   * جلب مستلم تصريح (مع بياناته الكاملة)
   */
  static async getByAuthorizationId(authorizationId) {
    const { rows } = await pool.query(
      `SELECT
         r.*,
         arl.id AS link_id,
         arl.authorization_id,
         arl.notes AS link_notes,
         arl.created_at AS link_created_at
       FROM authorization_recipient_links arl
       INNER JOIN recipients r ON r.id = arl.recipient_id
       WHERE arl.authorization_id = $1`,
      [authorizationId],
    );
    return rows[0] || null;
  }

  /**
   * ربط مستلم بتصريح
   */
  static async link(authorizationId, recipientId, userId, notes = null) {
    const { rows } = await pool.query(
      `INSERT INTO authorization_recipient_links (
         authorization_id, recipient_id, notes, created_by
       )
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (authorization_id) DO UPDATE
       SET recipient_id = EXCLUDED.recipient_id,
           notes = EXCLUDED.notes
       RETURNING *`,
      [authorizationId, recipientId, notes, userId || null],
    );
    return rows[0];
  }

  /**
   * إلغاء الربط
   */
  static async unlink(authorizationId) {
    const { rowCount } = await pool.query(
      `DELETE FROM authorization_recipient_links WHERE authorization_id = $1`,
      [authorizationId],
    );
    return rowCount > 0;
  }
}

module.exports = AuthorizationRecipientLink;