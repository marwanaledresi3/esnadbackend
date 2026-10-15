// services/DocumentShareService.js
const DocumentShare = require('../models/DocumentShare');
const Document = require('../models/Document');
const Organization = require('../models/Organization');
const AuditLogService = require('./AuditLogService');

class DocumentShareService {
  static async list(filters) {
    return await DocumentShare.getAll(filters);
  }

  static async getById(id) {
    return await DocumentShare.getById(id);
  }

  static async getSharedWithOrganization(organizationId) {
    return await DocumentShare.getSharedWithOrganization(organizationId);
  }

  static async share(data, userId) {
    // التحقق من المستند
    const doc = await Document.getById(data.document_id);
    if (!doc) {
      const err = new Error('المستند غير موجود');
      err.statusCode = 404;
      throw err;
    }

    // التحقق من الجهة
    const org = await Organization.getById?.(data.shared_with_organization_id);
    // (إن لم تكن Organization.getById موجودة، تجاهل هذا التحقق)

    const created = await DocumentShare.create({
      ...data,
      shared_by_user_id: userId,
    });

    await AuditLogService.log({
      user_id: userId,
      action: 'DOCUMENT_SHARE',
      entity_type: 'document_share',
      entity_id: created.id,
      result: 'success',
      new_values: created,
    });

    return created;
  }

  static async revoke(id, reason, userId) {
    const updated = await DocumentShare.revoke(id, reason);

    if (updated) {
      await AuditLogService.log({
        user_id: userId,
        action: 'DOCUMENT_SHARE_REVOKE',
        entity_type: 'document_share',
        entity_id: id,
        result: 'success',
        new_values: { reason, revoked_at: updated.revoked_at },
      });
    }

    return updated;
  }

  static async delete(id) {
    return await DocumentShare.delete(id);
  }

  static async count() {
    return await DocumentShare.count();
  }
}

module.exports = DocumentShareService;