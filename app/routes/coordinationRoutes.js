const express = require('express');
const router = express.Router();

const CaseSharingController = require('../controllers/CaseSharingController');
const authMiddleware = require('../middlewares/authMiddleware');
const organizationMiddleware = require('../middlewares/organizationMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');
const { authorizeRecordAccess } = require('../middlewares/authorizeRecordAccess');

// حماية المسارات بالمصادقة وتحديد الجهة
router.use(authMiddleware);
router.use(organizationMiddleware);

// مشاركة بيانات حالة مع جهة أخرى
router.post(
  '/cases/share',
  permissionMiddleware('SHARING_CREATE'),
  CaseSharingController.shareCase
);

// إلغاء مشاركة حالة
router.delete(
  '/cases/share/:shareId',
  permissionMiddleware('SHARING_CREATE'),
  CaseSharingController.revokeSharing
);

module.exports = router;