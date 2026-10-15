const express = require('express');
const router = express.Router();

const CaseEventController = require('../controllers/CaseEventController');
const authMiddleware = require('../middlewares/authMiddleware');
const organizationMiddleware = require('../middlewares/organizationMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');
const { authorizeRecordAccess } = require('../middlewares/authorizeRecordAccess');

router.use(authMiddleware);
router.use(organizationMiddleware);

// تسجيل حدث جديد للحالة
router.post(
  '/cases/:id/events',
  permissionMiddleware('CASE_UPDATE'),
  authorizeRecordAccess('CASE'),
  CaseEventController.recordEvent
);

// عرض الشريط الزمني الكامل للأحداث
router.get(
  '/cases/:id/timeline',
  permissionMiddleware('CASE_VIEW'),
  authorizeRecordAccess('CASE'),
  CaseEventController.getTimeline
);

module.exports = router;