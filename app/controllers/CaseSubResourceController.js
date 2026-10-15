// controllers/CaseSubResourceController.js
const CaseEvent = require('../models/CaseEvent');
const Diagnosis = require('../models/Diagnosis');
const Operation = require('../models/Operation');

class CaseSubResourceController {
  // ==================== Events ====================
  static async getEvents(req, res) {
    try {
      const items = await CaseEvent.getByCaseId(req.params.caseId);
      return res.json({ success: true, data: items });
    } catch (e) {
      return res.status(500).json({ success: false, message: 'تعذر جلب الأحداث' });
    }
  }

  static async createEvent(req, res) {
    try {
      const created = await CaseEvent.create({
        case_id: req.params.caseId,
        ...req.body,
        created_by: req.user?.id,
      });
      return res.status(201).json({ success: true, data: created });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ success: false, message: 'تعذر الإنشاء' });
    }
  }

  static async deleteEvent(req, res) {
    try {
      const ok = await CaseEvent.delete(req.params.id);
      if (!ok) return res.status(404).json({ success: false, message: 'غير موجود' });
      return res.json({ success: true, message: 'تم الحذف' });
    } catch (e) {
      return res.status(500).json({ success: false, message: 'تعذر الحذف' });
    }
  }

  // ==================== Diagnoses ====================
  static async getDiagnoses(req, res) {
    try {
      const items = await Diagnosis.getByCaseId(req.params.caseId);
      return res.json({ success: true, data: items });
    } catch (e) {
      return res.status(500).json({ success: false, message: 'تعذر جلب التشخيصات' });
    }
  }

  static async createDiagnosis(req, res) {
    try {
      const created = await Diagnosis.create({
        case_id: req.params.caseId,
        ...req.body,
      });
      return res.status(201).json({ success: true, data: created });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ success: false, message: 'تعذر الإنشاء' });
    }
  }

  static async deleteDiagnosis(req, res) {
    try {
      const ok = await Diagnosis.delete(req.params.id);
      if (!ok) return res.status(404).json({ success: false, message: 'غير موجود' });
      return res.json({ success: true, message: 'تم الحذف' });
    } catch (e) {
      return res.status(500).json({ success: false, message: 'تعذر الحذف' });
    }
  }

  // ==================== Operations ====================
  static async getOperations(req, res) {
    try {
      const items = await Operation.getByCaseId(req.params.caseId);
      return res.json({ success: true, data: items });
    } catch (e) {
      return res.status(500).json({ success: false, message: 'تعذر جلب العمليات' });
    }
  }

  static async createOperation(req, res) {
    try {
      const created = await Operation.create({
        case_id: req.params.caseId,
        ...req.body,
      });
      return res.status(201).json({ success: true, data: created });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ success: false, message: 'تعذر الإنشاء' });
    }
  }

  static async deleteOperation(req, res) {
    try {
      const ok = await Operation.delete(req.params.id);
      if (!ok) return res.status(404).json({ success: false, message: 'غير موجود' });
      return res.json({ success: true, message: 'تم الحذف' });
    } catch (e) {
      return res.status(500).json({ success: false, message: 'تعذر الحذف' });
    }
  }
}

module.exports = CaseSubResourceController;