// routes/roleRoutes.js

const express = require('express');
const router = express.Router();

const RoleController = require('../controllers/RoleController');

const authMiddleware = require('../middlewares/authMiddleware');
const organizationMiddleware = require('../middlewares/organizationMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

// التحقق من تسجيل الدخول لجميع المسارات
router.use(authMiddleware);

// عرض الأدوار النشطة
router.get(
  '/active',
  organizationMiddleware,
  permissionMiddleware('ROLE_MANAGE'),
  RoleController.getActive
);

// عرض جميع الأدوار
router.get(
  '/',
  organizationMiddleware,
  permissionMiddleware('ROLE_MANAGE'),
  RoleController.getAll
);

// إنشاء دور
router.post(
  '/',
  organizationMiddleware,
  permissionMiddleware('ROLE_MANAGE'),
  RoleController.create
);

// عرض دور محدد
router.get(
  '/:roleId',
  organizationMiddleware,
  permissionMiddleware('ROLE_MANAGE'),
  RoleController.getById
);

// تحديث دور
router.put(
  '/:roleId',
  organizationMiddleware,
  permissionMiddleware('ROLE_MANAGE'),
  RoleController.update
);

// حذف دور
router.delete(
  '/:roleId',
  organizationMiddleware,
  permissionMiddleware('ROLE_MANAGE'),
  RoleController.delete
);

module.exports = router;