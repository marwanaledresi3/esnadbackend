const express = require('express');
const router = express.Router();
const AmbulanceController = require('../controllers/AmbulanceController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.use(authMiddleware);

// استعلام السيارات المتاحة
router.get('/available', AmbulanceController.getAvailableAmbulances);

// تكليف وتوجيه سيارة إسعاف لبلاغ
router.post(
  '/dispatch', 
  roleMiddleware(['DISPATCHER', 'ADMIN']), 
  AmbulanceController.dispatchAmbulance
);

// تحديث حالة المهمة الحالية
router.patch(
  '/dispatch/:dispatchId/status', 
  roleMiddleware(['DISPATCHER', 'PARAMEDIC', 'ADMIN']), 
  AmbulanceController.updateDispatchStatus
);

module.exports = router;