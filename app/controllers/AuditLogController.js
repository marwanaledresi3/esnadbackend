// controllers/AuditLogController.js
const AuditLogService = require('../services/AuditLogService');

class AuditLogController {
  static async getAll(req, res) {
    try {
      const {
        user_id, organization_id, action, entity_type, entity_id,
        result, from_date, to_date, search, limit, offset,
      } = req.query;

      const items = await AuditLogService.list({
        user_id,
        organization_id,
        action,
        entity_type,
        entity_id,
        result,
        from_date,
        to_date,
        search,
        limit: limit ? Number(limit) : 100,
        offset: offset ? Number(offset) : 0,
      });

      return res.json({
        success: true,
        message: 'سجل التدقيق',
        data: items,
      });
    } catch (error) {
      console.error('AuditLogController.getAll', error);
      return res.status(500).json({ success: false, message: 'تعذر جلب السجل' });
    }
  }

  static async getById(req, res) {
    try {
      const item = await AuditLogService.getById(req.params.id);
      if (!item) return res.status(404).json({ success: false, message: 'السجل غير موجود' });
      return res.json({ success: true, data: item });
    } catch (error) {
      console.error('AuditLogController.getById', error);
      return res.status(500).json({ success: false, message: 'تعذر الجلب' });
    }
  }

  static async getStats(req, res) {
    try {
      const { from_date, to_date } = req.query;
      const stats = await AuditLogService.getStats({ from_date, to_date });
      return res.json({ success: true, data: stats });
    } catch (error) {
      console.error('AuditLogController.getStats', error);
      return res.status(500).json({ success: false, message: 'تعذر الجلب' });
    }
  }

  static async getDistinctActions(req, res) {
    try {
      const actions = await AuditLogService.getDistinctActions();
      return res.json({ success: true, data: actions });
    } catch (error) {
      console.error('AuditLogController.getDistinctActions', error);
      return res.status(500).json({ success: false, message: 'تعذر الجلب' });
    }
  }

  static async getDistinctEntityTypes(req, res) {
    try {
      const types = await AuditLogService.getDistinctEntityTypes();
      return res.json({ success: true, data: types });
    } catch (error) {
      console.error('AuditLogController.getDistinctEntityTypes', error);
      return res.status(500).json({ success: false, message: 'تعذر الجلب' });
    }
  }

  static async cleanup(req, res) {
    try {
      const days = Number(req.query.days) || 90;
      const count = await AuditLogService.deleteOlderThan(days);
      return res.json({
        success: true,
        message: `تم حذف ${count} سجل قديم`,
      });
    } catch (error) {
      console.error('AuditLogController.cleanup', error);
      return res.status(500).json({ success: false, message: 'تعذر الحذف' });
    }
  }
}

module.exports = AuditLogController;