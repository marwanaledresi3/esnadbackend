// routes/rolePermissionRoutes.js

const express = require('express');
const router = express.Router();

const RolePermissionController = require('../controllers/RolePermissionController');

const authMiddleware = require('../middlewares/authMiddleware');
const organizationMiddleware = require('../middlewares/organizationMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

router.use(authMiddleware);

// عرض صلاحيات دور
router.get(
  '/:roleId',
  organizationMiddleware,
  permissionMiddleware('PERMISSION_MANAGE'),
  RolePermissionController.getByRole
);

// إسناد صلاحية إلى دور
router.post(
  '/:roleId',
  organizationMiddleware,
  permissionMiddleware('PERMISSION_MANAGE'),
  RolePermissionController.assign
);

// استبدال جميع صلاحيات دور
router.put(
  '/:roleId',
  organizationMiddleware,
  permissionMiddleware('PERMISSION_MANAGE'),
  RolePermissionController.replaceForRole
);

// إلغاء صلاحية من دور
router.delete(
  '/:roleId/:permissionId',
  organizationMiddleware,
  permissionMiddleware('PERMISSION_MANAGE'),
  RolePermissionController.remove
);

module.exports = router;
