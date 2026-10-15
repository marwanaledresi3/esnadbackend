// controllers/ReportController.js
const ReportService = require('../services/ReportService');
const PdfService = require('../services/PDFService');
class ReportController {
  // ==================== Reports ====================
  static async getAll(req, res) {
    try {
      const {
        status, report_type_id, organization_id, generated_by,
        from_date, to_date, search, limit, offset,
      } = req.query;

      const items = await ReportService.list({
        status, report_type_id, organization_id, generated_by,
        from_date, to_date, search,
        limit: limit ? Number(limit) : 100,
        offset: offset ? Number(offset) : 0,
      });

      return res.json({ success: true, message: 'قائمة التقارير', data: items });
    } catch (error) {
      console.error('ReportController.getAll', error);
      return res.status(500).json({ success: false, message: 'تعذر جلب التقارير' });
    }
  }

  static async getById(req, res) {
    try {
      const item = await ReportService.getById(req.params.id);
      if (!item) return res.status(404).json({ success: false, message: 'التقرير غير موجود' });
      return res.json({ success: true, data: item });
    } catch (error) {
      console.error('ReportController.getById', error);
      return res.status(500).json({ success: false, message: 'تعذر جلب التقرير' });
    }
  }

  static async create(req, res) {
    try {
      const {
        report_type_id, organization_id,
        period_from, period_to, notes,
      } = req.body;

      if (!report_type_id || !organization_id) {
        return res.status(400).json({
          success: false,
          message: 'report_type_id و organization_id مطلوبان',
        });
      }

      const created = await ReportService.createReport({
        report_type_id,
        organization_id,
        period_from,
        period_to,
        notes,
        user_id: req.user?.id,
      });

      return res.status(201).json({
        success: true,
        message: 'تم توليد التقرير',
        data: created,
      });
    } catch (error) {
      console.error('ReportController.create', error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'تعذر التوليد',
      });
    }
  }

  static async preview(req, res) {
    try {
      const { code } = req.params;
      const { organization_id, period_from, period_to } = req.query;

      if (!organization_id) {
        return res.status(400).json({ success: false, message: 'organization_id مطلوب' });
      }

      const data = await ReportService.generate(code, {
        organizationId: organization_id,
        periodFrom: period_from,
        periodTo: period_to,
      });

      return res.json({ success: true, data });
    } catch (error) {
      console.error('ReportController.preview', error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'تعذر التوليد',
      });
    }
  }

  static async delete(req, res) {
    try {
      const ok = await ReportService.delete(req.params.id);
      if (!ok) return res.status(404).json({ success: false, message: 'التقرير غير موجود' });
      return res.json({ success: true, message: 'تم الحذف' });
    } catch (error) {
      console.error('ReportController.delete', error);
      return res.status(500).json({ success: false, message: 'تعذر الحذف' });
    }
  }

  // ==================== Shares ====================
  static async share(req, res) {
    try {
      const { shared_with_organization_id, permission } = req.body;
      if (!shared_with_organization_id) {
        return res.status(400).json({ success: false, message: 'shared_with_organization_id مطلوب' });
      }
      const share = await ReportService.share(
        req.params.id,
        shared_with_organization_id,
        req.user?.id,
        permission || 'view',
      );
      return res.status(201).json({ success: true, message: 'تمت المشاركة', data: share });
    } catch (error) {
      console.error('ReportController.share', error);
      return res.status(500).json({ success: false, message: 'تعذر المشاركة' });
    }
  }

  static async revokeShare(req, res) {
    try {
      const updated = await ReportService.revokeShare(req.params.shareId, req.body.reason);
      if (!updated) return res.status(404).json({ success: false, message: 'المشاركة غير موجودة' });
      return res.json({ success: true, message: 'تم الإلغاء', data: updated });
    } catch (error) {
      console.error('ReportController.revokeShare', error);
      return res.status(500).json({ success: false, message: 'تعذر الإلغاء' });
    }
  }

  static async getSharedWith(req, res) {
    try {
      const items = await ReportService.getSharedWith(req.user?.organization_id);
      return res.json({ success: true, data: items });
    } catch (error) {
      console.error('ReportController.getSharedWith', error);
      return res.status(500).json({ success: false, message: 'تعذر الجلب' });
    }
  }

  // ==================== Requests ====================
  static async getAllRequests(req, res) {
    try {
      const { status, user_id, organization_id, limit, offset } = req.query;
      const items = await ReportService.listRequests({
        status, user_id, organization_id,
        limit: limit ? Number(limit) : 100,
        offset: offset ? Number(offset) : 0,
      });
      return res.json({ success: true, data: items });
    } catch (error) {
      console.error('ReportController.getAllRequests', error);
      return res.status(500).json({ success: false, message: 'تعذر الجلب' });
    }
  }

  static async createRequest(req, res) {
    try {
      const { report_type_id, organization_id, period_from, period_to, filters } = req.body;
      if (!report_type_id || !organization_id) {
        return res.status(400).json({ success: false, message: 'report_type_id و organization_id مطلوبان' });
      }
      const created = await ReportService.createRequest(
        { report_type_id, organization_id, period_from, period_to, filters },
        req.user?.id,
      );
      return res.status(201).json({ success: true, message: 'تم إنشاء الطلب', data: created });
    } catch (error) {
      console.error('ReportController.createRequest', error);
      return res.status(500).json({ success: false, message: 'تعذر الإنشاء' });
    }
  }

  static async updateRequestStatus(req, res) {
    try {
      const { status } = req.body;
      const updated = await ReportService.updateRequestStatus(req.params.id, status);
      if (!updated) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
      return res.json({ success: true, data: updated });
    } catch (error) {
      console.error('ReportController.updateRequestStatus', error);
      return res.status(500).json({ success: false, message: 'تعذر التحديث' });
    }
  }

  static async deleteRequest(req, res) {
    try {
      const ok = await ReportService.deleteRequest(req.params.id);
      if (!ok) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
      return res.json({ success: true, message: 'تم الحذف' });
    } catch (error) {
      console.error('ReportController.deleteRequest', error);
      return res.status(500).json({ success: false, message: 'تعذر الحذف' });
    }
  }
  static async exportPdf(req, res) {
  try {
    const report = await ReportService.getById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'التقرير غير موجود' });
    }

    // اجلب البيانات مرة أخرى من report_type
    const reportType = await db.query(
      `SELECT code FROM report_types WHERE id = $1`,
      [report.report_type_id],
    );

    if (reportType.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'نوع التقرير غير معروف' });
    }

    const data = await ReportService.generate(reportType.rows[0].code, {
      organizationId: report.organization_id,
      periodFrom: report.period_from,
      periodTo: report.period_to,
    });

    const fullReport = { ...report, data };

    // اسم الملف
    const filename = `${report.report_number}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // ولّد PDF
    PdfService.generateReport(fullReport, res);
  } catch (error) {
    console.error('ReportController.exportPdf', error);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: 'تعذر التصدير' });
    }
  }
}
}

module.exports = ReportController;