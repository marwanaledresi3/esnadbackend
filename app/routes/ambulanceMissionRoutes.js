const express = require('express');
const router = express.Router();
const AmbulanceMissionController = require('../controllers/AmbulanceMissionController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { ROLES } = require('../config/constants');

// تطبيق التوثيق على جميع مسارات المهمات الإسعافية
router.use(authMiddleware);

/**
 * @route   POST /api/v1/ambulance-missions/dispatch/:dispatchId/milestone
 * @desc    تسجيل نقطة تتبع جديدة للمهمة الإسعافية (En Route, On Scene, Transporting, etc.)
 * @access  Private (PARAMEDIC, DISPATCHER, ADMIN)
 */
router.post(
  '/dispatch/:dispatchId/milestone',
  roleMiddleware([ROLES.PARAMEDIC, ROLES.DISPATCHER, ROLES.ADMIN]),
  AmbulanceMissionController.addMilestone
);

/**
 * @route   GET /api/v1/ambulance-missions/dispatch/:dispatchId/timeline
 * @desc    استرجاع السجل الزمني الكامل ونقاط التتبع الخاصة بمهمة بلاغ معين
 * @access  Private (جميع المستخدمين الموثقين)
 */
router.get(
  '/dispatch/:dispatchId/timeline',
  AmbulanceMissionController.getTimeline
);

module.exports = router;