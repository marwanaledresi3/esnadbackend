// services/ForensicRequestService.js
const ForensicRequest = require('../models/ForensicRequest');
const BodyCase = require('../models/BodyCase');
const Notification = require('../models/Notification');

class ForensicRequestService {
  static async list(filters) {
    return await ForensicRequest.getAll(filters);
  }

  static async getById(id) {
    return await ForensicRequest.getById(id);
  }

  static async create(data, userId) {
    if (!data.body_case_id) {
      const err = new Error('body_case_id مطلوب');
      err.statusCode = 400;
      throw err;
    }

    // تحقق من وجود الجثمان
    const bodyCase = await BodyCase.getById(data.body_case_id);
    if (!bodyCase) {
      const err = new Error('الجثمان غير موجود');
      err.statusCode = 404;
      throw err;
    }

    const created = await ForensicRequest.create({
      ...data,
      requested_by: userId,
      status: data.status || 'awaiting_authorization',
      hospital_id: data.hospital_id || bodyCase.current_organization_id,
    });

    // إشعار للمسؤولين
    try {
      await Notification.create({
        user_id: userId,
        organization_id: created.hospital_id,
        title: 'طلب فحص شرعي جديد',
        message: `تم إنشاء طلب فحص شرعي رقم ${created.request_number}`,
        entity_type: 'forensic_request',
        entity_id: created.id,
        priority: 'high',
      });
    } catch (_) {}

    return created;
  }

  static async update(id, data) {
    return await ForensicRequest.update(id, data);
  }

  static async changeStatus(id, status) {
    return await ForensicRequest.changeStatus(id, status);
  }

  static async authorize(id, authorizationId) {
    return await ForensicRequest.update(id, {
      status: 'authorized',
      authorization_id: authorizationId,
    });
  }

  static async complete(id, reportDocumentId) {
    return await ForensicRequest.update(id, {
      status: 'completed',
      completed_at: new Date(),
      report_document_id: reportDocumentId,
    });
  }

  static async reject(id, reason) {
    return await ForensicRequest.update(id, {
      status: 'rejected',
      notes: reason,
    });
  }

  static async delete(id) {
    return await ForensicRequest.delete(id);
  }

  static async count() {
    return await ForensicRequest.count();
  }

  // ==================== Examinations ====================
  static async addExamination(data) {
    return await ForensicRequest.addExamination(data);
  }

  static async updateExamination(id, data) {
    return await ForensicRequest.updateExamination(id, data);
  }

  static async deleteExamination(id) {
    return await ForensicRequest.deleteExamination(id);
  }
}

module.exports = ForensicRequestService;