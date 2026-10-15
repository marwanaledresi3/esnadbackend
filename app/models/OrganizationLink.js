const { pool } = require('../config/db');

class OrganizationLink {
  // إنشاء علاقة جديدة بين جهتين (موجهة وغير ثنائية)
  static async create({ sourceOrganizationId, targetOrganizationId, linkType, createdByUserId }) {
    const query = `
      INSERT INTO organization_links (
        source_organization_id, target_organization_id, link_type, status, created_by, created_at
      )
      VALUES ($1, $2, $3, 'PENDING', $4, NOW())
      RETURNING *
    `;
    const res = await pool.query(query, [sourceOrganizationId, targetOrganizationId, linkType, createdByUserId]);
    return res.rows[0];
  }

  /**
   * 1. جلب قائمة علاقات وطلبات الربط بين الجهات
   */
  static async getOrganizationLinks({ status, sourceOrgId, targetOrgId }) {
    let query = `
      SELECT 
        ol.id,
        ol.source_organization_id,
        org_src.name AS source_organization_name,
        org_src.organization_type AS source_organization_type,
        ol.target_organization_id,
        org_tgt.name AS target_organization_name,
        org_tgt.organization_type AS target_organization_type,
        ol.link_type,
        ol.status,
        ol.created_at,
        ol.updated_at
      FROM organization_links ol
      JOIN organizations org_src ON org_src.id = ol.source_organization_id
      JOIN organizations org_tgt ON org_tgt.id = ol.target_organization_id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND ol.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (sourceOrgId) {
      query += ` AND ol.source_organization_id = $${paramIndex}`;
      params.push(sourceOrgId);
      paramIndex++;
    }

    if (targetOrgId) {
      query += ` AND ol.target_organization_id = $${paramIndex}`;
      params.push(targetOrgId);
      paramIndex++;
    }

    query += ` ORDER BY ol.created_at DESC;`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  // البحث عن علاقة ربط نشطة بين جهة مصدر وجهة مستهدفة
  static async findActiveLink(sourceOrganizationId, targetOrganizationId) {
    const query = `
      SELECT * FROM organization_links 
      WHERE source_organization_id = $1 
        AND target_organization_id = $2 
        AND status = 'ACTIVE'
    `;
    const res = await pool.query(query, [sourceOrganizationId, targetOrganizationId]);
    return res.rows[0] || null;
  }

  // اعتماد وتفعيل العلاقة (System Admin)
  static async approveLink(linkId, approvedByUserId) {
    const query = `
      UPDATE organization_links 
      SET status = 'ACTIVE', approved_by = $1, approved_at = NOW()
      WHERE id = $2 AND status = 'PENDING'
      RETURNING *
    `;
    const res = await pool.query(query, [approvedByUserId, linkId]);
    return res.rows[0] || null;
  }

  // تعليق أو إنهاء العلاقة
  static async updateStatus(linkId, status) {
    const query = `
      UPDATE organization_links 
      SET status = $1, 
          ended_at = CASE WHEN $1 = 'ENDED' THEN NOW() ELSE ended_at END
      WHERE id = $2
      RETURNING *
    `;
    const res = await pool.query(query, [status, linkId]);
    return res.rows[0];
  }
}

module.exports = OrganizationLink;