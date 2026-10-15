// routes/authorizationRoutes.js
const express = require('express');
const router = express.Router();

const AuthorizationController = require('../controllers/AuthorizationController');
const authMiddleware = require('../middlewares/authMiddleware');
const organizationMiddleware = require('../middlewares/organizationMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

// كل المسارات محمية بتسجيل الدخول
router.use(authMiddleware);

// جلب قائمة التصاريح
router.get(
  '/',
  organizationMiddleware,
  permissionMiddleware('AUTHORIZATION_VIEW'),
  AuthorizationController.getAll,
);

// جلب تصريح واحد
router.get(
  '/:id',
  organizationMiddleware,
  permissionMiddleware('AUTHORIZATION_VIEW'),
  AuthorizationController.getById,
);

// إنشاء تصريح
router.post(
  '/',
  organizationMiddleware,
  permissionMiddleware('AUTHORIZATION_ISSUE'),
  AuthorizationController.create,
);

// تحديث تصريح
router.put(
  '/:id',
  organizationMiddleware,
  permissionMiddleware('AUTHORIZATION_ISSUE'),
  AuthorizationController.update,
);

// إلغاء تصريح
router.post(
  '/:id/revoke',
  organizationMiddleware,
  permissionMiddleware('AUTHORIZATION_REVOKE'),
  AuthorizationController.revoke,
);

// أضف هذه المسارات
router.post(
  '/for-body',
  organizationMiddleware,
  permissionMiddleware('AUTHORIZATION_ISSUE'),
  AuthorizationController.createForBodyCase,
);

router.get(
  '/by-target',
  organizationMiddleware,
  permissionMiddleware('AUTHORIZATION_VIEW'),
  AuthorizationController.getByTarget,
);

module.exports = router;