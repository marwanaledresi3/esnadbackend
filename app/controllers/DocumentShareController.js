// controllers/DocumentShareController.js
const DocumentShareService = require('../services/DocumentShareService');

class DocumentShareController {
  static async getAll(req, res) {
    try {
      const {
        document_id, shared_with_organization_id,
        shared_by_user_id, status, limit, offset,
      } = req.query;

      const items = await DocumentShareService.list({
        document_id,
        shared_with_organization_id,
        shared_by_user_id,
        status,
        limit: limit ? Number(limit) : 100,
        offset: offset ? Number(offset) : 0,
      });

      return res.json({ success: true, data: items });
    } catch (error) {
      console.error('DocumentShareController.getAll', error);
      return res.status(500).json({ success: false, message: 'تعذر الجلب' });
    }
  }

  static async getById(req, res) {
    try {
      const item = await DocumentShareService.getById(req.params.id);
      if (!item) return res.status(404).json({ success: false, message: 'غير موجود' });
      return res.json({ success: true, data: item });
    } catch (error) {
      console.error('DocumentShareController.getById', error);
      return res.status(500).json({ success: false, message: 'تعذر الجلب' });
    }
  }

  /**
   * المستندات المُشاركة مع جهة المستخدم الحالي
   */
  static async getSharedWithMe(req, res) {
    try {
      const orgId = req.user?.organization_id;
      if (!orgId) {
        return res.status(400).json({ success: false, message: 'جهة المستخدم غير محددة' });
      }
      const items = await DocumentShareService.getSharedWithOrganization(orgId);
      return res.json({ success: true, data: items });
    } catch (error) {
      console.error('DocumentShareController.getSharedWithMe', error);
      return res.status(500).json({ success: false, message: 'تعذر الجلب' });
    }
  }

  static async create(req, res) {
    try {
      const { document_id, shared_with_organization_id, permission } = req.body;
      if (!document_id || !shared_with_organization_id) {
        return res.status(400).json({
          success: false,
          message: 'document_id و shared_with_organization_id مطلوبان',
        });
      }
      const created = await DocumentShareService.share(
        { document_id, shared_with_organization_id, permission },
        req.user?.id,
      );
      return res.status(201).json({
        success: true,
        message: 'تمت المشاركة',
        data: created,
      });
    } catch (error) {
      console.error('DocumentShareController.create', error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'تعذر المشاركة',
      });
    }
  }

  static async revoke(req, res) {
    try {
      const { reason } = req.body;
      const updated = await DocumentShareService.revoke(
        req.params.id, reason, req.user?.id,
      );
      if (!updated) return res.status(404).json({ success: false, message: 'غير موجود' });
      return res.json({ success: true, message: 'تم الإلغاء', data: updated });
    } catch (error) {
      console.error('DocumentShareController.revoke', error);
      return res.status(500).json({ success: false, message: 'تعذر الإلغاء' });
    }
  }

  static async delete(req, res) {
    try {
      const ok = await DocumentShareService.delete(req.params.id);
      if (!ok) return res.status(404).json({ success: false, message: 'غير موجود' });
      return res.json({ success: true, message: 'تم الحذف' });
    } catch (error) {
      console.error('DocumentShareController.delete', error);
      return res.status(500).json({ success: false, message: 'تعذر الحذف' });
    }
  }
}

module.exports = DocumentShareController;