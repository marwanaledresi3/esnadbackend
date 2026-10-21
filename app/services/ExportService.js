// services/ExportService.js
const {pool} = require('../config/db');

class ExportService {
  // ══════════════════════════════════════════════
  // الحالات
  // ══════════════════════════════════════════════
  static async getCasesData({ organizationId, from_date, to_date, limit = 1000 }) {
    let query = `
      SELECT
        c.case_number,
        c.case_type,
        c.case_status,
        c.priority,
        p.full_name AS person_name,
        p.person_number,
        c.arrival_datetime,
        c.opened_at,
        c.closed_at,
        c.current_location,
        c.notes
      FROM cases c
      LEFT JOIN persons p ON p.id = c.person_id
      WHERE 1=1
    `;
    const params = [];
    let i = 1;

    if (organizationId) {
      query += ` AND c.organization_id = $${i}`;
      params.push(organizationId);
      i++;
    }
    if (from_date) {
      query += ` AND c.opened_at >= $${i}`;
      params.push(from_date);
      i++;
    }
    if (to_date) {
      query += ` AND c.opened_at <= $${i}`;
      params.push(to_date);
      i++;
    }

    query += ` ORDER BY c.opened_at DESC LIMIT $${i}`;
    params.push(limit);

    const { rows } = await pool.query(query, params);
    return rows;
  }

  // ══════════════════════════════════════════════
  // الجثامين
  // ══════════════════════════════════════════════
  static async getBodyCasesData({ organizationId, from_date, to_date, limit = 1000 }) {
    let query = `
      SELECT
        bc.body_number,
        c.case_number,
        p.full_name AS person_name,
        p.person_number,
        bc.identity_status,
        bc.custody_status,
        bc.forensic_status,
        bc.handover_status,
        bc.received_at,
        bc.current_location,
        bc.notes
      FROM body_cases bc
      INNER JOIN cases c ON c.id = bc.case_id
      LEFT JOIN persons p ON p.id = c.person_id
      WHERE 1=1
    `;
    const params = [];
    let i = 1;

    if (organizationId) {
      query += ` AND bc.current_organization_id = $${i}`;
      params.push(organizationId);
      i++;
    }
    if (from_date) {
      query += ` AND bc.received_at >= $${i}`;
      params.push(from_date);
      i++;
    }
    if (to_date) {
      query += ` AND bc.received_at <= $${i}`;
      params.push(to_date);
      i++;
    }

    query += ` ORDER BY bc.received_at DESC LIMIT $${i}`;
    params.push(limit);

    const { rows } = await pool.query(query, params);
    return rows;
  }

  // ══════════════════════════════════════════════
  // الوفيات
  // ══════════════════════════════════════════════
  static async getDeathsData({ organizationId, from_date, to_date, limit = 1000 }) {
    let query = `
      SELECT
        c.case_number,
        p.full_name AS person_name,
        p.person_number,
        dr.death_datetime,
        dr.death_location,
        dr.death_context,
        dr.cause_status,
        dr.notes
      FROM death_records dr
      INNER JOIN cases c ON c.id = dr.case_id
      LEFT JOIN persons p ON p.id = c.person_id
      WHERE 1=1
    `;
    const params = [];
    let i = 1;

    if (organizationId) {
      query += ` AND c.organization_id = $${i}`;
      params.push(organizationId);
      i++;
    }
    if (from_date) {
      query += ` AND dr.death_datetime >= $${i}`;
      params.push(from_date);
      i++;
    }
    if (to_date) {
      query += ` AND dr.death_datetime <= $${i}`;
      params.push(to_date);
      i++;
    }

    query += ` ORDER BY dr.death_datetime DESC LIMIT $${i}`;
    params.push(limit);

    const { rows } = await pool.query(query, params);
    return rows;
  }

  // ══════════════════════════════════════════════
  // التصاريح
  // ══════════════════════════════════════════════
  static async getAuthorizationsData({ organizationId, from_date, to_date, limit = 1000 }) {
    let query = `
      SELECT
        a.authorization_number,
        at.name AS authorization_type_name,
        o.name AS issuer_organization_name,
        u.full_name AS issued_by_user_name,
        a.issued_at,
        a.valid_from,
        a.valid_until,
        a.status,
        a.notes,
        r.full_name AS recipient_name,
        r.phone AS recipient_phone,
        r.relationship AS recipient_relationship
      FROM authorizations a
      LEFT JOIN authorization_types at ON at.id = a.authorization_type_id
      LEFT JOIN organizations o ON o.id = a.issuer_organization_id
      LEFT JOIN users u ON u.id = a.issued_by_user_id
      LEFT JOIN authorization_recipient_links arl ON arl.authorization_id = a.id
      LEFT JOIN recipients r ON r.id = arl.recipient_id
      WHERE 1=1
    `;
    const params = [];
    let i = 1;

    if (organizationId) {
      query += ` AND a.issuer_organization_id = $${i}`;
      params.push(organizationId);
      i++;
    }
    if (from_date) {
      query += ` AND a.issued_at >= $${i}`;
      params.push(from_date);
      i++;
    }
    if (to_date) {
      query += ` AND a.issued_at <= $${i}`;
      params.push(to_date);
      i++;
    }

    query += ` ORDER BY a.issued_at DESC LIMIT $${i}`;
    params.push(limit);

    const { rows } = await pool.query(query, params);
    return rows;
  }

  // ══════════════════════════════════════════════
  // تعريفات الأعمدة (Excel)
  // ══════════════════════════════════════════════
  static getCasesColumns() {
    return [
      { header: 'رقم الحالة', key: 'case_number', width: 20 },
      { header: 'النوع', key: 'case_type', width: 15 },
      { header: 'الحالة', key: 'case_status', width: 15 },
      { header: 'الأولوية', key: 'priority', width: 12 },
      { header: 'الشخص', key: 'person_name', width: 25 },
      { header: 'رقم الشخص', key: 'person_number', width: 18 },
      { header: 'وقت الوصول', key: 'arrival_datetime', width: 20 },
      { header: 'تاريخ الفتح', key: 'opened_at', width: 20 },
      { header: 'تاريخ الإغلاق', key: 'closed_at', width: 20 },
      { header: 'الموقع الحالي', key: 'current_location', width: 25 },
      { header: 'ملاحظات', key: 'notes', width: 30 },
    ];
  }

  static getBodyCasesColumns() {
    return [
      { header: 'رقم الجثمان', key: 'body_number', width: 20 },
      { header: 'رقم الحالة', key: 'case_number', width: 20 },
      { header: 'الشخص', key: 'person_name', width: 25 },
      { header: 'رقم الشخص', key: 'person_number', width: 18 },
      { header: 'حالة الهوية', key: 'identity_status', width: 15 },
      { header: 'حالة الحيازة', key: 'custody_status', width: 15 },
      { header: 'حالة الفحص', key: 'forensic_status', width: 15 },
      { header: 'حالة التسليم', key: 'handover_status', width: 15 },
      { header: 'وقت الاستلام', key: 'received_at', width: 20 },
      { header: 'الموقع الحالي', key: 'current_location', width: 25 },
      { header: 'ملاحظات', key: 'notes', width: 30 },
    ];
  }

  static getDeathsColumns() {
    return [
      { header: 'رقم الحالة', key: 'case_number', width: 20 },
      { header: 'الشخص', key: 'person_name', width: 25 },
      { header: 'رقم الشخص', key: 'person_number', width: 18 },
      { header: 'وقت الوفاة', key: 'death_datetime', width: 20 },
      { header: 'مكان الوفاة', key: 'death_location', width: 25 },
      { header: 'سياق الوفاة', key: 'death_context', width: 20 },
      { header: 'حالة السبب', key: 'cause_status', width: 15 },
      { header: 'ملاحظات', key: 'notes', width: 30 },
    ];
  }

  static getAuthorizationsColumns() {
    return [
      { header: 'رقم التصريح', key: 'authorization_number', width: 22 },
      { header: 'النوع', key: 'authorization_type_name', width: 20 },
      { header: 'الجهة المُصدِرة', key: 'issuer_organization_name', width: 25 },
      { header: 'صادر بواسطة', key: 'issued_by_user_name', width: 20 },
      { header: 'تاريخ الإصدار', key: 'issued_at', width: 20 },
      { header: 'صالحة من', key: 'valid_from', width: 18 },
      { header: 'صالحة حتى', key: 'valid_until', width: 18 },
      { header: 'الحالة', key: 'status', width: 12 },
      { header: 'المستلم', key: 'recipient_name', width: 25 },
      { header: 'هاتف المستلم', key: 'recipient_phone', width: 18 },
      { header: 'صلة القرابة', key: 'recipient_relationship', width: 15 },
      { header: 'ملاحظات', key: 'notes', width: 30 },
    ];
  }
}

module.exports = ExportService;