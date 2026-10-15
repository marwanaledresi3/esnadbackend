// controllers/DocumentController.js
const path = require('path');
const fs = require('fs');
const DocumentService = require('../services/DocumentService');

class DocumentController {
  static async getAll(req, res) {
    try {
      const {
        status, document_type_id, issued_by_organization_id,
        uploaded_by, entity_type, entity_id, search,
        from_date, to_date, limit, offset,
      } = req.query;

      const items = await DocumentService.list({
        status, document_type_id, issued_by_organization_id, uploaded_by,
        entity_type, entity_id, search, from_date, to_date,
        limit: limit ? Number(limit) : 100,
        offset: offset ? Number(offset) : 0,
      });

      return res.json({ success: true, message: 'قائمة المستندات', data: items });
    } catch (error) {
      console.error('DocumentController.getAll', error);
      return res.status(500).json({ success: false, message: 'تعذر جلب المستندات' });
    }
  }

  static async getById(req, res) {
    try {
      const item = await DocumentService.getById(req.params.id);
      if (!item) return res.status(404).json({ success: false, message: 'المستند غير موجود' });
      return res.json({ success: true, data: item });
    } catch (error) {
      console.error('DocumentController.getById', error);
      return res.status(500).json({ success: false, message: 'تعذر جلب المستند' });
    }
  }

  /**
   * POST /documents
   * multipart/form-data:
   *   file: <binary>
   *   title: "..."
   *   document_type_id: "..."
   *   entity_type: "body_case"
   *   entity_id: "..."
   */
  static async create(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'الملف مطلوب' });
      }

      const {
        title,
        document_type_id,
        issued_by_organization_id,
        issued_at,
        entity_type,
        entity_id,
      } = req.body;

      if (!title) {
        return res.status(400).json({ success: false, message: 'العنوان مطلوب' });
      }

      const created = await DocumentService.createFromUpload({
        file: req.file,
        title,
        document_type_id,
        issued_by_organization_id: issued_by_organization_id || req.user?.organization_id,
        issued_at,
        entity_type,
        entity_id,
        userId: req.user?.id,
      });

      return res.status(201).json({
        success: true,
        message: 'تم رفع المستند بنجاح',
        data: created,
      });
    } catch (error) {
      console.error('DocumentController.create', error);
      return res.status(500).json({ success: false, message: 'تعذر رفع المستند' });
    }
  }

  static async update(req, res) {
    try {
      const updated = await DocumentService.update(req.params.id, req.body);
      if (!updated) return res.status(404).json({ success: false, message: 'المستند غير موجود' });
      return res.json({ success: true, message: 'تم التحديث', data: updated });
    } catch (error) {
      console.error('DocumentController.update', error);
      return res.status(500).json({ success: false, message: 'تعذر التحديث' });
    }
  }

  static async delete(req, res) {
    try {
      const ok = await DocumentService.delete(req.params.id);
      if (!ok) return res.status(404).json({ success: false, message: 'المستند غير موجود' });
      return res.json({ success: true, message: 'تم حذف المستند' });
    } catch (error) {
      console.error('DocumentController.delete', error);
      return res.status(500).json({ success: false, message: 'تعذر حذف المستند' });
    }
  }

  /**
   * GET /documents/:id/download
   * إعادة الملف الفعلي
   */
  static async download(req, res) {
    try {
      const doc = await DocumentService.getById(req.params.id);
      if (!doc) return res.status(404).json({ success: false, message: 'المستند غير موجود' });

      const filePath = path.join(process.cwd(), doc.file_reference);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, message: 'الملف غير موجود على السيرفر' });
      }

      res.setHeader('Content-Type', doc.mime_type || 'application/octet-stream');
      res.setHeader('Content-Disposition', `inline; filename="${doc.title}"`);
      return res.sendFile(filePath);
    } catch (error) {
      console.error('DocumentController.download', error);
      return res.status(500).json({ success: false, message: 'تعذر تحميل الملف' });
    }
  }

  static async link(req, res) {
    try {
      const { entity_type, entity_id } = req.body;
      const link = await DocumentService.link(req.params.id, entity_type, entity_id);
      return res.status(201).json({ success: true, data: link });
    } catch (error) {
      console.error('DocumentController.link', error);
      return res.status(500).json({ success: false, message: 'تعذر الربط' });
    }
  }

  static async unlink(req, res) {
    try {
      const ok = await DocumentService.unlink(req.params.linkId);
      if (!ok) return res.status(404).json({ success: false, message: 'الرابط غير موجود' });
      return res.json({ success: true, message: 'تم إلغاء الربط' });
    } catch (error) {
      console.error('DocumentController.unlink', error);
      return res.status(500).json({ success: false, message: 'تعذر الإلغاء' });
    }
  }
}

module.exports = DocumentController;