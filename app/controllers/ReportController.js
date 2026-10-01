const { pool } = require('../config/db');
const PDFService = require('../services/PDFService');
const apiResponse = require('../utils/apiResponse');
const ApiError = require('../errors/ApiError');

class ReportController {
  // 1. استخراج وتحميل إذن تسليم PDF
  static async downloadHandoverPermit(req, res, next) {
    try {
      const { caseId } = req.params;

      const query = `
        SELECT h.*, c.case_number, p.full_name, u.full_name AS officer_name
        FROM handovers h
        JOIN cases c ON h.case_id = c.case_id
        JOIN persons p ON c.person_id = p.person_id
        LEFT JOIN users u ON h.handed_over_by_user_id = u.user_id
        WHERE h.case_id = $1
        ORDER BY h.created_at DESC LIMIT 1
      `;
      const result = await pool.query(query, [caseId]);

      if (result.rows.length === 0) {
        throw ApiError.notFound('لا يوجد محضر تسليم صادِر لهذه الحالة لطباعة الإذن');
      }

      const pdfBuffer = await PDFService.generateHandoverPermit(result.rows[0]);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=Handover-Permit-${caseId}.pdf`);
      return res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  }

  // 2. إحصائيات عامة ولوحة البيانات (Dashboard Overview)
  static async getDashboardStats(req, res, next) {
    try {
      const statsQuery = `
        SELECT
          (SELECT COUNT(*) FROM cases) AS total_cases,
          (SELECT COUNT(*) FROM cases WHERE current_status = 'OPEN') AS open_cases,
          (SELECT COUNT(*) FROM persons WHERE identity_status = 'UNKNOWN') AS unidentified_persons,
          (SELECT COUNT(*) FROM body_cases WHERE status = 'IN_MORTUARY') AS bodies_in_mortuary,
          (SELECT COUNT(*) FROM incidents WHERE status = 'OPEN') AS active_incidents,
          (SELECT COUNT(*) FROM ambulances WHERE status = 'AVAILABLE') AS available_ambulances
      `;

      const result = await pool.query(statsQuery);
      return apiResponse.success(res, 'إحصائيات النظام العامة', result.rows[0]);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ReportController;