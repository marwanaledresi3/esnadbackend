// routes/transportRequestRoutes.js
const express = require('express');
const router = express.Router();

const TransportRequestController = require('../controllers/TransportRequestController');
const authMiddleware = require('../middlewares/authMiddleware');
const organizationMiddleware = require('../middlewares/organizationMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

router.use(authMiddleware);

// قائمة الطلبات
router.get(
  '/',
  organizationMiddleware,
  permissionMiddleware('TRANSPORT_VIEW'),
  TransportRequestController.getAll,
);

// طلب واحد
router.get(
  '/:id',
  organizationMiddleware,
  permissionMiddleware('TRANSPORT_VIEW'),
  TransportRequestController.getById,
);

// إنشاء طلب
router.post(
  '/',
  organizationMiddleware,
  permissionMiddleware('TRANSPORT_CREATE'),
  TransportRequestController.create,
);

// اعتماد
router.patch(
  '/:id/approve',
  organizationMiddleware,
  permissionMiddleware('TRANSPORT_VIEW'),
  TransportRequestController.approve,
);

// رفض
router.patch(
  '/:id/reject',
  organizationMiddleware,
  permissionMiddleware('TRANSPORT_VIEW'),
  TransportRequestController.reject,
);

// إلغاء
router.patch(
  '/:id/cancel',
  organizationMiddleware,
  permissionMiddleware('TRANSPORT_VIEW'),
  TransportRequestController.cancel,
);

// تحديث
router.put(
  '/:id',
  organizationMiddleware,
  permissionMiddleware('TRANSPORT_CREATE'),
  TransportRequestController.update,
);

// عناصر الطلب
router.post(
  '/items',
  organizationMiddleware,
  permissionMiddleware('TRANSPORT_CREATE'),
  TransportRequestController.addItem,
);

router.delete(
  '/items/:itemId',
  organizationMiddleware,
  permissionMiddleware('TRANSPORT_CREATE'),
  TransportRequestController.deleteItem,
);

module.exports = router;