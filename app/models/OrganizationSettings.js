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
         metadata, updated_by,
         -- خيارات التصدير
         show_pdf_cases, show_excel_cases,
         show_pdf_body_cases, show_excel_body_cases,
         show_pdf_deaths, show_excel_deaths,
         show_pdf_authorizations, show_excel_authorizations,
         show_pdf_reports, show_excel_reports,
         -- تصميم PDF
         show_logo_in_pdf, show_stamp_in_pdf,
         show_signature_in_pdf, signature_text,
         -- الإعدادات الافتراضية
         default_authorization_validity_days,
         default_report_period_days,
         default_export_format
       )
       VALUES (
         $1, $2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,
         $15,$16,$17,$18,$19,$20,$21,$22,$23,$24,
         $25,$26,$27,$28,
         $29,$30,$31
       )
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
         show_pdf_cases = COALESCE(EXCLUDED.show_pdf_cases, organization_settings.show_pdf_cases),
         show_excel_cases = COALESCE(EXCLUDED.show_excel_cases, organization_settings.show_excel_cases),
         show_pdf_body_cases = COALESCE(EXCLUDED.show_pdf_body_cases, organization_settings.show_pdf_body_cases),
         show_excel_body_cases = COALESCE(EXCLUDED.show_excel_body_cases, organization_settings.show_excel_body_cases),
         show_pdf_deaths = COALESCE(EXCLUDED.show_pdf_deaths, organization_settings.show_pdf_deaths),
         show_excel_deaths = COALESCE(EXCLUDED.show_excel_deaths, organization_settings.show_excel_deaths),
         show_pdf_authorizations = COALESCE(EXCLUDED.show_pdf_authorizations, organization_settings.show_pdf_authorizations),
         show_excel_authorizations = COALESCE(EXCLUDED.show_excel_authorizations, organization_settings.show_excel_authorizations),
         show_pdf_reports = COALESCE(EXCLUDED.show_pdf_reports, organization_settings.show_pdf_reports),
         show_excel_reports = COALESCE(EXCLUDED.show_excel_reports, organization_settings.show_excel_reports),
         show_logo_in_pdf = COALESCE(EXCLUDED.show_logo_in_pdf, organization_settings.show_logo_in_pdf),
         show_stamp_in_pdf = COALESCE(EXCLUDED.show_stamp_in_pdf, organization_settings.show_stamp_in_pdf),
         show_signature_in_pdf = COALESCE(EXCLUDED.show_signature_in_pdf, organization_settings.show_signature_in_pdf),
         signature_text = COALESCE(EXCLUDED.signature_text, organization_settings.signature_text),
         default_authorization_validity_days = COALESCE(EXCLUDED.default_authorization_validity_days, organization_settings.default_authorization_validity_days),
         default_report_period_days = COALESCE(EXCLUDED.default_report_period_days, organization_settings.default_report_period_days),
         default_export_format = COALESCE(EXCLUDED.default_export_format, organization_settings.default_export_format),
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
        // خيارات التصدير (boolean)
        data.show_pdf_cases ?? null,
        data.show_excel_cases ?? null,
        data.show_pdf_body_cases ?? null,
        data.show_excel_body_cases ?? null,
        data.show_pdf_deaths ?? null,
        data.show_excel_deaths ?? null,
        data.show_pdf_authorizations ?? null,
        data.show_excel_authorizations ?? null,
        data.show_pdf_reports ?? null,
        data.show_excel_reports ?? null,
        // تصميم PDF
        data.show_logo_in_pdf ?? null,
        data.show_stamp_in_pdf ?? null,
        data.show_signature_in_pdf ?? null,
        data.signature_text || null,
        // الإعدادات الافتراضية
        data.default_authorization_validity_days ?? null,
        data.default_report_period_days ?? null,
        data.default_export_format || null,
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