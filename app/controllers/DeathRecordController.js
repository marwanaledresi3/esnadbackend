// controllers/DeathRecordController.js
const DeathRecordService = require('../services/DeathRecordService');

class DeathRecordController {
  static async getAll(req, res) {
    try {
      const {
        case_id, hospital_id, cause_status,
        from_date, to_date, search, limit, offset,
      } = req.query;

      const items = await DeathRecordService.list({
        case_id,
        hospital_id,
        cause_status,
        from_date,
        to_date,
        search,
        limit: limit ? Number(limit) : 100,
        offset: offset ? Number(offset) : 0,
      });

      return res.json({
        success: true,
        message: 'سجلات الوفيات',
        data: items,
      });
    } catch (error) {
      console.error('DeathRecordController.getAll', error);
      return res.status(500).json({
        success: false,
        message: 'تعذر جلب السجلات',
      });
    }
  }

  static async getById(req, res) {
    try {
      const item = await DeathRecordService.getById(req.params.id);
      if (!item) return res.status(404).json({ success: false, message: 'السجل غير موجود' });
      return res.json({ success: true, data: item });
    } catch (error) {
      console.error('DeathRecordController.getById', error);
      return res.status(500).json({ success: false, message: 'تعذر الجلب' });
    }
  }

  static async create(req, res) {
    try {
      const {
        case_id, event_id, death_datetime, death_location,
        death_context, cause_status, notes,
        hospital_id, death_type,
      } = req.body;

      if (!case_id || !death_datetime) {
        return res.status(400).json({
          success: false,
          message: 'case_id و death_datetime مطلوبان',
        });
      }

      const created = await DeathRecordService.create(
        {
          case_id, event_id, death_datetime, death_location,
          death_context, cause_status, notes,
          hospital_id, death_type,
        },
        req.user?.id,
      );

      return res.status(201).json({
        success: true,
        message: 'تم تسجيل الوفاة',
        data: created,
      });
    } catch (error) {
      console.error('DeathRecordController.create', error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'تعذر التسجيل',
      });
    }
  }

  static async update(req, res) {
    try {
      const updated = await DeathRecordService.update(
        req.params.id,
        req.body,
        req.user?.id,
      );
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'السجل غير موجود أو لا توجد حقول للتحديث',
        });
      }
      return res.json({
        success: true,
        message: 'تم التحديث',
        data: updated,
      });
    } catch (error) {
      console.error('DeathRecordController.update', error);
      return res.status(500).json({ success: false, message: 'تعذر التحديث' });
    }
  }

  static async delete(req, res) {
    try {
      const ok = await DeathRecordService.delete(req.params.id, req.user?.id);
      if (!ok) return res.status(404).json({ success: false, message: 'السجل غير موجود' });
      return res.json({ success: true, message: 'تم الحذف' });
    } catch (error) {
      console.error('DeathRecordController.delete', error);
      return res.status(500).json({ success: false, message: 'تعذر الحذف' });
    }
  }

  static async count(req, res) {
    try {
      const total = await DeathRecordService.count();
      return res.json({ success: true, data: { total } });
    } catch (error) {
      console.error('DeathRecordController.count', error);
      return res.status(500).json({ success: false, message: 'تعذر الجلب' });
    }
  }
}

module.exports = DeathRecordController;