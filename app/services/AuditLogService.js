// services/AuditLogService.js
const AuditLog = require('../models/AuditLog');

class AuditLogService {
  static async list(filters) {
    return await AuditLog.getAll(filters);
  }

  static async getById(id) {
    return await AuditLog.getById(id);
  }

  static async log(data) {
    try {
      return await AuditLog.log(data);
    } catch (error) {
      // لا نُفشل العملية الأصلية بسبب فشل التسجيل
      console.error('AuditLogService.log error', error);
      return null;
    }
  }

  static async getDistinctActions() {
    return await AuditLog.getDistinctActions();
  }

  static async getDistinctEntityTypes() {
    return await AuditLog.getDistinctEntityTypes();
  }

  static async getStats(filters) {
    return await AuditLog.getStats(filters);
  }

  static async deleteOlderThan(days) {
    return await AuditLog.deleteOlderThan(days);
  }
}

module.exports = AuditLogService;