// services/LookupService.js
const models = {
  provinces: require('../models/Province'),
  'case-event-types': require('../models/CaseEventType'),
  'diagnosis-types': require('../models/DiagnosisType'),
  'authorization-types': require('../models/AuthorizationType'),
  'document-types': require('../models/DocumentType'),
  'report-types': require('../models/ReportType'),
  'notification-types': require('../models/NotificationType'),
  'operation-types': require('../models/OperationType'),
  'disability-types': require('../models/DisabilityType'),
};

class LookupService {
  getModel(type) {
    const model = models[type];
    if (!model) {
      throw new Error(`نوع الدليل المرجعي غير مدعوم: ${type}`);
    }
    return model;
  }

  async getLookupItems(type, { activeOnly = true } = {}) {
    const model = this.getModel(type);
    return await model.getAll({ activeOnly });
  }

  async getLookupItemById(type, id) {
    const model = this.getModel(type);
    return await model.getById(id);
  }

  async createLookupItem(type, data, userId) {
    const model = this.getModel(type);
    
    // التحقق من أن الكود غير مكرر
    const existing = await model.getByCode(data.code);
    if (existing) {
      throw new Error(`الرمز (code) ${data.code} مستخدم بالفعل.`);
    }

    const created = await model.create(data);
    // تسجيل الحدث في Audit Log (اختياري بحسب إعدادات النظام)
    // await auditLogService.log({ userId, action: 'LOOKUP_CREATE', details: { type, id: created.id } });
    return created;
  }

  async updateLookupItem(type, id, data, userId) {
    const model = this.getModel(type);
    const updated = await model.update(id, data);
    if (!updated) {
      throw new Error('العنصر غير موجود.');
    }
    return updated;
  }

  async disableLookupItem(type, id, userId) {
    const model = this.getModel(type);
    const disabled = await model.disable(id);
    if (!disabled) {
      throw new Error('العنصر غير موجود.');
    }
    return disabled;
  }
}

module.exports = new LookupService();