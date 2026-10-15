// controllers/BodyHandoverController.js
const BodyHandoverService = require('../services/BodyHandoverService');

class BodyHandoverController {
  static async getAll(req, res) {
    try {
      const { body_case_id, authorization_id, from_date, to_date, limit, offset } = req.query;
      const items = await BodyHandoverService.list({
        body_case_id, authorization_id, from_date, to_date,
        limit: limit ? Number(limit) : 100,
        offset: offset ? Number(offset) : 0,
      });
      return res.json({ success: true, message: 'قائمة التسليمات', data: items });
    } catch (error) {
      console.error('BodyHandoverController.getAll', error);
      return res.status(500).json({ success: false, message: 'تعذر جلب التسليمات' });
    }
  }

  static async getById(req, res) {
    try {
      const item = await BodyHandoverService.getById(req.params.id);
      if (!item) return res.status(404).json({ success: false, message: 'التسليم غير موجود' });
      return res.json({ success: true, data: item });
    } catch (error) {
      console.error('BodyHandoverController.getById', error);
      return res.status(500).json({ success: false, message: 'تعذر جلب التسليم' });
    }
  }

  static async create(req, res) {
    try {
      const { body_case_id, authorization_id, recipient_name, handover_datetime } = req.body;
      if (!body_case_id || !authorization_id || !recipient_name) {
        return res.status(400).json({
          success: false,
          message: 'body_case_id و authorization_id و recipient_name مطلوبة',
        });
      }

      const created = await BodyHandoverService.create(req.body, req.user?.id);
      return res.status(201).json({ success: true, message: 'تم تسجيل التسليم', data: created });
    } catch (error) {
      console.error('BodyHandoverController.create', error);
      return res.status(500).json({ success: false, message: 'تعذر تسجيل التسليم' });
    }
  }

  static async delete(req, res) {
    try {
      const ok = await BodyHandoverService.delete(req.params.id);
      if (!ok) return res.status(404).json({ success: false, message: 'التسليم غير موجود' });
      return res.json({ success: true, message: 'تم الحذف' });
    } catch (error) {
      console.error('BodyHandoverController.delete', error);
      return res.status(500).json({ success: false, message: 'تعذر الحذف' });
    }
  }
}

module.exports = BodyHandoverController;