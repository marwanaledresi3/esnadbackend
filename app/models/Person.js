const { pool } = require('../config/db');

class Person {
  // إنشاء شخص جديد (معروف أو مجهول)
  static async create({ person_number, identity_status, national_id, full_name, gender, age_estimate, photo_url }, client = pool) {
    const query = `
      INSERT INTO persons (person_number, identity_status, national_id, full_name, gender, age_estimate, photo_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [person_number, identity_status, national_id || null, full_name || null, gender || 'UNKNOWN', age_estimate || null, photo_url || null];
    const res = await client.query(query, values);
    return res.rows[0];
  }

  // البحث برقم الشخص الموحد
  static async findByPersonNumber(personNumber) {
    const query = `SELECT * FROM persons WHERE person_number = $1`;
    const res = await pool.query(query, [personNumber]);
    return res.rows[0] || null;
  }

  // تحديث هوية مجهول عند التعرف عليه
  static async updateIdentity(personId, { full_name, national_id, identity_status = 'KNOWN' }, client = pool) {
    const query = `
      UPDATE persons 
      SET full_name = $1, national_id = $2, identity_status = $3
      WHERE person_id = $4
      RETURNING *
    `;
    const res = await client.query(query, [full_name, national_id, identity_status, personId]);
    return res.rows[0];
  }
}

module.exports = Person;