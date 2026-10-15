const express = require('express');
const router = express.Router();

const LookupController = require('../controllers/LookupController');
const {
  validateLookupType,
  validateCreateLookup,
  validateUpdateLookup,
} = require('../validators/lookupValidator');

const authMiddleware = require('../middlewares/authMiddleware');
const organizationMiddleware = require('../middlewares/organizationMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

// 1. القراءة
router.get(
  '/:type',
  validateLookupType,
  LookupController.getItems
);

router.use(authMiddleware);
router.use(organizationMiddleware);

// 2. الإضافة (تحتاج صلاحيات إدارية على المستوى المطلوب)
router.post(
  '/:type',
  permissionMiddleware('CASE_CREATE'),
  validateCreateLookup,
  LookupController.createItem
);

// 3. التحديث
router.patch(
  '/:type/:id',
  permissionMiddleware('CASE_UPDATE'),
  validateUpdateLookup,
  LookupController.updateItem
);

// 4. التعطيل (Soft Delete)
router.patch(
  '/:type/:id/disable',
  permissionMiddleware('CASE_UPDATE'),
  validateLookupType,
  LookupController.disableItem
);

module.exports = router;