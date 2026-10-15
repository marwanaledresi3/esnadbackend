// services/SharedRecordService.js
const SharedRecord = require('../models/SharedRecord');
const Case = require('../models/Case');
const Organization = require('../models/Organization');
const AuditLogService = require('./AuditLogService');

class SharedRecordService {
  static async list(filters) {
    return await SharedRecord.getAll(filters);
  }

  static async getById(id) {
    return await SharedRecord.getById(id);
  }

  static async getSharedWithOrganization(organizationId) {
    return await SharedRecord.getSharedWithOrganization(organizationId);
  }

  static async share(data, userId) {
    // التحقق من الحالة
    const caseItem = await Case.getById(data.case_id);
    if (!caseItem) {
      const err = new Error('الحالة غير موجودة');
      err.statusCode = 404;
      throw err;
    }

    const created = await SharedRecord.create({
      ...data,
      shared_by_user_id: userId,
    });

    await AuditLogService.log({
      user_id: userId,
      action: 'SHARED_RECORD_CREATE',
      entity_type: 'shared_record',
      entity_id: created.id,
      result: 'success',
      new_values: created,
    });

    return created;
  }

  static async revoke(id, reason, userId) {
    const updated = await SharedRecord.revoke(id, reason);

    if (updated) {
      await AuditLogService.log({
        user_id: userId,
        action: 'SHARED_RECORD_REVOKE',
        entity_type: 'shared_record',
        entity_id: id,
        result: 'success',
        new_values: { reason, revoked_at: updated.revoked_at },
      });
    }

    return updated;
  }

  static async delete(id) {
    return await SharedRecord.delete(id);
  }

  static async count() {
    return await SharedRecord.count();
  }
}

module.exports = SharedRecordService;