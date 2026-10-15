// models/Person.js
const {pool} = require('../config/db');

class Person {
  /**
   * جلب قائمة الأشخاص مع فلاتر
   */
  static async getAll({
    search,
    gender,
    identity_status,
    national_id,
    limit = 100,
    offset = 0,
  } = {}) {
    let query = `
      SELECT
        id,
        person_number,
        full_name,
        first_name,
        father_name,
        grandfather_name,
        family_name,
        gender,
        date_of_birth,
        national_id,
        phone,
        address,
        identity_status,
        created_at,
        updated_at,
        created_by,
        updated_by
      FROM persons
      WHERE 1=1
    `;
    const params = [];
    let i = 1;

    if (search) {
      query += ` AND (
        full_name ILIKE $${i}
        OR first_name ILIKE $${i}
        OR father_name ILIKE $${i}
        OR family_name ILIKE $${i}
        OR person_number ILIKE $${i}
        OR national_id ILIKE $${i}
      )`;
      params.push(`%${search}%`);
      i++;
    }

    if (gender) {
      query += ` AND gender = $${i}`;
      params.push(gender);
      i++;
    }

    if (identity_status) {
      query += ` AND identity_status = $${i}`;
      params.push(identity_status);
      i++;
    }

    if (national_id) {
      query += ` AND national_id = $${i}`;
      params.push(national_id);
      i++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${i} OFFSET $${i + 1}`;
    params.push(limit, offset);

    const { rows } = await pool.query(query, params);
    return rows;
  }

  static async getById(id) {
    const { rows } = await pool.query(
      `SELECT * FROM persons WHERE id = $1`,
      [id],
    );
    return rows[0] || null;
  }

  static async getByNumber(personNumber) {
    const { rows } = await pool.query(
      `SELECT * FROM persons WHERE person_number = $1`,
      [personNumber],
    );
    return rows[0] || null;
  }

  static async getByNationalId(nationalId) {
    const { rows } = await pool.query(
      `SELECT * FROM persons WHERE national_id = $1`,
      [nationalId],
    );
    return rows[0] || null;
  }

  /**
   * توليد رقم شخص فريد: PER-2026-00001
   */
  static async generatePersonNumber() {
    const year = new Date().getFullYear();
    const pattern = `PER-${year}-%`;

    const { rows } = await pool.query(
      `SELECT person_number FROM persons
       WHERE person_number LIKE $1
       ORDER BY person_number DESC
       LIMIT 1`,
      [pattern],
    );

    let next = 1;
    if (rows.length > 0) {
      const parts = rows[0].person_number.split('-');
      const n = parseInt(parts[parts.length - 1], 10);
      if (!Number.isNaN(n)) next = n + 1;
    }

    return `PER-${year}-${String(next).padStart(5, '0')}`;
  }

  /**
   * إنشاء شخص جديد
   * - يولّد person_number تلقائياً إن لم يُمرّر
   * - يبني full_name من الأجزاء إن لم يُمرّر
   */
  static async create({
    person_number,
    full_name,
    first_name,
    father_name,
    grandfather_name,
    family_name,
    gender,
    date_of_birth,
    national_id,
    phone,
    address,
    identity_status = 'known',
    created_by,
  }) {
    // ولّد رقم الشخص إن لم يُمرّر
    let number = person_number;
    if (!number) {
      number = await Person.generatePersonNumber();
    }

    // ابنِ full_name من الأجزاء إن لم يُمرّر
    let fullName = full_name;
    if (!fullName) {
      const parts = [first_name, father_name, grandfather_name, family_name]
          .filter((p) => p && p.trim().length > 0);
      fullName = parts.join(' ');
    }

    const { rows } = await pool.query(
      `INSERT INTO persons (
         person_number, full_name,
         first_name, father_name, grandfather_name, family_name,
         gender, date_of_birth, national_id, phone, address,
         identity_status, created_by, updated_by
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$13)
       RETURNING *`,
      [
        number,
        fullName || null,
        first_name || null,
        father_name || null,
        grandfather_name || null,
        family_name || null,
        gender || 'unknown',
        date_of_birth || null,
        national_id || null,
        phone || null,
        address || null,
        identity_status,
        created_by || null,
      ],
    );
    return rows[0];
  }

  static async update(id, {
    full_name,
    first_name,
    father_name,
    grandfather_name,
    family_name,
    gender,
    date_of_birth,
    national_id,
    phone,
    address,
    identity_status,
    updated_by,
  }) {
    const updates = [];
    const params = [];
    let i = 1;

    const fields = {
      full_name,
      first_name,
      father_name,
      grandfather_name,
      family_name,
      gender,
      date_of_birth,
      national_id,
      phone,
      address,
      identity_status,
    };

    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        updates.push(`${key} = $${i}`);
        params.push(value);
        i++;
      }
    }

    if (updates.length === 0) return null;

    updates.push(`updated_at = now()`);
    if (updated_by) {
      updates.push(`updated_by = $${i}`);
      params.push(updated_by);
      i++;
    }

    params.push(id);
    const { rows } = await pool.query(
      `UPDATE persons SET ${updates.join(', ')}
       WHERE id = $${i}
       RETURNING *`,
      params,
    );
    return rows[0] || null;
  }

  static async delete(id) {
    const { rowCount } = await pool.query(
      `DELETE FROM persons WHERE id = $1`,
      [id],
    );
    return rowCount > 0;
  }

  /**
   * إحصائيات سريعة
   */
  static async count() {
    const { rows } = await pool.query(`SELECT COUNT(*)::int AS total FROM persons`);
    return rows[0]?.total ?? 0;
  }
}

module.exports = Person;