// routes/hospitalCustodyRoutes.js
const express = require('express');
const router = express.Router();

const HospitalCustodyController = require('../controllers/HospitalCustodyController');
const authMiddleware = require('../middlewares/authMiddleware');
const organizationMiddleware = require('../middlewares/organizationMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');
const BodyCaseController = require('../controllers/BodyCaseController');
router.use(authMiddleware);
router.use(organizationMiddleware);

// 1. استلام جثمان بالمستشفى
// POST /api/v1/hospital/body-cases/receive
router.post(
  '/body-cases/receive',
  permissionMiddleware('BODY_RECEIVE'),
  HospitalCustodyController.receiveBody
);

// 2. تسجيل وفاة جريح وتحويله إلى جثمان
// POST /api/v1/hospital/cases/:caseId/record-death
router.post(
  '/cases/:caseId/record-death',
  permissionMiddleware('DEATH_RECORD'),
  HospitalCustodyController.recordDeath
);

// 3. إيداع الجثمان في الثلاجة (تغيير الحالة لـ preserved)
// PATCH /api/v1/hospital/body-cases/:id/store
router.patch(
  '/body-cases/:id/store',
  permissionMiddleware('BODY_RECEIVE'),
  HospitalCustodyController.storeInFridge
);

// routes/hospitalCustodyRoutes.js (محدث)

// // 1. جلب قائمة كامل الجثامين الموجودة بعهدة المستشفى
// router.get(
//   '/body-cases',
//   permissionMiddleware('BODY_VIEW'),
//   BodyCaseController.getCustodyHistory
// );

// // 2. تفاصيل جثمان محدد بعهدة المستشفى
// router.get(
//   '/body-cases/:id',
//   permissionMiddleware('BODY_VIEW'),
//   BodyCaseController.getBodyCaseById
// );

// // 3. نقل الجثمان من ثلاجة/قسم لآخر داخل المستشفى
// router.post(
//   '/body-cases/:id/move',
//   permissionMiddleware('BODY_RECEIVE'),
//   BodyCaseController.moveStorageLocation
// );

// // 4. جلب سجل التتبع الزمني الكامل لحيازة وتحركات الجثمان
// router.get(
//   '/body-cases/:id/custody-history',
//   permissionMiddleware('BODY_VIEW'),
//   BodyCaseController.getCustodyHistory
// );
module.exports = router;