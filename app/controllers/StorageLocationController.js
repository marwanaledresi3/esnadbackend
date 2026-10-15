// controllers/StorageLocationController.js
const StorageLocationService = require('../services/StorageLocationService');

class StorageLocationController {
  static async getAll(req, res) {
    try {
      const { organization_id, location_type, status, search, limit, offset } = req.query;
      const items = await StorageLocationService.list({
        organization_id,
        location_type,
        status,
        search,
        limit: limit ? Number(limit) : 200,
        offset: offset ? Number(offset) : 0,
      });
      return res.json({ success: true, message: 'قائمة أماكن الحفظ', data: items });
    } catch (error) {
      console.error('StorageLocationController.getAll', error);
      return res.status(500).json({ success: false, message: 'تعذر جلب المواقع' });
    }
  }

  static async getById(req, res) {
    try {
      const item = await StorageLocationService.getById(req.params.id);
      if (!item) return res.status(404).json({ success: false, message: 'الموقع غير موجود' });
      return res.json({ success: true, data: item });
    } catch (error) {
      console.error('StorageLocationController.getById', error);
      return res.status(500).json({ success: false, message: 'تعذر جلب الموقع' });
    }
  }

  static async create(req, res) {
    try {
      const created = await StorageLocationService.create(req.body);
      return res.status(201).json({
        success: true,
        message: 'تم إضافة الموقع',
        data: created,
      });
    } catch (error) {
      console.error('StorageLocationController.create', error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'تعذر الإضافة',
      });
    }
  }

  static async update(req, res) {
    try {
      const updated = await StorageLocationService.update(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'الموقع غير موجود أو لا توجد حقول للتحديث',
        });
      }
      return res.json({ success: true, message: 'تم التحديث', data: updated });
    } catch (error) {
      console.error('StorageLocationController.update', error);
      return res.status(500).json({ success: false, message: 'تعذر التحديث' });
    }
  }

  static async changeStatus(req, res) {
    try {
      const { status } = req.body;
      if (!status) return res.status(400).json({ success: false, message: 'status مطلوب' });
      const updated = await StorageLocationService.changeStatus(req.params.id, status);
      if (!updated) return res.status(404).json({ success: false, message: 'الموقع غير موجود' });
      return res.json({ success: true, data: updated });
    } catch (error) {
      console.error('StorageLocationController.changeStatus', error);
      return res.status(500).json({ success: false, message: 'تعذر التحديث' });
    }
  }

  static async delete(req, res) {
    try {
      const ok = await StorageLocationService.delete(req.params.id);
      if (!ok) return res.status(404).json({ success: false, message: 'الموقع غير موجود' });
      return res.json({ success: true, message: 'تم الحذف' });
    } catch (error) {
      console.error('StorageLocationController.delete', error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'تعذر الحذف',
      });
    }
  }

  static async count(req, res) {
    try {
      const total = await StorageLocationService.count();
      return res.json({ success: true, data: { total } });
    } catch (error) {
      console.error('StorageLocationController.count', error);
      return res.status(500).json({ success: false, message: 'تعذر الجلب' });
    }
  }
}

module.exports = StorageLocationController;