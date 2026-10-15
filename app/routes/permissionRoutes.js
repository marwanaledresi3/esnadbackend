
// routes/permissionRoutes.js

const express = require('express');
const router = express.Router();

const PermissionController = require('../controllers/PermissionController');

const authMiddleware = require('../middlewares/authMiddleware');
const organizationMiddleware = require('../middlewares/organizationMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

router.use(authMiddleware);

// عرض جميع الصلاحيات
router.get(
  '/',
  organizationMiddleware,
  permissionMiddleware('PERMISSION_MANAGE'),
  PermissionController.getAll
);

// إنشاء صلاحية
router.post(
  '/',
  organizationMiddleware,
  permissionMiddleware('PERMISSION_MANAGE'),
  PermissionController.create
);

// عرض صلاحية واحدة
router.get(
  '/:permissionId',
  organizationMiddleware,
  permissionMiddleware('PERMISSION_MANAGE'),
  PermissionController.getById
);

// تحديث صلاحية
router.put(
  '/:permissionId',
  organizationMiddleware,
  permissionMiddleware('PERMISSION_MANAGE'),
  PermissionController.update
);

// حذف صلاحية
router.delete(
  '/:permissionId',
  organizationMiddleware,
  permissionMiddleware('PERMISSION_MANAGE'),
  PermissionController.delete
);

module.exports = router;
