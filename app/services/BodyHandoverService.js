// services/BodyHandoverService.js
const {pool} = require('../config/db');
const BodyHandover = require('../models/BodyHandover');

class BodyHandoverService {
  static async list(filters) {
    return await BodyHandover.getAll(filters);
  }

  static async getById(id) {
    return await BodyHandover.getById(id);
  }

  static async create(data, userId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. إنشاء التسليم
      const handover = await BodyHandover.create({
        ...data,
        handed_over_by: data.handed_over_by || userId,
      });

      // 2. تحديث حالة الجثمان إلى handed_over
      await client.query(
        `UPDATE body_cases
         SET custody_status = 'handed_over', handover_status = 'completed'
         WHERE id = $1`,
        [data.body_case_id],
      );

      await client.query('COMMIT');
      return handover;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async delete(id) {
    return await BodyHandover.delete(id);
  }
}

module.exports = BodyHandoverService;