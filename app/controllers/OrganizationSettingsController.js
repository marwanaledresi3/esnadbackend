// controllers/OrganizationSettingsController.js
const OrganizationSettings = require('../models/OrganizationSettings');
const Organization = require('../models/Organization');
const AuditLogService = require('../services/AuditLogService');

class OrganizationSettingsController {
  /**
   * GET /organization-settings/:orgId
   * جلب إعدادات جهة
   */
  static async getByOrganizationId(req, res) {
    try {
      const { orgId } = req.params;

      // تحقق من وجود الجهة
      const org = await Organization.getById(orgId);
      if (!org) {
        return res.status(404).json({
          success: false,
          message: 'الجهة غير موجودة',
        });
      }

      let settings = await OrganizationSettings.getByOrganizationId(orgId);

      // إذا لم توجد إعدادات → أرجع إعدادات افتراضية
      if (!settings) {
        settings = {
          organization_id: orgId,
          header_ar: null,
          header_en: null,
          footer_text: null,
          logo_url: null,
          stamp_url: null,
          official_signature: null,
          signer_title: null,
          contact_phone: org.phone || null,
          contact_email: null,
          address: org.address || null,
          website: null,
          metadata: {},
        };
      }

      return res.json({
        success: true,
        data: {
          organization: org,
          settings,
        },
      });
    } catch (error) {
      console.error('OrganizationSettingsController.getByOrganizationId', error);
      return res.status(500).json({
        success: false,
        message: 'تعذر جلب الإعدادات',
      });
    }
  }

  /**
   * PUT /organization-settings/:orgId
   * تحديث إعدادات جهة
   */
  static async upsert(req, res) {
  try {
    const { orgId } = req.params;
    const userId = req.user?.id;

    const org = await Organization.getById(orgId);
    if (!org) {
      return res.status(404).json({
        success: false,
        message: 'الجهة غير موجودة',
      });
    }

    const {
      // البيانات الأساسية
      header_ar,
      header_en,
      footer_text,
      logo_url,
      stamp_url,
      official_signature,
      signer_title,
      contact_phone,
      contact_email,
      address,
      website,
      metadata,
      // خيارات التصدير
      show_pdf_cases,
      show_excel_cases,
      show_pdf_body_cases,
      show_excel_body_cases,
      show_pdf_deaths,
      show_excel_deaths,
      show_pdf_authorizations,
      show_excel_authorizations,
      show_pdf_reports,
      show_excel_reports,
      // تصميم PDF
      show_logo_in_pdf,
      show_stamp_in_pdf,
      show_signature_in_pdf,
      signature_text,
      // الإعدادات الافتراضية
      default_authorization_validity_days,
      default_report_period_days,
      default_export_format,
    } = req.body;

    const settings = await OrganizationSettings.upsert(
      orgId,
      {
        header_ar,
        header_en,
        footer_text,
        logo_url,
        stamp_url,
        official_signature,
        signer_title,
        contact_phone,
        contact_email,
        address,
        website,
        metadata,
        show_pdf_cases,
        show_excel_cases,
        show_pdf_body_cases,
        show_excel_body_cases,
        show_pdf_deaths,
        show_excel_deaths,
        show_pdf_authorizations,
        show_excel_authorizations,
        show_pdf_reports,
        show_excel_reports,
        show_logo_in_pdf,
        show_stamp_in_pdf,
        show_signature_in_pdf,
        signature_text,
        default_authorization_validity_days,
        default_report_period_days,
        default_export_format,
      },
      userId,
    );

    await AuditLogService.log({
      user_id: userId,
      organization_id: orgId,
      action: 'ORGANIZATION_SETTINGS_UPDATE',
      entity_type: 'organization_settings',
      entity_id: settings.id,
      result: 'success',
      new_values: settings,
    });

    return res.json({
      success: true,
      message: 'تم حفظ الإعدادات',
      data: settings,
    });
  } catch (error) {
    console.error('OrganizationSettingsController.upsert', error);
    return res.status(500).json({
      success: false,
      message: 'تعذر حفظ الإعدادات',
    });
  }
}

  /**
   * GET /organization-settings/me
   * جلب إعدادات جهة المستخدم الحالي (للاستخدام في PDF)
   */
  static async getMyOrganizationSettings(req, res) {
    try {
      const orgId = req.user?.organization_id;
      if (!orgId) {
        return res.status(400).json({
          success: false,
          message: 'جهة المستخدم غير محددة',
        });
      }

      const settings = await OrganizationSettings.getByOrganizationId(orgId);

      return res.json({
        success: true,
        data: settings,
      });
    } catch (error) {
      console.error('OrganizationSettingsController.getMyOrganizationSettings', error);
      return res.status(500).json({
        success: false,
        message: 'تعذر الجلب',
      });
    }
  }
}

module.exports = OrganizationSettingsController;