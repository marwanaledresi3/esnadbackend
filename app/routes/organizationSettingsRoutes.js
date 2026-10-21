// routes/organizationSettingsRoutes.js
const express = require('express');
const router = express.Router();

const OrganizationSettingsController = require('../controllers/OrganizationSettingsController');
const authMiddleware = require('../middlewares/authMiddleware');
const organizationMiddleware = require('../middlewares/organizationMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

router.use(authMiddleware);

// إعدادات جهة المستخدم الحالي
router.get(
  '/me',
  OrganizationSettingsController.getMyOrganizationSettings,
);

// إعدادات جهة محددة
router.get(
  '/:orgId',
  organizationMiddleware,
  permissionMiddleware('ORGANIZATION_MANAGE'),
  OrganizationSettingsController.getByOrganizationId,
);

router.put(
  '/:orgId',
  organizationMiddleware,
  permissionMiddleware('ORGANIZATION_MANAGE'),
  OrganizationSettingsController.upsert,
);

module.exports = router;