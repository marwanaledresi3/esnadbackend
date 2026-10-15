// routes/bodyCaseRoutes.js
const express = require('express');
const router = express.Router();

const BodyCaseController = require('../controllers/BodyCaseController');
const authMiddleware = require('../middlewares/authMiddleware');
const organizationMiddleware = require('../middlewares/organizationMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

router.use(authMiddleware);

// قائمة الجثامين
router.get(
  '/',
  organizationMiddleware,
  permissionMiddleware('BODY_VIEW'),
  BodyCaseController.getAll,
);

// إحصائيات
router.get('/count', BodyCaseController.count);

// جثمان واحد
router.get(
  '/:id',
  organizationMiddleware,
  permissionMiddleware('BODY_VIEW'),
  BodyCaseController.getById,
);

// إنشاء جثمان
router.post(
  '/',
  organizationMiddleware,
  permissionMiddleware('BODY_CREATE'),
  BodyCaseController.create,
);

// تحديث
router.put(
  '/:id',
  organizationMiddleware,
  permissionMiddleware('BODY_CREATE'),
  BodyCaseController.update,
);

// تغييرات الحالة المتعددة
router.patch('/:id/status', BodyCaseController.changeStatus);
router.patch('/:id/custody-status', BodyCaseController.changeCustodyStatus);
router.patch('/:id/forensic-status', BodyCaseController.changeForensicStatus);
router.patch('/:id/handover-status', BodyCaseController.changeHandoverStatus);

// حذف
router.delete(
  '/:id',
  organizationMiddleware,
  permissionMiddleware('BODY_CREATE'),
  BodyCaseController.delete,
);

module.exports = router;