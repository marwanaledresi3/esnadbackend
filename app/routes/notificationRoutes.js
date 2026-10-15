// routes/notificationRoutes.js
const express = require('express');
const router = express.Router();

const NotificationController = require('../controllers/NotificationController');
const authMiddleware = require('../middlewares/authMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');
const organizationMiddleware = require('../middlewares/organizationMiddleware');

router.use(authMiddleware);

// قائمة البلاغات
router.get(
  '/',
  organizationMiddleware,
  permissionMiddleware('NOTIFICATION_VIEW'),
  NotificationController.getAll,
);

// عدد غير المقروءة
router.get(
  '/unread-count',
  NotificationController.unreadCount,
);

// تعليم الكل كمقروء
router.patch(
  '/mark-all-read',
  NotificationController.markAllAsRead,
);

// بلاغ واحد
router.get(
  '/:id',
  permissionMiddleware('NOTIFICATION_VIEW'),
  NotificationController.getById,
);

// إنشاء بلاغ
router.post(
  '/',
  permissionMiddleware('NOTIFICATION_CREATE'),
  NotificationController.create,
);

// تعليم كمقروء
router.patch(
  '/:id/read',
  NotificationController.markAsRead,
);

// إغلاق
router.patch(
  '/:id/close',
  permissionMiddleware('NOTIFICATION_CLOSE'),
  NotificationController.close,
);

// حذف
router.delete(
  '/:id',
  permissionMiddleware('NOTIFICATION_CLOSE'),
  NotificationController.delete,
);

module.exports = router;