const express = require('express');
const router = express.Router();

const AttachmentController = require('../controllers/AttachmentController');
const authMiddleware = require('../middlewares/authMiddleware');
const organizationMiddleware = require('../middlewares/organizationMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');
const { authorizeRecordAccess } = require('../middlewares/authorizeRecordAccess');
const uploadMiddleware = require('../middlewares/uploadMiddleware');

router.use(authMiddleware);
router.use(organizationMiddleware);

// رفع مرفق لحالة
router.post(
  '/upload',
  permissionMiddleware('DOCUMENT_UPLOAD'),
  uploadMiddleware.single('file'),
  AttachmentController.uploadAttachment
);

// جلب مرفقات حالة معينة بعد التحقق من الوصول للسجل
router.get(
  '/case/:caseId',
  permissionMiddleware('DOCUMENT_VIEW'),
  authorizeRecordAccess('CASE'),
  AttachmentController.getCaseAttachments
);

module.exports = router;