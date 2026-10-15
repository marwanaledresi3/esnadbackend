const express = require('express');
const router = express.Router();
const CaseController = require('../controllers/CaseController');
const authMiddleware = require('../middlewares/authMiddleware');
const organizationMiddleware = require('../middlewares/organizationMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');
const uploadMiddleware = require('../middlewares/uploadMiddleware');
const { authorizeRecordAccess } = require('../middlewares/authorizeRecordAccess');

router.use(authMiddleware);
router.use(organizationMiddleware);

// تسجيل حالة جديدة
router.post(
  '/',
  permissionMiddleware('CASE_CREATE'),
  uploadMiddleware.single('photo'),
  CaseController.createCase
);

// جلب تفاصيل الحالة والـ Timeline
router.get(
  '/:id',
  permissionMiddleware('CASE_VIEW'),
  authorizeRecordAccess('CASE'),
  CaseController.getCaseDetails
);

// تدوين حدث مساري في الـ Timeline
router.post(
  '/:id/events',
  permissionMiddleware('CASE_UPDATE'),
  authorizeRecordAccess('CASE'),
  CaseController.addEvent
);

module.exports = router;