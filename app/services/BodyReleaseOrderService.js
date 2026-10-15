// services/BodyReleaseOrderService.js
const {pool} = require('../config/db');
const BodyReleaseOrder = require('../models/BodyReleaseOrder');

class BodyReleaseOrderService {
  static async list(filters) {
    return await BodyReleaseOrder.getAll(filters);
  }

  static async getById(id) {
    return await BodyReleaseOrder.getById(id);
  }

  static async create(data, userId) {
    // التحقق من وجود الجثمان
    const { rows: bc } = await pool.query(
      `SELECT id, status FROM body_cases WHERE id = $1`,
      [data.body_case_id],
    );
    if (bc.length === 0) {
      const err = new Error('الجثمان غير موجود');
      err.statusCode = 404;
      throw err;
    }

    return await BodyReleaseOrder.create({
      ...data,
      issued_by: userId,
      status: 'issued',
    });
  }

  static async execute(id) {
    return await BodyReleaseOrder.execute(id);
  }

  static async delete(id) {
    return await BodyReleaseOrder.delete(id);
  }
}

module.exports = BodyReleaseOrderService;