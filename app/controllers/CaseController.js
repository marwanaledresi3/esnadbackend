// controllers/CaseController.js
const CaseService = require('../services/CaseService');

class CaseController {
  static async getAll(req, res) {
    try {
      const {
        search,
        case_type,
        case_status,
        person_id,
        organization_id,
        source_organization_id,
        priority,
        from_date,
        to_date,
        limit,
        offset,
      } = req.query;

      const items = await CaseService.list({
        search,
        case_type,
        case_status,
        person_id,
        organization_id,
        source_organization_id,
        priority,
        from_date,
        to_date,
        limit: limit ? Number(limit) : 100,
        offset: offset ? Number(offset) : 0,
      });

      return res.json({
        success: true,
        message: 'قائمة الحالات',
        data: items,
      });
    } catch (error) {
      console.error('CaseController.getAll', error);
      return res.status(500).json({
        success: false,
        message: 'تعذر جلب قائمة الحالات',
      });
    }
  }

  static async getById(req, res) {
    try {
      const item = await CaseService.getById(req.params.id);
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'الحالة غير موجودة',
        });
      }
      return res.json({ success: true, data: item });
    } catch (error) {
      console.error('CaseController.getById', error);
      return res.status(500).json({
        success: false,
        message: 'تعذر جلب الحالة',
      });
    }
  }

  static async create(req, res) {
    try {
      const {
        person_id,
        case_type,
        case_status,
        arrival_datetime,
        source_organization_id,
        source_location,
        referral_number,
        referral_datetime,
        priority,
        department_id,
        current_location,
        notes,
        organization_id,
      } = req.body;

      if (!case_type || !organization_id) {
        return res.status(400).json({
          success: false,
          message: 'case_type و organization_id مطلوبان',
        });
      }

      const created = await CaseService.create(
        {
          person_id,
          case_type,
          case_status,
          arrival_datetime,
          source_organization_id,
          source_location,
          referral_number,
          referral_datetime,
          priority,
          department_id,
          current_location,
          notes,
          organization_id,
        },
        req.user?.id,
      );

      return res.status(201).json({
        success: true,
        message: 'تم إنشاء الحالة بنجاح',
        data: created,
      });
    } catch (error) {
      console.error('CaseController.create', error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'تعذر إنشاء الحالة',
      });
    }
  }

  static async update(req, res) {
    try {
      const updated = await CaseService.update(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'الحالة غير موجودة أو لا توجد حقول للتحديث',
        });
      }
      return res.json({
        success: true,
        message: 'تم تحديث الحالة',
        data: updated,
      });
    } catch (error) {
      console.error('CaseController.update', error);
      return res.status(500).json({
        success: false,
        message: 'تعذر تحديث الحالة',
      });
    }
  }

  static async changeStatus(req, res) {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'status مطلوب',
        });
      }
      const updated = await CaseService.changeStatus(req.params.id, status);
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'الحالة غير موجودة',
        });
      }
      return res.json({
        success: true,
        message: 'تم تحديث حالة الحالة',
        data: updated,
      });
    } catch (error) {
      console.error('CaseController.changeStatus', error);
      return res.status(500).json({
        success: false,
        message: 'تعذر تحديث الحالة',
      });
    }
  }

  static async close(req, res) {
    try {
      const updated = await CaseService.close(req.params.id);
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'الحالة غير موجودة',
        });
      }
      return res.json({
        success: true,
        message: 'تم إغلاق الحالة',
        data: updated,
      });
    } catch (error) {
      console.error('CaseController.close', error);
      return res.status(500).json({
        success: false,
        message: 'تعذر إغلاق الحالة',
      });
    }
  }

  static async delete(req, res) {
    try {
      const ok = await CaseService.delete(req.params.id);
      if (!ok) {
        return res.status(404).json({
          success: false,
          message: 'الحالة غير موجودة',
        });
      }
      return res.json({
        success: true,
        message: 'تم حذف الحالة',
      });
    } catch (error) {
      console.error('CaseController.delete', error);
      return res.status(500).json({
        success: false,
        message: 'تعذر حذف الحالة',
      });
    }
  }

  static async count(req, res) {
    try {
      const total = await CaseService.count();
      return res.json({ success: true, data: { total } });
    } catch (error) {
      console.error('CaseController.count', error);
      return res.status(500).json({
        success: false,
        message: 'تعذر جلب الإحصائيات',
      });
    }
  }
}

module.exports = CaseController;