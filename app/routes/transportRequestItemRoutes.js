const express = require('express');
const router = express.Router();
const TransportRequestController = require('../controllers/TransportRequestController');
const { validateAddItem } = require('../validators/transportRequestItemValidator');

const authMiddleware = require('../middlewares/authMiddleware');
const organizationMiddleware = require('../middlewares/organizationMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');
const { authorizeRecordAccess } = require('../middlewares/authorizeRecordAccess');

router.use(authMiddleware);
router.use(organizationMiddleware);

router.get(
  '/requests',
  permissionMiddleware('TRANSPORT_VIEW'),
  TransportRequestController.getRequests
);
// 1. جلب جميع عناصر طلب نقل معين
router.get(
  '/transport-requests/:requestId/items',
  permissionMiddleware('TRANSPORT_VIEW'),
  authorizeRecordAccess('TRANSPORT_REQUEST'),
  TransportRequestController.getRequestItems
);

// 2. إضافة عنصر جديد لطلب نقل
router.post(
  '/transport-requests/:requestId/items',
  permissionMiddleware('TRANSPORT_CREATE'),
  authorizeRecordAccess('TRANSPORT_REQUEST'),
  validateAddItem,
  TransportRequestController.addItem
);

// 3. جلب تفاصيل عنصر محدد برقمه
router.get(
  '/transport-request-items/:id',
  permissionMiddleware('TRANSPORT_VIEW'),
  TransportRequestController.getItem
);

// 4. حذف عنصر محدد برقمه
router.delete(
  '/transport-request-items/:id',
  permissionMiddleware('TRANSPORT_CREATE'),
  TransportRequestController.removeItem
);
router.patch(
  '/:id/approve',
  permissionMiddleware('TRANSPORT_UPDATE'),
  TransportRequestController.approveRequest
);

// 5. المستشفى: رفض طلب النقل مع ذكر السبب
router.patch(
  '/:id/reject',
  permissionMiddleware('TRANSPORT_UPDATE'),
 TransportRequestController.rejectRequest
);
module.exports = router;