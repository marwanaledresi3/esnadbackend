// controllers/AmbulanceController.js
const AmbulanceService = require('../services/AmbulanceService');

class AmbulanceController {
  static async getAll(req, res) {
    try {
      const { status, organization_id, search, limit, offset } = req.query;
      const items = await AmbulanceService.list({
        status,
        organization_id,
        search,
        limit: limit ? Number(limit) : 200,
        offset: offset ? Number(offset) : 0,
      });
      return res.json({ success: true, message: 'قائمة السيارات', data: items });
    } catch (error) {
      console.error('AmbulanceController.getAll', error);
      return res.status(500).json({ success: false, message: 'تعذر جلب السيارات' });
    }
  }

  static async getById(req, res) {
    try {
      const item = await AmbulanceService.getById(req.params.id);
      if (!item) return res.status(404).json({ success: false, message: 'السيارة غير موجودة' });
      return res.json({ success: true, data: item });
    } catch (error) {
      console.error('AmbulanceController.getById', error);
      return res.status(500).json({ success: false, message: 'تعذر جلب السيارة' });
    }
  }

  static async create(req, res) {
    try {
      const { organization_id, vehicle_code, vehicle_type, status, notes } = req.body;

      if (!organization_id || !vehicle_code) {
        return res.status(400).json({
          success: false,
          message: 'organization_id و vehicle_code مطلوبان',
        });
      }

      const created = await AmbulanceService.create({
        organization_id,
        vehicle_code,
        vehicle_type,
        status,
        notes,
      });

      return res.status(201).json({
        success: true,
        message: 'تم إضافة السيارة',
        data: created,
      });
    } catch (error) {
      console.error('AmbulanceController.create', error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'تعذر الإضافة',
      });
    }
  }

  static async update(req, res) {
    try {
      const updated = await AmbulanceService.update(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'السيارة غير موجودة أو لا توجد حقول للتحديث',
        });
      }
      return res.json({ success: true, message: 'تم التحديث', data: updated });
    } catch (error) {
      console.error('AmbulanceController.update', error);
      return res.status(500).json({ success: false, message: 'تعذر التحديث' });
    }
  }

  static async changeStatus(req, res) {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ success: false, message: 'status مطلوب' });
      }
      const updated = await AmbulanceService.changeStatus(req.params.id, status);
      if (!updated) return res.status(404).json({ success: false, message: 'السيارة غير موجودة' });
      return res.json({ success: true, data: updated });
    } catch (error) {
      console.error('AmbulanceController.changeStatus', error);
      return res.status(500).json({ success: false, message: 'تعذر التحديث' });
    }
  }

  static async delete(req, res) {
    try {
      const ok = await AmbulanceService.delete(req.params.id);
      if (!ok) return res.status(404).json({ success: false, message: 'السيارة غير موجودة' });
      return res.json({ success: true, message: 'تم الحذف' });
    } catch (error) {
      console.error('AmbulanceController.delete', error);
      return res.status(500).json({ success: false, message: 'تعذر الحذف' });
    }
  }

  static async count(req, res) {
    try {
      const total = await AmbulanceService.count();
      return res.json({ success: true, data: { total } });
    } catch (error) {
      console.error('AmbulanceController.count', error);
      return res.status(500).json({ success: false, message: 'تعذر الجلب' });
    }
  }
}

module.exports = AmbulanceController;