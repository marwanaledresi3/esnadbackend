// routes/bodyReleaseRoutes.js
const express = require('express');
const router = express.Router();

const BodyReleaseController = require('../controllers/BodyReleaseController');
const authMiddleware = require('../middlewares/authMiddleware');
const organizationMiddleware = require('../middlewares/organizationMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

router.use(authMiddleware);
router.use(organizationMiddleware);

// 1. إصدار أمر تسليم جثمان (المحور)
// POST /api/v1/body-releases/issue
router.post(
  '/issue',
  permissionMiddleware('RELEASE_ISSUE'),
  BodyReleaseController.issueReleaseOrder
);

// 2. التحقق من الهوية وتسليم الجثمان الفعلي (المستشفى)
// POST /api/v1/body-releases/:id/execute
router.post(
  '/:id/execute',
  permissionMiddleware('BODY_HANDOVER'),
  BodyReleaseController.executeHandover
);

// 3. طلب فحص طبي شرعي للجثمان
// POST /api/v1/body-releases/forensic-request
router.post(
  '/forensic-request',
  permissionMiddleware('FORENSIC_REQUEST'),
  BodyReleaseController.requestForensicExam
);

module.exports = router;