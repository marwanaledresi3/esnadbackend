// services/ReportService.js
const {pool} = require('../config/db');
const Report = require('../models/Report');
const ReportRequest = require('../models/ReportRequest');

/**
 * مولّدات التقارير لكل نوع
 * كل مولّد يُرجع { rows, columns, summary }
 */
const generators = {
  // ==================== CASES_RECEIVED ====================
  CASES_RECEIVED: async (organizationId, periodFrom, periodTo) => {
    const { rows } = await pool.query(
      `SELECT
         c.case_number,
         c.case_type,
         c.case_status,
         c.arrival_datetime,
         c.opened_at,
         p.full_name AS person_name,
         p.person_number
       FROM cases c
       LEFT JOIN persons p ON p.id = c.person_id
       WHERE c.organization_id = $1
         AND c.opened_at BETWEEN $2 AND $3
       ORDER BY c.opened_at DESC`,
      [organizationId, periodFrom, periodTo],
    );
    return {
      summary: { total: rows.length },
      rows,
      columns: [
        { key: 'case_number', label: 'رقم الحالة' },
        { key: 'case_type', label: 'النوع' },
        { key: 'case_status', label: 'الحالة' },
        { key: 'person_name', label: 'الشخص' },
        { key: 'arrival_datetime', label: 'وقت الوصول' },
        { key: 'opened_at', label: 'وقت الفتح' },
      ],
    };
  },

  // ==================== CASES_DISCHARGED ====================
  CASES_DISCHARGED: async (organizationId, periodFrom, periodTo) => {
    const { rows } = await pool.query(
      `SELECT
         c.case_number,
         c.case_type,
         c.closed_at,
         p.full_name AS person_name
       FROM cases c
       LEFT JOIN persons p ON p.id = c.person_id
       WHERE c.organization_id = $1
         AND c.case_status = 'closed'
         AND c.closed_at BETWEEN $2 AND $3
       ORDER BY c.closed_at DESC`,
      [organizationId, periodFrom, periodTo],
    );
    return {
      summary: { total: rows.length },
      rows,
      columns: [
        { key: 'case_number', label: 'رقم الحالة' },
        { key: 'case_type', label: 'النوع' },
        { key: 'person_name', label: 'الشخص' },
        { key: 'closed_at', label: 'تاريخ الإغلاق' },
      ],
    };
  },

  // ==================== DEATHS ====================
  DEATHS: async (organizationId, periodFrom, periodTo) => {
    const { rows } = await pool.query(
      `SELECT
         c.case_number,
         p.full_name AS person_name,
         p.person_number,
         dr.death_datetime,
         dr.death_location,
         dr.death_context,
         dr.cause_status
       FROM death_records dr
       INNER JOIN cases c ON c.id = dr.case_id
       LEFT JOIN persons p ON p.id = c.person_id
       WHERE c.organization_id = $1
         AND dr.death_datetime BETWEEN $2 AND $3
       ORDER BY dr.death_datetime DESC`,
      [organizationId, periodFrom, periodTo],
    );
    return {
      summary: { total: rows.length },
      rows,
      columns: [
        { key: 'case_number', label: 'رقم الحالة' },
        { key: 'person_name', label: 'الشخص' },
        { key: 'death_datetime', label: 'وقت الوفاة' },
        { key: 'death_location', label: 'المكان' },
        { key: 'death_context', label: 'السياق' },
      ],
    };
  },

  // ==================== BODY_CASES ====================
  BODY_CASES: async (organizationId, periodFrom, periodTo) => {
    const { rows } = await pool.query(
      `SELECT
         bc.body_number,
         c.case_number,
         p.full_name AS person_name,
         bc.identity_status,
         bc.custody_status,
         bc.received_at
       FROM body_cases bc
       INNER JOIN cases c ON c.id = bc.case_id
       LEFT JOIN persons p ON p.id = c.person_id
       WHERE bc.current_organization_id = $1
         AND bc.received_at BETWEEN $2 AND $3
       ORDER BY bc.received_at DESC`,
      [organizationId, periodFrom, periodTo],
    );
    return {
      summary: { total: rows.length },
      rows,
      columns: [
        { key: 'body_number', label: 'رقم الجثمان' },
        { key: 'case_number', label: 'رقم الحالة' },
        { key: 'person_name', label: 'الشخص' },
        { key: 'identity_status', label: 'حالة الهوية' },
        { key: 'custody_status', label: 'الحيازة' },
        { key: 'received_at', label: 'وقت الاستلام' },
      ],
    };
  },

  // ==================== FORENSIC_EXAMS ====================
  FORENSIC_EXAMS: async (organizationId, periodFrom, periodTo) => {
    const { rows } = await pool.query(
      `SELECT
         fr.request_number,
         bc.body_number,
         p.full_name AS person_name,
         fr.status,
         fr.requested_at,
         fr.completed_at
       FROM forensic_requests fr
       INNER JOIN body_cases bc ON bc.id = fr.body_case_id
       INNER JOIN cases c ON c.id = bc.case_id
       LEFT JOIN persons p ON p.id = c.person_id
       WHERE fr.hospital_id = $1
         AND fr.requested_at BETWEEN $2 AND $3
       ORDER BY fr.requested_at DESC`,
      [organizationId, periodFrom, periodTo],
    );
    return {
      summary: { total: rows.length },
      rows,
      columns: [
        { key: 'request_number', label: 'رقم الطلب' },
        { key: 'body_number', label: 'رقم الجثمان' },
        { key: 'person_name', label: 'الشخص' },
        { key: 'status', label: 'الحالة' },
        { key: 'requested_at', label: 'تاريخ الطلب' },
      ],
    };
  },

  // ==================== HANDOVERS ====================
  HANDOVERS: async (organizationId, periodFrom, periodTo) => {
    const { rows } = await pool.query(
      `SELECT
         bh.id,
         bc.body_number,
         p.full_name AS person_name,
         bh.recipient_name,
         bh.recipient_id_number,
         bh.destination,
         bh.handover_datetime
       FROM body_handovers bh
       INNER JOIN body_cases bc ON bc.id = bh.body_case_id
       INNER JOIN cases c ON c.id = bc.case_id
       LEFT JOIN persons p ON p.id = c.person_id
       WHERE bc.current_organization_id = $1
         AND bh.handover_datetime BETWEEN $2 AND $3
       ORDER BY bh.handover_datetime DESC`,
      [organizationId, periodFrom, periodTo],
    );
    return {
      summary: { total: rows.length },
      rows,
      columns: [
        { key: 'body_number', label: 'رقم الجثمان' },
        { key: 'person_name', label: 'الشخص' },
        { key: 'recipient_name', label: 'المستلم' },
        { key: 'destination', label: 'الوجهة' },
        { key: 'handover_datetime', label: 'تاريخ التسليم' },
      ],
    };
  },

  // ==================== TRANSPORT ====================
  TRANSPORT: async (organizationId, periodFrom, periodTo) => {
    const { rows } = await pool.query(
      `SELECT
         tr.request_number,
         tr.transport_type,
         tr.status,
         tr.origin_location,
         tr.destination,
         tr.requested_at
       FROM transport_requests tr
       WHERE (tr.requester_organization_id = $1 OR tr.receiving_organization_id = $1)
         AND tr.requested_at BETWEEN $2 AND $3
       ORDER BY tr.requested_at DESC`,
      [organizationId, periodFrom, periodTo],
    );
    return {
      summary: { total: rows.length },
      rows,
      columns: [
        { key: 'request_number', label: 'رقم الطلب' },
        { key: 'transport_type', label: 'نوع النقل' },
        { key: 'status', label: 'الحالة' },
        { key: 'origin_location', label: 'من' },
        { key: 'destination', label: 'إلى' },
        { key: 'requested_at', label: 'تاريخ الطلب' },
      ],
    };
  },

  // ==================== ADMIN_ACTIVITY ====================
  ADMIN_ACTIVITY: async (organizationId, periodFrom, periodTo) => {
    const { rows } = await pool.query(
      `SELECT
         al.action,
         al.entity_type,
         al.entity_id,
         al.created_at,
         u.full_name AS user_name
       FROM audit_logs al
       LEFT JOIN users u ON u.id = al.user_id
       WHERE al.organization_id = $1
         AND al.created_at BETWEEN $2 AND $3
       ORDER BY al.created_at DESC
       LIMIT 500`,
      [organizationId, periodFrom, periodTo],
    );
    return {
      summary: { total: rows.length },
      rows,
      columns: [
        { key: 'action', label: 'الإجراء' },
        { key: 'entity_type', label: 'نوع الكيان' },
        { key: 'user_name', label: 'المستخدم' },
        { key: 'created_at', label: 'التاريخ' },
      ],
    };
  },
};

class ReportService {
  /**
   * توليد تقرير من نوع معيّن (يجلب البيانات)
   */
  static async generate(reportTypeCode, {
    organizationId,
    periodFrom,
    periodTo,
  }) {
    const generator = generators[reportTypeCode];
    if (!generator) {
      const err = new Error(`نوع التقرير غير مدعوم: ${reportTypeCode}`);
      err.statusCode = 400;
      throw err;
    }
    return await generator(organizationId, periodFrom, periodTo);
  }

  /**
   * إنشاء تقرير وحفظه في قاعدة البيانات
   */
  static async createReport({
    report_type_id,
    organization_id,
    period_from,
    period_to,
    user_id,
    notes,
  }) {
    // 1. اجلب كود النوع
    const { rows: typeRows } = await pool.query(
      `SELECT code, name FROM report_types WHERE id = $1`,
      [report_type_id],
    );
    if (typeRows.length === 0) {
      const err = new Error('نوع التقرير غير موجود');
      err.statusCode = 404;
      throw err;
    }

    const code = typeRows[0].code;

    // 2. ولّد البيانات
    const data = await ReportService.generate(code, {
      organizationId: organization_id,
      periodFrom: period_from,
      periodTo: period_to,
    });

    // 3. احفظ سجل التقرير
    const report = await Report.create({
      report_type_id,
      organization_id,
      period_from,
      period_to,
      generated_by: user_id,
      status: 'generated',
      notes,
    });

    // 4. أضف البيانات للاستجابة (لا تُخزَّن، تُولَّد عند الطلب)
    return {
      ...report,
      data,
    };
  }

  static async list(filters) {
    return await Report.getAll(filters);
  }

  static async getById(id) {
    return await Report.getById(id);
  }

  static async delete(id) {
    return await Report.delete(id);
  }

  // ==================== Shares ====================
  static async share(reportId, orgId, userId, permission) {
    return await Report.share(reportId, orgId, userId, permission);
  }

  static async revokeShare(shareId, reason) {
    return await Report.revokeShare(shareId, reason);
  }

  static async getSharedWith(organizationId) {
    return await Report.getSharedWith(organizationId);
  }

  // ==================== Requests ====================
  static async listRequests(filters) {
    return await ReportRequest.getAll(filters);
  }

  static async createRequest(data, userId) {
    return await ReportRequest.create({
      ...data,
      user_id: userId,
    });
  }

  static async updateRequestStatus(id, status) {
    return await ReportRequest.updateStatus(id, status);
  }

  static async deleteRequest(id) {
    return await ReportRequest.delete(id);
  }
}

module.exports = ReportService;