const {pool} = require('../config/db');
// models/OrganizationSettings.js

class OrganizationSettings {
  /**
   * جلب إعدادات جهة (يُرجع null إن لم توجد)
   */
  static async getByOrganizationId(organizationId) {
    const { rows } = await pool.query(
      `SELECT * FROM organization_settings WHERE organization_id = $1`,
      [organizationId],
    );
    return rows[0] || null;
  }

  /**
   * إنشاء أو تحديث (upsert)
   */
  static async upsert(organizationId, data, userId) {
    const { rows } = await pool.query(
      `INSERT INTO organization_settings (
         organization_id,
         header_ar, header_en, footer_text,
         logo_url, stamp_url,
         official_signature, signer_title,
         contact_phone, contact_email, address, website,
         metadata, updated_by
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       ON CONFLICT (organization_id) DO UPDATE SET
         header_ar = COALESCE(EXCLUDED.header_ar, organization_settings.header_ar),
         header_en = COALESCE(EXCLUDED.header_en, organization_settings.header_en),
         footer_text = COALESCE(EXCLUDED.footer_text, organization_settings.footer_text),
         logo_url = COALESCE(EXCLUDED.logo_url, organization_settings.logo_url),
         stamp_url = COALESCE(EXCLUDED.stamp_url, organization_settings.stamp_url),
         official_signature = COALESCE(EXCLUDED.official_signature, organization_settings.official_signature),
         signer_title = COALESCE(EXCLUDED.signer_title, organization_settings.signer_title),
         contact_phone = COALESCE(EXCLUDED.contact_phone, organization_settings.contact_phone),
         contact_email = COALESCE(EXCLUDED.contact_email, organization_settings.contact_email),
         address = COALESCE(EXCLUDED.address, organization_settings.address),
         website = COALESCE(EXCLUDED.website, organization_settings.website),
         metadata = COALESCE(EXCLUDED.metadata, organization_settings.metadata),
         updated_at = now(),
         updated_by = EXCLUDED.updated_by
       RETURNING *`,
      [
        organizationId,
        data.header_ar || null,
        data.header_en || null,
        data.footer_text || null,
        data.logo_url || null,
        data.stamp_url || null,
        data.official_signature || null,
        data.signer_title || null,
        data.contact_phone || null,
        data.contact_email || null,
        data.address || null,
        data.website || null,
        data.metadata ? JSON.stringify(data.metadata) : '{}',
        userId || null,
      ],
    );
    return rows[0];
  }

  /**
   * حذف إعدادات جهة
   */
  static async delete(organizationId) {
    const { rowCount } = await pool.query(
      `DELETE FROM organization_settings WHERE organization_id = $1`,
      [organizationId],
    );
    return rowCount > 0;
  }
}

module.exports = OrganizationSettings;