// routes/caseRoutes.js
const express = require('express');
const router = express.Router();

const CaseController = require('../controllers/CaseController');
const authMiddleware = require('../middlewares/authMiddleware');
const organizationMiddleware = require('../middlewares/organizationMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

router.use(authMiddleware);

// قائمة الحالات
router.get(
  '/',
  organizationMiddleware,
  permissionMiddleware('CASE_VIEW'),
  CaseController.getAll,
);

// إحصائيات
router.get('/count', CaseController.count);

// حالة واحدة
router.get(
  '/:id',
  organizationMiddleware,
  permissionMiddleware('CASE_VIEW'),
  CaseController.getById,
);

// إنشاء حالة
router.post(
  '/',
  organizationMiddleware,
  permissionMiddleware('CASE_CREATE'),
  CaseController.create,
);

// تحديث حالة
router.put(
  '/:id',
  organizationMiddleware,
  permissionMiddleware('CASE_UPDATE'),
  CaseController.update,
);

// تغيير الحالة
router.patch(
  '/:id/status',
  organizationMiddleware,
  permissionMiddleware('CASE_UPDATE'),
  CaseController.changeStatus,
);

// إغلاق الحالة
router.patch(
  '/:id/close',
  organizationMiddleware,
  permissionMiddleware('CASE_UPDATE'),
  CaseController.close,
);

// حذف
router.delete(
  '/:id',
  organizationMiddleware,
  permissionMiddleware('CASE_UPDATE'),
  CaseController.delete,
);

module.exports = router;