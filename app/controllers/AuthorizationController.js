// controllers/AuthorizationController.js
const AuthorizationService = require('../services/AuthorizationService');

class AuthorizationController {
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