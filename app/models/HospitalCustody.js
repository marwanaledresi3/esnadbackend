// models/HospitalCustody.js
const { pool } = require('../config/db');

class HospitalCustody {
  /**
   * إنشاء سجل جثمان جديد
   */
  static async createBodyCase(data, dbClient = pool) {
    const query = `
      INSERT INTO body_cases (
        body_number,
        case_id,
        person_id,
        current_organization_id,
        current_location,
        status,
        notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const values = [
      data.body_number,
      data.case_id || null,
      data.person_id || null,
      data.current_organization_id,
      data.current_location || 'قسم الاستقبال',
      data.status || 'received',
      data.notes || null,
    ];

    const result = await dbClient.query(query, values);
    return result.rows[0];
  }

  /**
   * تسجيل بلاغ/سجل وفاة طبية
   */
  static async createDeathRecord(data, dbClient = pool) {
    const query = `
      INSERT INTO death_records (
        case_id,
        hospital_id,
        death_type,
        reported_by,
        reported_at,
        notes
      ) VALUES ($1, $2, $3, $4, NOW(), $5)
      RETURNING *;
    `;
    const values = [
      data.case_id,
      data.hospital_id,
      data.death_type,
      data.reported_by,
      data.notes || null,
    ];

    const result = await dbClient.query(query, values);
    return result.rows[0];
  }

  /**
   * البحث عن جثمان بواسطة الـ ID
   */
  static async findBodyById(id) {
    const query = `
      SELECT 
        bc.*,
        p.full_name AS person_name,
        p.national_id,
        o.name AS organization_name
      FROM body_cases bc
      LEFT JOIN persons p ON p.id = bc.person_id
      LEFT JOIN organizations o ON o.id = bc.current_organization_id
      WHERE bc.id = $1;
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * تحديث موقع وحالة تحفظ الجثمان (مثال: الثلاجة)
   */
  static async updateStorageLocation(id, location, status, dbClient = pool) {
    const query = `
      UPDATE body_cases
      SET current_location = $1, status = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING *;
    `;
    const result = await dbClient.query(query, [location, status, id]);
    return result.rows[0];
  }
}

module.exports = HospitalCustody;