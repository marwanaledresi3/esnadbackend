const express = require('express');
const router = express.Router();
const Controller = require('../controllers/OrganizationSharingController');
const authMiddleware = require('../middlewares/authMiddleware');
const organizationMiddleware = require('../middlewares/organizationMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

router.use(authMiddleware);
router.use(organizationMiddleware);

// طلبات الحسابات والعضويات
router.post(
  '/account-requests/:requestId/approve',
  permissionMiddleware('USER_APPROVE'),
  Controller.approveAccountRequest
);

// إدارة العلاقات والقواعد بين الجهات
router.post(
  '/links',
  permissionMiddleware('SHARING_APPROVE'),
  Controller.createOrganizationLink
);

router.post(
  '/rules',
  permissionMiddleware('SHARING_APPROVE'),
  Controller.createSharingRule
);

// مشاركة وسحب المشاركة للسجلات
router.post(
  '/share-record',
  permissionMiddleware('SHARING_CREATE'),
  Controller.shareRecord
);

router.patch(
  '/share-record/:shareId/revoke',
  permissionMiddleware('SHARING_CREATE'),
  Controller.revokeSharing
);

module.exports = router;