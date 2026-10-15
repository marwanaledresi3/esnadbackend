// controllers/ForensicRequestController.js
const ForensicRequestService = require('../services/ForensicRequestService');
const ForensicExamination = require('../models/ForensicExamination');
class ForensicRequestController {
  static async getAll(req, res) {
    try {
      const { status, body_case_id, requested_by, hospital_id, from_date, to_date, limit, offset } = req.query;
      const items = await ForensicRequestService.list({
        status, body_case_id, requested_by, hospital_id, from_date, to_date,
        limit: limit ? Number(limit) : 100,
        offset: offset ? Number(offset) : 0,
      });
      return res.json({ success: true, message: 'قائمة طلبات الفحص الشرعي', data: items });
    } catch (error) {
      console.error('ForensicRequestController.getAll', error);
      return res.status(500).json({ success: false, message: 'تعذر جلب الطلبات' });
    }
  }

  static async getById(req, res) {
    try {
      const item = await ForensicRequestService.getById(req.params.id);
      if (!item) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
      return res.json({ success: true, data: item });
    } catch (error) {
      console.error('ForensicRequestController.getById', error);
      return res.status(500).json({ success: false, message: 'تعذر جلب الطلب' });
    }
  }

  static async create(req, res) {
    try {
      const { body_case_id, reason, authorization_id, hospital_id, notes } = req.body;
      if (!body_case_id) {
        return res.status(400).json({ success: false, message: 'body_case_id مطلوب' });
      }
      const created = await ForensicRequestService.create(
        { body_case_id, reason, authorization_id, hospital_id, notes },
        req.user?.id,
      );
      return res.status(201).json({ success: true, message: 'تم إنشاء طلب الفحص', data: created });
    } catch (error) {
      console.error('ForensicRequestController.create', error);
      return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'تعذر إنشاء الطلب' });
    }
  }

  static async update(req, res) {
    try {
      const updated = await ForensicRequestService.update(req.params.id, req.body);
      if (!updated) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
      return res.json({ success: true, message: 'تم التحديث', data: updated });
    } catch (error) {
      console.error('ForensicRequestController.update', error);
      return res.status(500).json({ success: false, message: 'تعذر التحديث' });
    }
  }

  static async changeStatus(req, res) {
    try {
      const { status } = req.body;
      if (!status) return res.status(400).json({ success: false, message: 'status مطلوب' });
      const updated = await ForensicRequestService.changeStatus(req.params.id, status);
      if (!updated) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
      return res.json({ success: true, data: updated });
    } catch (error) {
      console.error('ForensicRequestController.changeStatus', error);
      return res.status(500).json({ success: false, message: 'تعذر التحديث' });
    }
  }

  static async authorize(req, res) {
    try {
      const { authorization_id } = req.body;
      if (!authorization_id) return res.status(400).json({ success: false, message: 'authorization_id مطلوب' });
      const updated = await ForensicRequestService.authorize(req.params.id, authorization_id);
      if (!updated) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
      return res.json({ success: true, message: 'تم التصريح', data: updated });
    } catch (error) {
      console.error('ForensicRequestController.authorize', error);
      return res.status(500).json({ success: false, message: 'تعذر التصريح' });
    }
  }

  static async complete(req, res) {
    try {
      const { report_document_id } = req.body;
      const updated = await ForensicRequestService.complete(req.params.id, report_document_id);
      if (!updated) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
      return res.json({ success: true, message: 'تم إكمال الفحص', data: updated });
    } catch (error) {
      console.error('ForensicRequestController.complete', error);
      return res.status(500).json({ success: false, message: 'تعذر الإكمال' });
    }
  }

  static async delete(req, res) {
    try {
      const ok = await ForensicRequestService.delete(req.params.id);
      if (!ok) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
      return res.json({ success: true, message: 'تم الحذف' });
    } catch (error) {
      console.error('ForensicRequestController.delete', error);
      return res.status(500).json({ success: false, message: 'تعذر الحذف' });
    }
  }

  static async addExamination(req, res) {
    try {
      const created = await ForensicRequestService.addExamination({
        forensic_request_id: req.params.id,
        ...req.body,
      });
      return res.status(201).json({ success: true, data: created });
    } catch (error) {
      console.error('ForensicRequestController.addExamination', error);
      return res.status(500).json({ success: false, message: 'تعذر الإضافة' });
    }
  }
  
  static async getExaminations(req, res) {
    try {
      const items = await ForensicExamination.getByRequestId(req.params.id);
      return res.json({ success: true, data: items });
    } catch (error) {
      console.error('getExaminations', error);
      return res.status(500).json({ success: false, message: 'تعذر جلب الفحوصات' });
    }
  }

  static async addExamination(req, res) {
    try {
      const created = await ForensicExamination.create({
        forensic_request_id: req.params.id,
        started_at: req.body.started_at,
        completed_at: req.body.completed_at,
        examiner: req.body.examiner,
        result_status: req.body.result_status,
        report_document_id: req.body.report_document_id,
        notes: req.body.notes,
        hospital_id: req.body.hospital_id || req.user?.organization_id,
      });

      // (اختياري) تحديث حالة الطلب إلى 'in_progress' أو 'completed' تلقائياً
      if (created.completed_at) {
        // يمكننا تحديث الطلب إلى completed إذا كانت هذه آخر examination
      }

      return res.status(201).json({
        success: true,
        message: 'تم إضافة الفحص',
        data: created,
      });
    } catch (error) {
      console.error('addExamination', error);
      return res.status(500).json({ success: false, message: 'تعذر الإضافة' });
    }
  }

  static async updateExamination(req, res) {
    try {
      const updated = await ForensicExamination.update(req.params.examId, req.body);
      if (!updated) {
        return res.status(404).json({ success: false, message: 'الفحص غير موجود' });
      }
      return res.json({
        success: true,
        message: 'تم التحديث',
        data: updated,
      });
    } catch (error) {
      console.error('updateExamination', error);
      return res.status(500).json({ success: false, message: 'تعذر التحديث' });
    }
  }

  static async deleteExamination(req, res) {
    try {
      const ok = await ForensicExamination.delete(req.params.examId);
      if (!ok) {
        return res.status(404).json({ success: false, message: 'الفحص غير موجود' });
      }
      return res.json({ success: true, message: 'تم الحذف' });
    } catch (error) {
      console.error('deleteExamination', error);
      return res.status(500).json({ success: false, message: 'تعذر الحذف' });
    }
  }
}

module.exports = ForensicRequestController;