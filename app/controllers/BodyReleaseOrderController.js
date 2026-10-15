// controllers/BodyReleaseOrderController.js
const BodyReleaseOrderService = require('../services/BodyReleaseOrderService');

class BodyReleaseOrderController {
  static async getAll(req, res) {
    try {
      const { status, body_case_id, hospital_id, from_date, to_date, limit, offset } = req.query;
      const items = await BodyReleaseOrderService.list({
        status, body_case_id, hospital_id, from_date, to_date,
        limit: limit ? Number(limit) : 100,
        offset: offset ? Number(offset) : 0,
      });
      return res.json({ success: true, message: 'قائمة أوامر التسليم', data: items });
    } catch (error) {
      console.error('BodyReleaseOrderController.getAll', error);
      return res.status(500).json({ success: false, message: 'تعذر جلب الأوامر' });
    }
  }

  static async getById(req, res) {
    try {
      const item = await BodyReleaseOrderService.getById(req.params.id);
      if (!item) return res.status(404).json({ success: false, message: 'الأمر غير موجود' });
      return res.json({ success: true, data: item });
    } catch (error) {
      console.error('BodyReleaseOrderController.getById', error);
      return res.status(500).json({ success: false, message: 'تعذر جلب الأمر' });
    }
  }

  static async create(req, res) {
    try {
      const {
        body_case_id, hospital_id, recipient_name, recipient_id_number,
        relationship_to_deceased, identity_verified, verification_method,
        authorization_id, notes,
      } = req.body;

      if (!body_case_id || !hospital_id || !recipient_name || !recipient_id_number) {
        return res.status(400).json({
          success: false,
          message: 'body_case_id و hospital_id و recipient_name و recipient_id_number مطلوبة',
        });
      }

      const created = await BodyReleaseOrderService.create(
        {
          body_case_id, hospital_id, recipient_name, recipient_id_number,
          relationship_to_deceased, identity_verified, verification_method,
          authorization_id, notes,
        },
        req.user?.id,
      );

      return res.status(201).json({ success: true, message: 'تم إصدار الأمر', data: created });
    } catch (error) {
      console.error('BodyReleaseOrderController.create', error);
      return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'تعذر الإصدار' });
    }
  }

  static async execute(req, res) {
    try {
      const updated = await BodyReleaseOrderService.execute(req.params.id);
      if (!updated) return res.status(404).json({ success: false, message: 'الأمر غير موجود' });
      return res.json({ success: true, message: 'تم التنفيذ', data: updated });
    } catch (error) {
      console.error('BodyReleaseOrderController.execute', error);
      return res.status(500).json({ success: false, message: 'تعذر التنفيذ' });
    }
  }

  static async delete(req, res) {
    try {
      const ok = await BodyReleaseOrderService.delete(req.params.id);
      if (!ok) return res.status(404).json({ success: false, message: 'الأمر غير موجود' });
      return res.json({ success: true, message: 'تم الحذف' });
    } catch (error) {
      console.error('BodyReleaseOrderController.delete', error);
      return res.status(500).json({ success: false, message: 'تعذر الحذف' });
    }
  }
}

module.exports = BodyReleaseOrderController;