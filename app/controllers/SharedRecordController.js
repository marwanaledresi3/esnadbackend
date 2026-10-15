// controllers/SharedRecordController.js
const SharedRecordService = require('../services/SharedRecordService');

class SharedRecordController {
  static async getAll(req, res) {
    try {
      const {
        case_id, shared_with_organization_id,
        shared_by_user_id, status, limit, offset,
      } = req.query;

      const items = await SharedRecordService.list({
        case_id,
        shared_with_organization_id,
        shared_by_user_id,
        status,
        limit: limit ? Number(limit) : 100,
        offset: offset ? Number(offset) : 0,
      });

      return res.json({ success: true, data: items });
    } catch (error) {
      console.error('SharedRecordController.getAll', error);
      return res.status(500).json({ success: false, message: 'تعذر الجلب' });
    }
  }

  static async getById(req, res) {
    try {
      const item = await SharedRecordService.getById(req.params.id);
      if (!item) return res.status(404).json({ success: false, message: 'غير موجود' });
      return res.json({ success: true, data: item });
    } catch (error) {
      console.error('SharedRecordController.getById', error);
      return res.status(500).json({ success: false, message: 'تعذر الجلب' });
    }
  }

  static async getSharedWithMe(req, res) {
    try {
      const orgId = req.user?.organization_id;
      if (!orgId) {
        return res.status(400).json({ success: false, message: 'جهة المستخدم غير محددة' });
      }
      const items = await SharedRecordService.getSharedWithOrganization(orgId);
      return res.json({ success: true, data: items });
    } catch (error) {
      console.error('SharedRecordController.getSharedWithMe', error);
      return res.status(500).json({ success: false, message: 'تعذر الجلب' });
    }
  }

  static async create(req, res) {
    try {
      const { case_id, shared_with_organization_id } = req.body;
      if (!case_id || !shared_with_organization_id) {
        return res.status(400).json({
          success: false,
          message: 'case_id و shared_with_organization_id مطلوبان',
        });
      }
      const created = await SharedRecordService.share(
        { case_id, shared_with_organization_id },
        req.user?.id,
      );
      return res.status(201).json({
        success: true,
        message: 'تمت المشاركة',
        data: created,
      });
    } catch (error) {
      console.error('SharedRecordController.create', error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'تعذر المشاركة',
      });
    }
  }

  static async revoke(req, res) {
    try {
      const { reason } = req.body;
      const updated = await SharedRecordService.revoke(
        req.params.id, reason, req.user?.id,
      );
      if (!updated) return res.status(404).json({ success: false, message: 'غير موجود' });
      return res.json({ success: true, message: 'تم الإلغاء', data: updated });
    } catch (error) {
      console.error('SharedRecordController.revoke', error);
      return res.status(500).json({ success: false, message: 'تعذر الإلغاء' });
    }
  }

  static async delete(req, res) {
    try {
      const ok = await SharedRecordService.delete(req.params.id);
      if (!ok) return res.status(404).json({ success: false, message: 'غير موجود' });
      return res.json({ success: true, message: 'تم الحذف' });
    } catch (error) {
      console.error('SharedRecordController.delete', error);
      return res.status(500).json({ success: false, message: 'تعذر الحذف' });
    }
  }
}

module.exports = SharedRecordController;