// routes/transportMissionRoutes.js
const express = require('express');
const router = express.Router();

const TransportMissionController = require('../controllers/TransportMissionController');
const authMiddleware = require('../middlewares/authMiddleware');
const organizationMiddleware = require('../middlewares/organizationMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

// تطبيق الوسائط الأساسية على جميع المسارات
router.use(authMiddleware);
router.use(organizationMiddleware);

// 1. إنشاء مهمة جديدة
// POST /api/v1/missions
router.post(
  '/',
  permissionMiddleware('TRANSPORT_CREATE'),
  TransportMissionController.createMission
);

// 2. استعراض قائمة المهام
// GET /api/v1/missions
router.get(
  '/',
  permissionMiddleware('TRANSPORT_VIEW'),
  TransportMissionController.getMissions
);

// 3. جلب تفاصيل مهمة محددة
// GET /api/v1/missions/:id
router.get(
  '/:id',
  permissionMiddleware('TRANSPORT_VIEW'),
  TransportMissionController.getMissionById
);

// 4. تحديث حالة المهمة الميدانية (تغير حالات التتبع: departed, arrived... إلخ)
// PATCH /api/v1/missions/:id/status
router.patch(
  '/:id/status',
  permissionMiddleware('TRANSPORT_UPDATE'),
  TransportMissionController.updateStatus
);

module.exports = router;