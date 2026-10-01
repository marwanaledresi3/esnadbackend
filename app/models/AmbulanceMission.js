const { pool } = require('../config/db');

class AmbulanceMission {
  // تسجيل نقطة تتبع في المهمة (توقيت الإنطلاق، الوصول للموقع، مغادرة الموقع، الوصول للمنشأة)
  static async logMilestone({ dispatch_id, milestone_type, latitude, longitude, notes, actor_user_id }, client = pool) {
    const query = `
      INSERT INTO ambulance_missions (dispatch_id, milestone_type, latitude, longitude, notes, created_by_user_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [dispatch_id, milestone_type, latitude || null, longitude || null, notes || null, actor_user_id];
    const res = await client.query(query, values);
    return res.rows[0];
  }

  static async getMissionTimeline(dispatchId) {
    const query = `
      SELECT am.*, u.full_name AS logged_by
      FROM ambulance_missions am
      LEFT JOIN users u ON am.created_by_user_id = u.user_id
      WHERE am.dispatch_id = $1
      ORDER BY am.created_at ASC
    `;
    const res = await pool.query(query, [dispatchId]);
    return res.rows;
  }
}

module.exports = AmbulanceMission;