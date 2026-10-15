// services/BodyCaseService.js
const {pool} = require('../config/db');
const BodyCase = require('../models/BodyCase');
const Case = require('../models/Case');

class BodyCaseService {
  static async list(filters) {
    return await BodyCase.getAll(filters);
  }

  static async getById(id) {
    return await BodyCase.getById(id);
  }

  /**
   * إنشاء جثمان جديد
   * - تحقق من وجود الحالة
   * - تحقق من عدم وجود جثمان لنفس الحالة
   */
  static async create(data, userId) {
    if (!data.case_id) {
      const err = new Error('case_id مطلوب');
      err.statusCode = 400;
      throw err;
    }

    // تحقق من الحالة
    const caseItem = await Case.getById(data.case_id);
    if (!caseItem) {
      const err = new Error('الحالة المرتبطة غير موجودة');
      err.statusCode = 404;
      throw err;
    }

    // تحقق من عدم وجود جثمان للحالة نفسها
    const existing = await BodyCase.getByCaseId(data.case_id);
    if (existing) {
      const err = new Error(
        `الحالة ${caseItem.case_number} لديها جثمان مسجّل مسبقاً: ${existing.body_number}`,
      );
      err.statusCode = 409;
      throw err;
    }

    return await BodyCase.create({
      ...data,
      receiving_user_id: data.receiving_user_id || userId,
      created_by: userId,
    });
  }

  static async update(id, data) {
    return await BodyCase.update(id, data);
  }

  static async changeStatus(id, status) {
    return await BodyCase.changeStatus(id, status);
  }

  static async changeCustodyStatus(id, custody_status) {
    return await BodyCase.changeCustodyStatus(id, custody_status);
  }

  static async changeForensicStatus(id, forensic_status) {
    return await BodyCase.changeForensicStatus(id, forensic_status);
  }

  static async changeHandoverStatus(id, handover_status) {
    return await BodyCase.changeHandoverStatus(id, handover_status);
  }

  static async delete(id) {
    return await BodyCase.delete(id);
  }

  static async count() {
    return await BodyCase.count();
  }
}

module.exports = BodyCaseService;