// routes/vehicleDispatchRoutes.js
const express = require('express');
const router = express.Router();

const VehicleDispatchController = require('../controllers/VehicleDispatchController');
const authMiddleware = require('../middlewares/authMiddleware');
const organizationMiddleware = require('../middlewares/organizationMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

router.use(authMiddleware);
router.use(organizationMiddleware);

// 1. إصدار أمر خروج جديد
// POST /api/v1/vehicle-dispatches
router.post(
  '/',
  permissionMiddleware('VEHICLE_DISPATCH'),
  VehicleDispatchController.createDispatch
);

// 2. تسجيل حدث أثناء الرحلة
// POST /api/v1/vehicle-dispatches/:id/events
router.post(
  '/:id/events',
  permissionMiddleware('VEHICLE_DISPATCH'),
  VehicleDispatchController.recordEvent
);

// 3. جلب تفاصيل أمر الخروج وأحداث الرحلة
// GET /api/v1/vehicle-dispatches/:id
router.get(
  '/:id',
  permissionMiddleware('TRANSPORT_VIEW'),
  VehicleDispatchController.getDispatchDetails
);

module.exports = router;