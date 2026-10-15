const express = require('express');
const router = express.Router();

const OrganizationLinkController = require('../controllers/OrganizationLinkController');
const authMiddleware = require('../middlewares/authMiddleware');
const organizationMiddleware = require('../middlewares/organizationMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

const {
  createLinkValidation
} = require('../validators/organizationLinkValidator');

// إنشاء طلب ربط بين جهتين
router.post(
  '/',
  authMiddleware,
  organizationMiddleware,
  permissionMiddleware('DATA_LINK_MANAGE'),
  createLinkValidation,
  OrganizationLinkController.create
);

// جلب علاقات الربط مع إمكانية التصفية
router.get(
  '/',
  authMiddleware,
  organizationMiddleware,
  permissionMiddleware('DATA_LINK_MANAGE'),
  OrganizationLinkController.getOrganizationLinks
);

// اعتماد وتفعيل علاقة الربط
router.post(
  '/:id/approve',
  authMiddleware,
  organizationMiddleware,
  permissionMiddleware('DATA_LINK_MANAGE'),
  OrganizationLinkController.approve
);

// تحديث حالة علاقة الربط
router.patch(
  '/:id/status',
  authMiddleware,
  organizationMiddleware,
  permissionMiddleware('DATA_LINK_MANAGE'),
  OrganizationLinkController.updateStatus
);

// البحث عن علاقة ربط نشطة بين جهتين
router.get(
  '/active',
  authMiddleware,
  organizationMiddleware,
  permissionMiddleware('DATA_LINK_MANAGE'),
  OrganizationLinkController.findActiveLink
);

module.exports = router;