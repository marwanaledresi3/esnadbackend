// controllers/BodyCaseController.js
const BodyCaseService = require('../services/BodyCaseService');

class BodyCaseController {
  static async getAll(req, res) {
    try {
      const {
        search, status, custody_status, forensic_status,
        handover_status, identity_status, organization_id,
        current_organization_id, storage_location_id,
        from_date, to_date, limit, offset,
      } = req.query;

      const items = await BodyCaseService.list({
        search, status, custody_status, forensic_status,
        handover_status, identity_status, organization_id,
        current_organization_id, storage_location_id,
        from_date, to_date,
        limit: limit ? Number(limit) : 100,
        offset: offset ? Number(offset) : 0,
      });

      return res.json({
        success: true,
        message: 'قائمة الجثامين',
        data: items,
      });
    } catch (error) {
      console.error('BodyCaseController.getAll', error);
      return res.status(500).json({
        success: false,
        message: 'تعذر جلب قائمة الجثامين',
      });
    }
  }

  static async getById(req, res) {
    try {
      const item = await BodyCaseService.getById(req.params.id);
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'الجثمان غير موجود',
        });
      }
      return res.json({ success: true, data: item });
    } catch (error) {
      console.error('BodyCaseController.getById', error);
      return res.status(500).json({
        success: false,
        message: 'تعذر جلب الجثمان',
      });
    }
  }

  static async create(req, res) {
    try {
      const {
        case_id, identity_status, received_at,
        received_from_organization_id, received_from_location,
        storage_location_id, custody_status, forensic_status,
        handover_status, requires_forensic_exam, notes,
        current_organization_id, current_location, status,
      } = req.body;

      if (!case_id) {
        return res.status(400).json({
          success: false,
          message: 'case_id مطلوب',
        });
      }

      const created = await BodyCaseService.create(
        {
          case_id, identity_status, received_at,
          received_from_organization_id, received_from_location,
          storage_location_id, custody_status, forensic_status,
          handover_status, requires_forensic_exam, notes,
          current_organization_id, current_location, status,
        },
        req.user?.id,
      );

      return res.status(201).json({
        success: true,
        message: 'تم تسجيل الجثمان بنجاح',
        data: created,
      });
    } catch (error) {
      console.error('BodyCaseController.create', error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'تعذر تسجيل الجثمان',
      });
    }
  }

  static async update(req, res) {
    try {
      const updated = await BodyCaseService.update(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'الجثمان غير موجود أو لا توجد حقول للتحديث',
        });
      }
      return res.json({
        success: true,
        message: 'تم تحديث بيانات الجثمان',
        data: updated,
      });
    } catch (error) {
      console.error('BodyCaseController.update', error);
      return res.status(500).json({
        success: false,
        message: 'تعذر تحديث الجثمان',
      });
    }
  }

  static async changeStatus(req, res) {
    try {
      const { status } = req.body;
      if (!status) return res.status(400).json({ success: false, message: 'status مطلوب' });
      const updated = await BodyCaseService.changeStatus(req.params.id, status);
      if (!updated) return res.status(404).json({ success: false, message: 'الجثمان غير موجود' });
      return res.json({ success: true, data: updated });
    } catch (error) {
      console.error('BodyCaseController.changeStatus', error);
      return res.status(500).json({ success: false, message: 'تعذر التحديث' });
    }
  }

  static async changeCustodyStatus(req, res) {
    try {
      const { custody_status } = req.body;
      if (!custody_status) return res.status(400).json({ success: false, message: 'custody_status مطلوب' });
      const updated = await BodyCaseService.changeCustodyStatus(req.params.id, custody_status);
      if (!updated) return res.status(404).json({ success: false, message: 'الجثمان غير موجود' });
      return res.json({ success: true, data: updated });
    } catch (error) {
      console.error('BodyCaseController.changeCustodyStatus', error);
      return res.status(500).json({ success: false, message: 'تعذر التحديث' });
    }
  }

  static async changeForensicStatus(req, res) {
    try {
      const { forensic_status } = req.body;
      if (!forensic_status) return res.status(400).json({ success: false, message: 'forensic_status مطلوب' });
      const updated = await BodyCaseService.changeForensicStatus(req.params.id, forensic_status);
      if (!updated) return res.status(404).json({ success: false, message: 'الجثمان غير موجود' });
      return res.json({ success: true, data: updated });
    } catch (error) {
      console.error('BodyCaseController.changeForensicStatus', error);
      return res.status(500).json({ success: false, message: 'تعذر التحديث' });
    }
  }

  static async changeHandoverStatus(req, res) {
    try {
      const { handover_status } = req.body;
      if (!handover_status) return res.status(400).json({ success: false, message: 'handover_status مطلوب' });
      const updated = await BodyCaseService.changeHandoverStatus(req.params.id, handover_status);
      if (!updated) return res.status(404).json({ success: false, message: 'الجثمان غير موجود' });
      return res.json({ success: true, data: updated });
    } catch (error) {
      console.error('BodyCaseController.changeHandoverStatus', error);
      return res.status(500).json({ success: false, message: 'تعذر التحديث' });
    }
  }

  static async delete(req, res) {
    try {
      const ok = await BodyCaseService.delete(req.params.id);
      if (!ok) return res.status(404).json({ success: false, message: 'الجثمان غير موجود' });
      return res.json({ success: true, message: 'تم حذف الجثمان' });
    } catch (error) {
      console.error('BodyCaseController.delete', error);
      return res.status(500).json({ success: false, message: 'تعذر حذف الجثمان' });
    }
  }

  static async count(req, res) {
    try {
      const total = await BodyCaseService.count();
      return res.json({ success: true, data: { total } });
    } catch (error) {
      console.error('BodyCaseController.count', error);
      return res.status(500).json({ success: false, message: 'تعذر جلب الإحصائيات' });
    }
  }
}

module.exports = BodyCaseController;