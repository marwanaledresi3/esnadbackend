// controllers/NotificationController.js
const NotificationService = require('../services/NotificationService');

class NotificationController {
  static async getAll(req, res) {
    try {
      let userId = null;
      const {
        user_id,
        organization_id,
        source_organization_id,
        notification_type_id,
        is_read,
        priority,
        entity_type,
        entity_id,
        from_date,
        to_date,
        limit,
        offset,
      } = req.query;
      if(!req.user.is_system_admin){
        userId = req.user?.id;
      }

      const items = await NotificationService.list({
        user_id: user_id || userId,  // ← الافتراضي: إشعارات المستخدم
        organization_id,
        source_organization_id,
        notification_type_id,
        is_read: is_read === undefined ? undefined : is_read === 'true',
        priority,
        entity_type,
        entity_id,
        from_date,
        to_date,
        limit: limit ? Number(limit) : 100,
        offset: offset ? Number(offset) : 0,
      });

      return res.json({
        success: true,
        message: 'قائمة البلاغات',
        data: items,
      });
    } catch (error) {
      console.error('NotificationController.getAll', error);
      return res.status(500).json({
        success: false,
        message: 'تعذر جلب البلاغات',
      });
    }
  }

  static async getById(req, res) {
    try {
      const item = await NotificationService.getById(req.params.id);
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'البلاغ غير موجود',
        });
      }
      return res.json({ success: true, data: item });
    } catch (error) {
      console.error('NotificationController.getById', error);
      return res.status(500).json({
        success: false,
        message: 'تعذر جلب البلاغ',
      });
    }
  }

  static async create(req, res) {
    try {
      const {
        user_id,
        organization_id,
        source_organization_id,
        notification_type_id,
        title,
        message,
        entity_type,
        entity_id,
        priority,
           metadata,  
      } = req.body;

      if (!user_id || !title || !message) {
        return res.status(400).json({
          success: false,
          message: 'user_id و title و message مطلوبة',
        });
      }

      const created = await NotificationService.create({
        user_id,
        organization_id,
        source_organization_id: source_organization_id || req.user?.organization_id,
        notification_type_id,
        title,
        message,
        entity_type,
        entity_id,
        priority: priority || 'normal',
           metadata,  
      });

      return res.status(201).json({
        success: true,
        message: 'تم إنشاء البلاغ',
        data: created,
      });
    } catch (error) {
      console.error('NotificationController.create', error);
      return res.status(500).json({
        success: false,
        message: 'تعذر إنشاء البلاغ',
      });
    }
  }

  static async markAsRead(req, res) {
    try {
      const updated = await NotificationService.markAsRead(req.params.id);
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'البلاغ غير موجود',
        });
      }
      return res.json({ success: true, data: updated });
    } catch (error) {
      console.error('NotificationController.markAsRead', error);
      return res.status(500).json({
        success: false,
        message: 'تعذر تحديث البلاغ',
      });
    }
  }

  static async markAllAsRead(req, res) {
    try {
      const count = await NotificationService.markAllAsRead(req.user.id);
      return res.json({
        success: true,
        message: `تم تعليم ${count} إشعاراً كمقروء`,
      });
    } catch (error) {
      console.error('NotificationController.markAllAsRead', error);
      return res.status(500).json({
        success: false,
        message: 'تعذر التحديث',
      });
    }
  }

  static async close(req, res) {
    try {
      const closed = await NotificationService.close(
        req.params.id,
        req.user.id,
      );
      if (!closed) {
        return res.status(404).json({
          success: false,
          message: 'البلاغ غير موجود',
        });
      }
      return res.json({
        success: true,
        message: 'تم إغلاق البلاغ',
        data: closed,
      });
    } catch (error) {
      console.error('NotificationController.close', error);
      return res.status(500).json({
        success: false,
        message: 'تعذر إغلاق البلاغ',
      });
    }
  }

  static async unreadCount(req, res) {
    try {
      const count = await NotificationService.unreadCount(req.user.id);
      return res.json({ success: true, data: { count } });
    } catch (error) {
      console.error('NotificationController.unreadCount', error);
      return res.status(500).json({
        success: false,
        message: 'تعذر جلب العدد',
      });
    }
  }

  static async delete(req, res) {
    try {
      const ok = await NotificationService.delete(req.params.id);
      if (!ok) {
        return res.status(404).json({
          success: false,
          message: 'البلاغ غير موجود',
        });
      }
      return res.json({
        success: true,
        message: 'تم حذف البلاغ',
      });
    } catch (error) {
      console.error('NotificationController.delete', error);
      return res.status(500).json({
        success: false,
        message: 'تعذر حذف البلاغ',
      });
    }
  }
}

module.exports = NotificationController;