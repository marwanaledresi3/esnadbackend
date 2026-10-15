// controllers/CaseDisabilityController.js
const CaseDisability = require('../models/CaseDisability');
const Case = require('../models/Case');

class CaseDisabilityController {
  /**
   * GET /cases/:caseId/disabilities
   * جلب إعاقات حالة معيّنة
   */
  static async getByCaseId(req, res) {
    try {
      const { caseId } = req.params;
      const items = await CaseDisability.getByCaseId(caseId);
      return res.json({ success: true, data: items });
    } catch (error) {
      console.error('CaseDisabilityController.getByCaseId', error);
      return res.status(500).json({
        success: false,
        message: 'تعذر جلب الإعاقات',
      });
    }
  }

  /**
   * POST /cases/:caseId/disabilities
   * إضافة إعاقة جديدة
   */
  static async create(req, res) {
    try {
      const { caseId } = req.params;
      const { disability_type_id, severity, diagnosed_at, notes } = req.body;

      if (!disability_type_id) {
        return res.status(400).json({
          success: false,
          message: 'disability_type_id مطلوب',
        });
      }

      // تحقق من الحالة
      const caseItem = await Case.getById(caseId);
      if (!caseItem) {
        return res.status(404).json({
          success: false,
          message: 'الحالة غير موجودة',
        });
      }

      const created = await CaseDisability.create({
        case_id: caseId,
        disability_type_id,
        severity,
        diagnosed_at,
        notes,
      });

      return res.status(201).json({
        success: true,
        message: 'تمت إضافة الإعاقة',
        data: created,
      });
    } catch (error) {
      console.error('CaseDisabilityController.create', error);
      return res.status(500).json({
        success: false,
        message: 'تعذر الإضافة',
      });
    }
  }

  /**
   * PUT /case-disabilities/:id
   */
  static async update(req, res) {
    try {
      const updated = await CaseDisability.update(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'الإعاقة غير موجودة',
        });
      }
      return res.json({ success: true, message: 'تم التحديث', data: updated });
    } catch (error) {
      console.error('CaseDisabilityController.update', error);
      return res.status(500).json({ success: false, message: 'تعذر التحديث' });
    }
  }

  /**
   * DELETE /case-disabilities/:id
   */
  static async delete(req, res) {
    try {
      const ok = await CaseDisability.delete(req.params.id);
      if (!ok) {
        return res.status(404).json({
          success: false,
          message: 'الإعاقة غير موجودة',
        });
      }
      return res.json({ success: true, message: 'تم الحذف' });
    } catch (error) {
      console.error('CaseDisabilityController.delete', error);
      return res.status(500).json({ success: false, message: 'تعذر الحذف' });
    }
  }

  /**
   * GET /case-disabilities/stats
   */
  static async getStats(req, res) {
    try {
      const stats = await CaseDisability.getStats();
      return res.json({ success: true, data: stats });
    } catch (error) {
      console.error('CaseDisabilityController.getStats', error);
      return res.status(500).json({ success: false, message: 'تعذر الجلب' });
    }
  }
}

module.exports = CaseDisabilityController;