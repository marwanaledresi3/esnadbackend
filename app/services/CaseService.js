// services/CaseService.js
const { pool } = require('../config/db');
const Case = require('../models/Case');

class CaseService {
  static async list(filters) {
    return await Case.getAll(filters);
  }

  static async getById(id) {
    return await Case.getById(id);
  }

  static async create(data, userId) {
    // التحقق من person_id إذا مُرّر
    if (data.person_id) {
      const { rows } = await pool.query(
        `SELECT id, full_name FROM persons WHERE id = $1`,
        [data.person_id],
      );
      if (rows.length === 0) {
        const err = new Error('الشخص المرتبط غير موجود');
        err.statusCode = 400;
        throw err;
      }
    }

    // التحقق من organization_id
    if (!data.organization_id) {
      const err = new Error('organization_id مطلوب');
      err.statusCode = 400;
      throw err;
    }

    return await Case.create({
      ...data,
      opened_by: userId,
    });
  }

  static async update(id, data) {
    return await Case.update(id, data);
  }

  static async close(id) {
    return await Case.close(id);
  }

  static async changeStatus(id, status) {
    return await Case.changeStatus(id, status);
  }

  static async delete(id) {
    return await Case.delete(id);
  }

  static async count() {
    return await Case.count();
  }
}

module.exports = CaseService;