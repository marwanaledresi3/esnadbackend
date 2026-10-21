// controllers/AuthorizationController.js
const AuthorizationService = require('../services/AuthorizationService');
 const PdfService = require('../services/PDFService');   
 const Recipient = require('../models/Recipient');
const AuthorizationRecipientLink = require('../models/AuthorizationRecipientLink');
class AuthorizationController {
 

static async exportPdf(req, res) {
  try {
    const auth = await AuthorizationService.getById(req.params.id);
    if (!auth) {
      return res.status(404).json({ success: false, message: 'التصريح غير موجود' });
    }

    const filename = `${auth.authorization_number}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

    PdfService.generateAuthorization(auth, res);
  } catch (error) {
    console.error('AuthorizationController.exportPdf', error);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: 'تعذر التصدير' });
    }
  }
}
  /**
   * GET /authorizations
   */
  static async getAll(req, res) {
    try {
      const {
        status,
        issuer_organization_id,
        authorization_type_id,
        valid_from,
        valid_until,
        limit,
        offset,
      } = req.query;

      const items = await AuthorizationService.list({
        status,
        issuer_organization_id,
        authorization_type_id,
        valid_from,
        valid_until,
        limit: limit ? Number(limit) : 100,
        offset: offset ? Number(offset) : 0,
      });

      return res.json({
        success: true,
        message: 'قائمة التصاريح',
        data: items,
      });
    } catch (error) {
      console.error('AuthorizationController.getAll', error);
      return res.status(500).json({
        success: false,
        message: 'تعذر جلب التصاريح',
      });
    }
  }

  /**
   * GET /authorizations/:id
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const item = await AuthorizationService.getById(id);
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'التصريح غير موجود',
        });
      }
      return res.json({ success: true, data: item });
    } catch (error) {
      console.error('AuthorizationController.getById', error);
      return res.status(500).json({
        success: false,
        message: 'تعذر جلب التصريح',
      });
    }
  }

  /**
   * POST /authorizations
   * body:
   * {
   *   authorization_type_id,
   *   issuer_organization_id,
   *   issued_by_user_id,
   *   valid_from,
   *   valid_until,
   *   document_id,
   *   notes,
   *   targets: [{ target_type, target_id }],
   *   status
   * }
   */
  static async creat4e(req, res) {
    try {
      const {
        authorization_type_id,
        issuer_organization_id,
        issued_by_user_id,
        valid_from,
        valid_until,
        document_id,
        notes,
        targets,
        status,
      } = req.body;

      if (!authorization_type_id || !issuer_organization_id) {
        return res.status(400).json({
          success: false,
          message: 'نوع التصريح والجهة المُصدِرة مطلوبان',
        });
      }

      const authorization = await AuthorizationService.createFull({
        authorization_type_id,
        issuer_organization_id,
        issued_by_user_id,
        valid_from,
        valid_until,
        document_id,
        notes,
        targets: Array.isArray(targets) ? targets : [],
        status: status || 'draft',
        created_by: req.user?.id,
      });

      return res.status(201).json({
        success: true,
        message: 'تم إنشاء التصريح بنجاح',
        data: authorization,
      });
    } catch (error) {
      console.error('AuthorizationController.create', error);
      return res.status(500).json({
        success: false,
        message: 'تعذر إنشاء التصريح',
      });
    }
  }


static async create(req, res) {
  try {
    const {
      authorization_type_id,
      issuer_organization_id,
      issued_by_user_id,
      valid_from,
      valid_until,
      document_id,
      notes,
      targets,
      status,
      recipient_id,   // ← اختيار من موجود
      recipient,      // ← إنشاء جديد
    } = req.body;

    if (!authorization_type_id || !issuer_organization_id) {
      return res.status(400).json({
        success: false,
        message: 'نوع التصريح والجهة المُصدِرة مطلوبان',
      });
    }

    // 1. إنشاء التصريح (بدون مستلم)
    const created = await AuthorizationService.createFull({
      authorization_type_id,
      issuer_organization_id,
      issued_by_user_id,
      valid_from,
      valid_until,
      document_id,
      notes,
      targets: Array.isArray(targets) ? targets : [],
      status: status || 'draft',
      created_by: req.user?.id,
    });

    // 2. إرفاق المستلم
    let finalRecipientId = null;

    if (recipient_id) {
      // ✅ اختيار من موجود → اربط فقط (بدون نسخة)
      finalRecipientId = recipient_id;

      const recipientExists = await Recipient.getById(recipient_id);
      if (!recipientExists) {
        return res.status(400).json({
          success: false,
          message: 'المستلم المختار غير موجود',
        });
      }

      await AuthorizationRecipientLink.link(
        created.id,
        recipient_id,
        req.user?.id,
      );
    } else if (recipient && recipient.full_name) {
      // ✅ إنشاء جديد → أنشئ في `recipients` ثم اربط
      const newRecipient = await Recipient.create({
        organization_id: req.user?.organization_id,
        full_name: recipient.full_name,
        id_number: recipient.id_number,
        id_type: recipient.id_type,
        phone: recipient.phone,
        relationship: recipient.relationship,
        address: recipient.address,
        id_verified: recipient.id_verified === true,
        verified_by: recipient.id_verified === true ? req.user?.id : null,
        verified_at: recipient.id_verified === true ? new Date() : null,
        verification_method: recipient.verification_method,
        id_document_url: recipient.id_document_url,
        notes: recipient.notes,
        metadata: recipient.metadata,
        created_by: req.user?.id,
      });

      finalRecipientId = newRecipient.id;

      await AuthorizationRecipientLink.link(
        created.id,
        newRecipient.id,
        req.user?.id,
      );
    }

    // 3. أعد جلب التصريح مع المستلم
    const full = await AuthorizationService.getById(created.id);

    return res.status(201).json({
      success: true,
      message: 'تم إنشاء التصريح بنجاح',
      data: full || created,
    });
  } catch (error) {
    console.error('AuthorizationController.create', error);
    return res.status(500).json({
      success: false,
      message: 'تعذر إنشاء التصريح',
    });
  }
}
  /**
   * PUT /authorizations/:id
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const updated = await AuthorizationService.update(id, req.body);
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'التصريح غير موجود أو لا توجد حقول للتحديث',
        });
      }
      return res.json({
        success: true,
        message: 'تم تحديث التصريح',
        data: updated,
      });
    } catch (error) {
      console.error('AuthorizationController.update', error);
      return res.status(500).json({
        success: false,
        message: 'تعذر تحديث التصريح',
      });
    }
  }

  /**
   * POST /authorizations/:id/revoke
   */
  static async revoke(req, res) {
    try {
      const { id } = req.params;
      const revoked = await AuthorizationService.revoke(id);
      if (!revoked) {
        return res.status(404).json({
          success: false,
          message: 'التصريح غير موجود',
        });
      }
      return res.json({
        success: true,
        message: 'تم إلغاء التصريح',
        data: revoked,
      });
    } catch (error) {
      console.error('AuthorizationController.revoke', error);
      return res.status(500).json({
        success: false,
        message: 'تعذر إلغاء التصريح',
      });
    }
  }
  /**
 * POST /authorizations/for-body
 * إصدار تصريح مرتبط بجثمان
 */
static async createForBodyCase(req, res) {
  try {
    const {
      body_case_id,
      authorization_type_id,
      issuer_organization_id,
      valid_from,
      valid_until,
      notes,
    } = req.body;

    if (!body_case_id || !authorization_type_id || !issuer_organization_id) {
      return res.status(400).json({
        success: false,
        message: 'body_case_id و authorization_type_id و issuer_organization_id مطلوبة',
      });
    }

    const created = await AuthorizationService.createForBodyCase({
      body_case_id,
      authorization_type_id,
      issuer_organization_id,
      issued_by_user_id: req.user?.id,
      valid_from,
      valid_until,
      notes,
      created_by: req.user?.id,
    });

    return res.status(201).json({
      success: true,
      message: 'تم إصدار التصريح للجثمان',
      data: created,
    });
  } catch (error) {
    console.error('AuthorizationController.createForBodyCase', error);
    return res.status(500).json({
      success: false,
      message: 'تعذر إصدار التصريح',
    });
  }
}

/**
 * GET /authorizations/by-target?type=body_case&id=<uuid>
 */
static async getByTarget(req, res) {
  try {
    const { type, id } = req.query;
    if (!type || !id) {
      return res.status(400).json({
        success: false,
        message: 'type و id مطلوبان',
      });
    }
    const items = await AuthorizationService.getByTarget(type, id);
    return res.json({
      success: true,
      message: 'تصاريح الكيان',
      data: items,
    });
  } catch (error) {
    console.error('AuthorizationController.getByTarget', error);
    return res.status(500).json({
      success: false,
      message: 'تعذر جلب التصاريح',
    });
  }
}
}

module.exports = AuthorizationController;