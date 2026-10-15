// services/DeathRecordService.js
const DeathRecord = require('../models/DeathRecord');
const Case = require('../models/Case');
const AuditLogService = require('./AuditLogService');

class DeathRecordService {
  static async list(filters) {
    return await DeathRecord.getAll(filters);
  }

  static async getById(id) {
    return await DeathRecord.getById(id);
  }

  static async create(data, userId) {
    // التحقق من وجود الحالة
    const caseItem = await Case.getById(data.case_id);
    if (!caseItem) {
      const err = new Error('الحالة المرتبطة غير موجودة');
      err.statusCode = 404;
      throw err;
    }

    // التحقق من عدم وجود سجل وفاة سابق
    const existing = await DeathRecord.getByCaseId(data.case_id);
    if (existing) {
      const err = new Error(
        `الحالة ${caseItem.case_number} لديها سجل وفاة مسجّل مسبقاً`,
      );
      err.statusCode = 409;
      throw err;
    }

    const created = await DeathRecord.create({
      ...data,
      reported_by: data.reported_by || userId,
    });

    // تحديث حالة الحالة إلى closed (اختياري)
    // await Case.changeStatus(data.case_id, 'closed');

    // سجّل الحدث
    await AuditLogService.log({
      user_id: userId,
      action: 'DEATH_RECORD_CREATE',
      entity_type: 'death_record',
      entity_id: created.id,
      result: 'success',
      new_values: created,
    });

    return created;
  }

  static async update(id, data, userId) {
    const updated = await DeathRecord.update(id, data);

    if (updated) {
      await AuditLogService.log({
        user_id: userId,
        action: 'DEATH_RECORD_UPDATE',
        entity_type: 'death_record',
        entity_id: id,
        result: 'success',
        new_values: updated,
      });
    }

    return updated;
  }

  static async delete(id, userId) {
    const record = await DeathRecord.getById(id);
    const ok = await DeathRecord.delete(id);

    if (ok) {
      await AuditLogService.log({
        user_id: userId,
        action: 'DEATH_RECORD_DELETE',
        entity_type: 'death_record',
        entity_id: id,
        result: 'success',
        old_values: record,
      });
    }

    return ok;
  }

  static async count() {
    return await DeathRecord.count();
  }
}

module.exports = DeathRecordService;