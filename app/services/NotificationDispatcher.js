// services/NotificationDispatcher.js
const { pool } = require('../config/db');
const NotificationModel = require('../models/NotificationModel');

class NotificationDispatcher {

  /**
   * إرسال تنبيه موجه لجميع المستخدمين الذين يملكون صلاحية محددة داخل جهة معينة
   */
  static async dispatchByPermission(payload) {
    const {
      organizationId,
      permissionCode,
      notificationTypeId,
      inAppTitle,
      inAppMessage,
      safePushMessage = 'لديك معاملة جديدة تحتاج إلى مراجعة.',
      entityType,
      entityId,
      priority = 'NORMAL'
    } = payload;

    // 1. تحديد المستلمين
    const recipientUserIds = await NotificationModel.getRecipientsByPermission(organizationId, permissionCode);

    for (const userId of recipientUserIds) {
      await this.sendToUser({
        userId,
        organizationId,
        notificationTypeId,
        inAppTitle,
        inAppMessage,
        safePushMessage,
        entityType,
        entityId,
        priority
      });
    }
  }

  /**
   * إرسال تنبيه لمستخدم فردي وتطبيق إعدادات الخصوصية وسجلات التسليم
   */
  static async sendToUser(payload) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const {
        userId,
        organizationId,
        notificationTypeId,
        inAppTitle,
        inAppMessage,
        safePushMessage,
        entityType,
        entityId,
        priority
      } = payload;

      // أ) التحقق من إعدادات المستخدم لهذا النوع من الإشعارات
      const settings = await NotificationModel.getUserSettingsForType(userId, notificationTypeId);
      if (!settings.enabled) {
        await client.query('ROLLBACK');
        return; // الإشعارات معطلة لهذا المستخدم
      }

      // ب) إدراج إشعار التطبيق الداخلي (In-App) إن كان مفعلاً
      if (settings.in_app_enabled) {
        const notification = await NotificationModel.createNotification({
          user_id: userId,
          organization_id: organizationId,
          notification_type_id: notificationTypeId,
          title: inAppTitle,
          message: inAppMessage, // يحتوي التفاصيل الكاملة داخل التطبيق الموفر بالصلاحيات
          entity_type: entityType,
          entity_id: entityId,
          priority
        }, client);

        await NotificationModel.logDelivery({
          notification_id: notification.id,
          channel: 'IN_APP',
          status: 'DELIVERED',
          sent_at: new Date()
        }, client);

        // ج) إرسال Push Notification للهاتف (خالي تماماً من أي بيانات حساسة)
        if (settings.push_enabled) {
          const devices = await NotificationModel.getActiveUserDevices(userId);
          for (const device of devices) {
            try {
              // محاكاة الإرسال عبر البوابة الخارجي مثل Firebase (FCM)
              // يتم إرسال النص العام الآمن safePushMessage فقط
              console.log(`[FCM Sent] To Device: ${device.id} | Text: ${safePushMessage}`);

              await NotificationModel.logDelivery({
                notification_id: notification.id,
                channel: 'PUSH',
                status: 'DELIVERED',
                sent_at: new Date()
              }, client);
            } catch (pushErr) {
              await NotificationModel.logDelivery({
                notification_id: notification.id,
                channel: 'PUSH',
                status: 'FAILED',
                sent_at: new Date(),
                failure_reason: pushErr.message
              }, client);
            }
          }
        }
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Notification Dispatch Error:', error);
    } finally {
      client.release();
    }
  }
}

module.exports = NotificationDispatcher;