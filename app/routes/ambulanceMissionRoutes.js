const express = require('express');
const router = express.Router();

const AmbulanceMissionController = require('../controllers/AmbulanceMissionController');
const authMiddleware = require('../middlewares/authMiddleware');
const organizationMiddleware = require('../middlewares/organizationMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

// تطبيق التوثيق وتحديد الجهة
router.use(authMiddleware);
router.use(organizationMiddleware);

/**
 * @route   POST /api/v1/ambulance-missions/dispatch/:dispatchId/milestone
 * @desc    تسجيل نقطة تتبع جديدة للمهمة الإسعافية
 */
router.post(
  '/dispatch/:dispatchId/milestone',
  permissionMiddleware('TRANSPORT_CREATE'),
  AmbulanceMissionController.addMilestone
);

/**
 * @route   GET /api/v1/ambulance-missions/dispatch/:dispatchId/timeline
 * @desc    استرجاع السجل الزمني الكامل ونقاط التتبع
 */
router.get(
  '/dispatch/:dispatchId/timeline',
  permissionMiddleware('TRANSPORT_VIEW'),
  AmbulanceMissionController.getTimeline
);

module.exports = router;