const express = require('express');
const router = express.Router();

const Controller = require('../controllers/DocumentAuthorizationController');
const authMiddleware = require('../middlewares/authMiddleware');
const organizationMiddleware = require('../middlewares/organizationMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');
const { authorizeRecordAccess } = require('../middlewares/authorizeRecordAccess');

router.use(authMiddleware);
router.use(organizationMiddleware);

// رفع وثيقة جديدة
router.post(
  '/documents/upload',
  permissionMiddleware('DOCUMENT_UPLOAD'),
  Controller.uploadDocument
);

// إصدار تصريح رسمي
router.post(
  '/authorizations/issue',
  permissionMiddleware('SHARING_APPROVE'),
  Controller.issueAuthorization
);

// مشاركة وثيقة مع جهة
router.post(
  '/documents/share',
  permissionMiddleware('DOCUMENT_SHARE'),
  Controller.shareDocument
);

// إلغاء مشاركة وثيقة
router.delete(
  '/documents/share/:shareId',
  permissionMiddleware('DOCUMENT_SHARE'),
  Controller.revokeDocumentShare
);

module.exports = router;