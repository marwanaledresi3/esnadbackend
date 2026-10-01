const { pool } = require('../config/db');

class Handover {
  // إنشاء محضر تسليم جديد
  static async create({ case_id, receiver_name, receiver_id_number, receiver_relationship, receiver_phone, is_official_entity, handover_notes, handed_over_by_user_id }, client = pool) {
    const query = `
      INSERT INTO handovers (
        case_id, receiver_name, receiver_id_number, receiver_relationship, 
        receiver_phone, is_official_entity, handover_notes, handed_over_by_user_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const values = [
      case_id, receiver_name, receiver_id_number, receiver_relationship || null,
      receiver_phone || null, is_official_entity || false, handover_notes || null, handed_over_by_user_id
    ];
    const res = await client.query(query, values);
    return res.rows[0];
  }
}

module.exports = Handover;