// controllers/ExportController.js
const ExportService = require('../services/ExportService');
const ExcelService = require('../services/ExcelService');
const PdfService = require('../services/PDFService');

class ExportController {
  // ══════════════════════════════════════════════
  // الحالات — PDF
  // ══════════════════════════════════════════════
  static async exportCasesPdf(req, res) {
    try {
      const organizationId = req.user?.organization_id;
      const { from_date, to_date } = req.query;

      const rows = await ExportService.getCasesData({
        organizationId,
        from_date,
        to_date,
      });

      const filename = `cases_${Date.now()}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      PdfService.generateTable({
        title: 'تقرير الحالات',
        columns: ExportService.getCasesColumns(),
        rows,
        metadata: {
          user: req.user?.full_name,
          generated_at: new Date().toISOString().split('T')[0],
        },
        stream: res,
      });
    } catch (error) {
      console.error('ExportController.exportCasesPdf', error);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'تعذر التصدير' });
      }
    }
  }

  // ══════════════════════════════════════════════
  // الحالات — Excel
  // ══════════════════════════════════════════════
  static async exportCasesExcel(req, res) {
    try {
      const organizationId = req.user?.organization_id;
      const { from_date, to_date } = req.query;

      const rows = await ExportService.getCasesData({
        organizationId,
        from_date,
        to_date,
      });

      const filename = `cases_${Date.now()}.xlsx`;
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      await ExcelService.generate({
        title: 'تقرير الحالات',
        columns: ExportService.getCasesColumns(),
        rows,
        metadata: {
          user: req.user?.full_name,
          generated_at: new Date().toISOString().split('T')[0],
        },
        stream: res,
      });
    } catch (error) {
      console.error('ExportController.exportCasesExcel', error);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'تعذر التصدير' });
      }
    }
  }

  // ══════════════════════════════════════════════
  // الجثامين — PDF
  // ══════════════════════════════════════════════
  static async exportBodyCasesPdf(req, res) {
    try {
      const organizationId = req.user?.organization_id;
      const { from_date, to_date } = req.query;

      const rows = await ExportService.getBodyCasesData({
        organizationId,
        from_date,
        to_date,
      });

      const filename = `body_cases_${Date.now()}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      PdfService.generateTable({
        title: 'تقرير الجثامين',
        columns: ExportService.getBodyCasesColumns(),
        rows,
        metadata: {
          user: req.user?.full_name,
          generated_at: new Date().toISOString().split('T')[0],
        },
        stream: res,
      });
    } catch (error) {
      console.error('ExportController.exportBodyCasesPdf', error);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'تعذر التصدير' });
      }
    }
  }

  // ══════════════════════════════════════════════
  // الجثامين — Excel
  // ══════════════════════════════════════════════
  static async exportBodyCasesExcel(req, res) {
    try {
      const organizationId = req.user?.organization_id;
      const { from_date, to_date } = req.query;

      const rows = await ExportService.getBodyCasesData({
        organizationId,
        from_date,
        to_date,
      });

      const filename = `body_cases_${Date.now()}.xlsx`;
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      await ExcelService.generate({
        title: 'تقرير الجثامين',
        columns: ExportService.getBodyCasesColumns(),
        rows,
        metadata: {
          user: req.user?.full_name,
          generated_at: new Date().toISOString().split('T')[0],
        },
        stream: res,
      });
    } catch (error) {
      console.error('ExportController.exportBodyCasesExcel', error);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'تعذر التصدير' });
      }
    }
  }

  // ══════════════════════════════════════════════
  // الوفيات — PDF
  // ══════════════════════════════════════════════
  static async exportDeathsPdf(req, res) {
    try {
      const organizationId = req.user?.organization_id;
      const { from_date, to_date } = req.query;

      const rows = await ExportService.getDeathsData({
        organizationId,
        from_date,
        to_date,
      }); 

      const filename = `deaths_${Date.now()}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      PdfService.generateTable({
        title: 'تقرير الوفيات',
        columns: ExportService.getDeathsColumns(),
        rows,
        metadata: {
          user: req.user?.full_name,
          generated_at: new Date().toISOString().split('T')[0],
        },
        stream: res,
      });
    } catch (error) {
      console.error('ExportController.exportDeathsPdf', error);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'تعذر التصدير' });
      }
    }
  }

  // ══════════════════════════════════════════════
  // الوفيات — Excel
  // ══════════════════════════════════════════════
  static async exportDeathsExcel(req, res) {
    try {
      const organizationId = req.user?.organization_id;
      const { from_date, to_date } = req.query;

      const rows = await ExportService.getDeathsData({
        organizationId,
        from_date,
        to_date,
      });

      const filename = `deaths_${Date.now()}.xlsx`;
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      await ExcelService.generate({
        title: 'تقرير الوفيات',
        columns: ExportService.getDeathsColumns(),
        rows,
        metadata: {
          user: req.user?.full_name,
          generated_at: new Date().toISOString().split('T')[0],
        },
        stream: res,
      });
    } catch (error) {
      console.error('ExportController.exportDeathsExcel', error);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'تعذر التصدير' });
      }
    }
  }

  // ══════════════════════════════════════════════
  // التصاريح — PDF
  // ══════════════════════════════════════════════
  static async exportAuthorizationsPdf(req, res) {
    try {
      const organizationId = req.user?.organization_id;
      const { from_date, to_date } = req.query;

      const rows = await ExportService.getAuthorizationsData({
        organizationId,
        from_date,
        to_date,
      });

      const filename = `authorizations_${Date.now()}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      PdfService.generateTable({
        title: 'تقرير التصاريح',
        columns: ExportService.getAuthorizationsColumns(),
        rows,
        metadata: {
          user: req.user?.full_name,
          generated_at: new Date().toISOString().split('T')[0],
        },
        stream: res,
      });
    } catch (error) {
      console.error('ExportController.exportAuthorizationsPdf', error);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'تعذر التصدير' });
      }
    }
  }

  // ══════════════════════════════════════════════
  // التصاريح — Excel
  // ══════════════════════════════════════════════
  static async exportAuthorizationsExcel(req, res) {
    try {
      const organizationId = req.user?.organization_id;
      const { from_date, to_date } = req.query;

      const rows = await ExportService.getAuthorizationsData({
        organizationId,
        from_date,
        to_date,
      });

      const filename = `authorizations_${Date.now()}.xlsx`;
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      await ExcelService.generate({
        title: 'تقرير التصاريح',
        columns: ExportService.getAuthorizationsColumns(),
        rows,
        metadata: {
          user: req.user?.full_name,
          generated_at: new Date().toISOString().split('T')[0],
        },
        stream: res,
      });
    } catch (error) {
      console.error('ExportController.exportAuthorizationsExcel', error);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'تعذر التصدير' });
      }
    }
  }
}

module.exports = ExportController;