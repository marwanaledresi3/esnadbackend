// services/DocumentService.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Document = require('../models/Document');

class DocumentService {
  static async list(filters) {
    return await Document.getAll(filters);
  }

  static async getById(id) {
    return await Document.getById(id);
  }

  /**
   * إنشاء مستند من ملف مرفوع
   */
  static async createFromUpload({
    file,
    title,
    document_type_id,
    issued_by_organization_id,
    issued_at,
    entity_type,
    entity_id,
    userId,
  }) {
    // حساب hash للملف
    const fileBuffer = fs.readFileSync(file.path);
    const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // المسار النسبي
    const fileReference = path.relative(process.cwd(), file.path);

    const doc = await Document.create({
      title,
      document_type_id,
      issued_by_organization_id,
      issued_at,
      file_reference: fileReference,
      file_size: file.size,
      mime_type: file.mimetype,
      file_hash: fileHash,
      uploaded_by: userId,
    });

    // ربط بالكيان إذا مُرّر
    if (entity_type && entity_id) {
      await Document.link(doc.id, entity_type, entity_id);
    }

    return doc;
  }

  static async update(id, data) {
    return await Document.update(id, data);
  }

  static async delete(id) {
    const doc = await Document.getById(id);
    if (!doc) return false;

    // حذف الملف الفعلي
    try {
      const filePath = path.join(process.cwd(), doc.file_reference);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (_) {}

    return await Document.delete(id);
  }

  static async link(documentId, entityType, entityId) {
    return await Document.link(documentId, entityType, entityId);
  }

  static async unlink(linkId) {
    return await Document.unlink(linkId);
  }
}

module.exports = DocumentService;