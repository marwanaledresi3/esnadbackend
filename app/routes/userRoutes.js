
const express = require('express');
const router = express.Router();

const UserController = require('../controllers/UserController');
const authMiddleware = require('../middlewares/authMiddleware');
const organizationMiddleware = require('../middlewares/organizationMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

router.use(authMiddleware);
router.use(organizationMiddleware);

// جلب المستخدمين
router.get(
  '/',
  permissionMiddleware('USER_VIEW'),
  UserController.getAll
);

// عرض مستخدم محدد
router.get(
  '/:id',
  permissionMiddleware('USER_VIEW'),
  UserController.getById
);

// إنشاء مستخدم
router.post(
  '/',
  permissionMiddleware('USER_MANAGE'),
  UserController.create
);

// تحديث حالة المستخدم
router.patch(
  '/:id/status',
  permissionMiddleware('USER_MANAGE'),
  UserController.updateStatus
);

// حذف مستخدم
router.delete(
  '/:id',
  permissionMiddleware('USER_MANAGE'),
  UserController.delete
);

module.exports = router;
