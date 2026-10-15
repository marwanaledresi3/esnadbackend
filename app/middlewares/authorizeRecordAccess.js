const { pool } = require('../config/db');
const ApiError = require('../errors/ApiError');

/**
 * OWNER_QUERIES - استعلامات الملكية المباشرة المطبقة من acs.sql
 */
const OWNER_QUERIES = {
  CASE: `SELECT source_organization_id AS owner_org_id FROM cases WHERE id = $1`,
  BODY_CASE: `
    SELECT c.source_organization_id AS owner_org_id
    FROM body_cases bc
    JOIN cases c ON c.id = bc.case_id
    WHERE bc.id = $1`,
  FORENSIC_REQUEST: `
    SELECT c.source_organization_id AS owner_org_id
    FROM forensic_requests fr
    JOIN body_cases bc ON bc.id = fr.body_case_id
    JOIN cases c ON c.id = bc.case_id
    WHERE fr.id = $1`,
  TRANSPORT_REQUEST: `
    SELECT requester_organization_id AS owner_org_id
    FROM transport_requests WHERE id = $1`,
  REPORT: `SELECT organization_id AS owner_org_id FROM reports WHERE id = $1`,
  DOCUMENT: `
    SELECT issued_by_organization_id AS owner_org_id
    FROM documents WHERE id = $1`,
};

/**
 * SHARE_QUERIES - استعلامات المشاركة المصرحة
 */
const SHARE_QUERIES = {
  CASE: `
    SELECT c.source_organization_id AS owner_org_id
    FROM shared_records sr
    JOIN cases c ON c.id = sr.case_id
    WHERE sr.case_id = $1
      AND sr.shared_with_organization_id = $2
      AND sr.status = 'active'`,
  DOCUMENT: `
    SELECT d.issued_by_organization_id AS owner_org_id
    FROM document_shares ds
    JOIN documents d ON d.id = ds.document_id
    WHERE ds.document_id = $1
      AND ds.shared_with_organization_id = $2
      AND ds.status = 'active'`,
  REPORT: `
    SELECT r.organization_id AS owner_org_id
    FROM report_shares rs
    JOIN reports r ON r.id = rs.report_id
    WHERE rs.report_id = $1
      AND rs.shared_with_organization_id = $2
      AND rs.status = 'active'`,
};

const authorizeRecordAccess = (entityType) => {
  return async (req, res, next) => {
    try {
      const userOrgId = req.currentOrganizationId;
      const entityId = req.params.id || req.params.entityId || req.params.caseId;

      if (!userOrgId) {
        throw ApiError.forbidden('لم يتم تحديد الجهة الحالية');
      }

      // 1. جلب الجهة المالكة للسجل
      const ownerQuery = OWNER_QUERIES[entityType];
      if (!ownerQuery) {
        throw ApiError.internal(`نوع كيان غير مدعوم في authorizeRecordAccess: ${entityType}`);
      }

      const resourceRes = await pool.query(ownerQuery, [entityId]);
      if (resourceRes.rows.length === 0) {
        throw ApiError.notFound('السجل المطلوب غير موجود');
      }

      const ownerOrgId = resourceRes.rows[0].owner_org_id;

      // 2. فحص الملكية المباشرة
      if (ownerOrgId === userOrgId) {
        req.isOwnerAccess = true;
        return next();
      }

      // 3. تجاوز لمسؤول النظام (SYSTEM_ADMIN)
      if (req.user.is_system_admin) {
        req.isAdminAccess = true;
        return next();
      }

      // 4. التتحقق من وجود إذن مشاركة
      const shareQuery = SHARE_QUERIES[entityType];
      if (!shareQuery) {
        throw ApiError.forbidden('هذا السجل غير مشارك مع جهتك');
      }

      const shareRes = await pool.query(shareQuery, [entityId, userOrgId]);
      if (shareRes.rows.length === 0) {
        throw ApiError.forbidden('هذا السجل غير مشارك مع جهتك');
      }

      // 5. التأكد من تفعيل الربط وقواعد المشاركة بين الجهتين
      const ruleCheck = await pool.query(
        `SELECT
           ol.status AS link_status,
           dsr.status AS rule_status
         FROM organization_links ol
         JOIN data_sharing_rules dsr
           ON dsr.organization_link_id = ol.id
          AND dsr.resource_type = $1
         WHERE (
           (ol.source_organization_id = $2 AND ol.target_organization_id = $3)
           OR
           (ol.target_organization_id = $2 AND ol.source_organization_id = $3)
         )`,
        [entityType, ownerOrgId, userOrgId]
      );

      if (ruleCheck.rows.length === 0) {
        throw ApiError.forbidden('لا توجد قاعدة مشاركة مفعّلة بين الجهتين لهذا النوع');
      }

      const { link_status, rule_status } = ruleCheck.rows[0];
      if (link_status !== 'active') {
        throw ApiError.forbidden('علاقة الربط بين الجهتين معلقة أو منتهية');
      }
      if (rule_status !== 'active') {
        throw ApiError.forbidden('قاعدة مشاركة البيانات الخاصة بهذا المورد معطلة');
      }

      req.isExternalAccess = true;
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = { authorizeRecordAccess };