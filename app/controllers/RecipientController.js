// controllers/RecipientController.js
const Recipient = require('../models/Recipient');
const AuthorizationRecipientLink = require('../models/AuthorizationRecipientLink');
const AuditLogService = require('../services/AuditLogService');

class RecipientController {
  // ══════════════════════════════════════════════
  // GET /recipients
  // قائمة مستلمي الجهة
  // ══════════════════════════════════════════════
  static async getAll(req, res) {
    try {
      const organizationId = req.user?.organization_id;
      if (!organizationId) {
        return res.status(400).json({
          success: false,
          message: 'جهة المستخدم غير محددة',
        });
      }

      const { limit, offset, q } = req.query;

      let items;
      if (q && q.trim().length > 0) {
        items = await Recipient.search(organizationId, q.trim());
      } else {
        items = await Recipient.getAll(organizationId, {
          limit: limit ? Number(limit) : 100,
          offset: offset ? Number(offset) : 0,
        });
      }

      return res.json({
        success: true,
        message: 'قائمة المستلمين',
        data: items,
      });
    } catch (error) {
      console.error('RecipientController.getAll', error);
      return res.status(500).json({
        success: false,
        message: 'تعذر جلب المستلمين',
      });
    }
  }

  // ══════════════════════════════════════════════
  // GET /recipients/search?q=...
  // بحث
  // ══════════════════════════════════════════════
  static async search(req, res) {
    try {
      const organizationId = req.user?.organization_id;
      if (!organizationId) {
        return res.status(400).json({
          success: false,
          message: 'جهة المستخدم غير محددة',
        });
      }

      const q = (req.query.q || '').trim();
      if (q.length === 0) {
        return res.json({
          success: true,
          data: [],
          message: 'أدخل كلمة للبحث',
        });
      }

      const items = await Recipient.search(organizationId, q);

      return res.json({
        success: true,
        message: 'نتائج البحث',
        data: items,
      });
    } catch (error) {
      console.error('RecipientController.search', error);
      return res.status(500).json({
        success: false,
        message: 'تعذر البحث',
      });
    }
  }

  // ══════════════════════════════════════════════
  // GET /recipients/:id
  // جلب مستلم واحد
  // ══════════════════════════════════════════════
  static async getById(req, res) {
    try {
      const { id } = req.params;

      const recipient = await Recipient.getById(id);
      if (!recipient) {
        return res.status(404).json({
          success: false,
          message: 'المستلم غير موجود',
        });
      }

      // التحقق من الجهة
      const organizationId = req.user?.organization_id;
      if (organizationId && recipient.organization_id !== organizationId) {
        return res.status(403).json({
          success: false,
          message: 'ليس لديك صلاحية لعرض هذا المستلم',
        });
      }

      return res.json({ success: true, data: recipient });
    } catch (error) {
      console.error('RecipientController.getById', error);
      return res.status(500).json({
        success: false,
        message: 'تعذر جلب المستلم',
      });
    }
  }

  // ══════════════════════════════════════════════
  // POST /recipients
  // إنشاء مستلم جديد
  // ══════════════════════════════════════════════
  static async create(req, res) {
    try {
      const organizationId = req.user?.organization_id;
      if (!organizationId) {
        return res.status(400).json({
          success: false,
          message: 'جهة المستخدم غير محددة',
        });
      }

      const {
        full_name,
        id_number,
        id_type,
        phone,
        relationship,
        address,
        id_verified,
        verification_method,
        id_document_url,
        notes,
        metadata,
      } = req.body;

      if (!full_name || full_name.trim().isEmpty) {
        return res.status(400).json({
          success: false,
          message: 'اسم المستلم مطلوب',
        });
      }

      const created = await Recipient.create({
        organization_id: organizationId,
        full_name: full_name.trim(),
        id_number,
        id_type,
        phone,
        relationship,
        address,
        id_verified: id_verified === true,
        verified_by: id_verified === true ? req.user?.id : null,
        verified_at: id_verified === true ? new Date() : null,
        verification_method,
        id_document_url,
        notes,
        metadata,
        created_by: req.user?.id,
      });

      await AuditLogService.log({
        user_id: req.user?.id,
        organization_id: organizationId,
        action: 'RECIPIENT_CREATE',
        entity_type: 'recipient',
        entity_id: created.id,
        result: 'success',
        new_values: created,
      });

      return res.status(201).json({
        success: true,
        message: 'تم إضافة المستلم',
        data: created,
      });
    } catch (error) {
      console.error('RecipientController.create', error);
      return res.status(500).json({
        success: false,
        message: 'تعذر إضافة المستلم',
      });
    }
  }

  // ══════════════════════════════════════════════
  // PUT /recipients/:id
  // تحديث مستلم
  // ══════════════════════════════════════════════
  static async update(req, res) {
    try {
      const { id } = req.params;

      const existing = await Recipient.getById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'المستلم غير موجود',
        });
      }

      // التحقق من الجهة
      const organizationId = req.user?.organization_id;
      if (organizationId && existing.organization_id !== organizationId) {
        return res.status(403).json({
          success: false,
          message: 'ليس لديك صلاحية لتعديل هذا المستلم',
        });
      }

      const {
        full_name,
        id_number,
        id_type,
        phone,
        relationship,
        address,
        id_verified,
        verification_method,
        id_document_url,
        notes,
        metadata,
      } = req.body;

      const updated = await Recipient.update(id, {
        full_name,
        id_number,
        id_type,
        phone,
        relationship,
        address,
        id_verified,
        verified_by: id_verified === true ? req.user?.id : undefined,
        verified_at: id_verified === true ? new Date() : undefined,
        verification_method,
        id_document_url,
        notes,
        metadata,
        updated_by: req.user?.id,
      });

      if (!updated) {
        return res.status(400).json({
          success: false,
          message: 'لا توجد حقول للتحديث',
        });
      }

      await AuditLogService.log({
        user_id: req.user?.id,
        organization_id: organizationId,
        action: 'RECIPIENT_UPDATE',
        entity_type: 'recipient',
        entity_id: id,
        result: 'success',
        old_values: existing,
        new_values: updated,
      });

      return res.json({
        success: true,
        message: 'تم تحديث المستلم',
        data: updated,
      });
    } catch (error) {
      console.error('RecipientController.update', error);
      return res.status(500).json({
        success: false,
        message: 'تعذر التحديث',
      });
    }
  }

  // ══════════════════════════════════════════════
  // DELETE /recipients/:id
  // حذف مستلم
  // ══════════════════════════════════════════════
  static async delete(req, res) {
    try {
      const { id } = req.params;

      const existing = await Recipient.getById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'المستلم غير موجود',
        });
      }

      // التحقق من الجهة
      const organizationId = req.user?.organization_id;
      if (organizationId && existing.organization_id !== organizationId) {
        return res.status(403).json({
          success: false,
          message: 'ليس لديك صلاحية لحذف هذا المستلم',
        });
      }

      // تحقق من عدم ارتباطه بتصاريح
      const linked = await Recipient.isLinked(id);
      if (linked) {
        return res.status(409).json({
          success: false,
          message: 'لا يمكن حذف المستلم — مرتبط بتصاريح. أزل الارتباط أولاً.',
        });
      }

      const ok = await Recipient.delete(id);

      if (ok) {
        await AuditLogService.log({
          user_id: req.user?.id,
          organization_id: organizationId,
          action: 'RECIPIENT_DELETE',
          entity_type: 'recipient',
          entity_id: id,
          result: 'success',
          old_values: existing,
        });
      }

      return res.json({ success: true, message: 'تم الحذف' });
    } catch (error) {
      console.error('RecipientController.delete', error);
      return res.status(500).json({
        success: false,
        message: 'تعذر الحذف',
      });
    }
  }

  // ══════════════════════════════════════════════
  // GET /recipients/:id/authorizations
  // تصاريح مستلم معيّن
  // ══════════════════════════════════════════════
  static async getAuthorizations(req, res) {
    try {
      const { id } = req.params;

      const existing = await Recipient.getById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'المستلم غير موجود',
        });
      }

      const authorizations = await Recipient.getAuthorizations(id);

      return res.json({
        success: true,
        message: 'تصاريح المستلم',
        data: authorizations,
      });
    } catch (error) {
      console.error('RecipientController.getAuthorizations', error);
      return res.status(500).json({
        success: false,
        message: 'تعذر جلب التصاريح',
      });
    }
  }

  // ══════════════════════════════════════════════
  // GET /recipients/count
  // عدد المستلمين في الجهة
  // ══════════════════════════════════════════════
  static async count(req, res) {
    try {
      const organizationId = req.user?.organization_id;
      if (!organizationId) {
        return res.status(400).json({
          success: false,
          message: 'جهة المستخدم غير محددة',
        });
      }

      const total = await Recipient.countByOrganization(organizationId);

      return res.json({ success: true, data: { total } });
    } catch (error) {
      console.error('RecipientController.count', error);
      return res.status(500).json({
        success: false,
        message: 'تعذر الجلب',
      });
    }
  }

  // ══════════════════════════════════════════════
  // POST /authorizations/:id/recipient
  // ربط مستلم بتصريح
  // ══════════════════════════════════════════════
  static async linkToAuthorization(req, res) {
    try {
      const { authorizationId } = req.params;
      const { recipient_id, notes } = req.body;

      if (!recipient_id) {
        return res.status(400).json({
          success: false,
          message: 'recipient_id مطلوب',
        });
      }

      // تحقق من وجود المستلم
      const recipient = await Recipient.getById(recipient_id);
      if (!recipient) {
        return res.status(404).json({
          success: false,
          message: 'المستلم غير موجود',
        });
      }

      const link = await AuthorizationRecipientLink.link(
        authorizationId,
        recipient_id,
        req.user?.id,
        notes,
      );

      return res.status(201).json({
        success: true,
        message: 'تم ربط المستلم بالتصريح',
        data: { link, recipient },
      });
    } catch (error) {
      console.error('RecipientController.linkToAuthorization', error);
      return res.status(500).json({
        success: false,
        message: 'تعذر ربط المستلم',
      });
    }
  }

  // ══════════════════════════════════════════════
  // DELETE /authorizations/:id/recipient
  // إلغاء ربط المستلم
  // ══════════════════════════════════════════════
  static async unlinkFromAuthorization(req, res) {
    try {
      const { authorizationId } = req.params;

      const ok = await AuthorizationRecipientLink.unlink(authorizationId);

      if (!ok) {
        return res.status(404).json({
          success: false,
          message: 'لا يوجد مستلم مرتبط بهذا التصريح',
        });
      }

      return res.json({
        success: true,
        message: 'تم إلغاء الربط',
      });
    } catch (error) {
      console.error('RecipientController.unlinkFromAuthorization', error);
      return res.status(500).json({
        success: false,
        message: 'تعذر إلغاء الربط',
      });
    }
  }
}

module.exports = RecipientController;