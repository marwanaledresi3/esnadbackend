const express = require('express');
const router = express.Router();
const OperationController = require('../controllers/OperationController');
const { validateCreateOperation, validateUpdateOperation } = require('../validators/operationValidator');
const authMiddleware = require('../middlewares/authMiddleware');
const organizationMiddleware = require('../middlewares/organizationMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');
const { authorizeRecordAccess } = require('../middlewares/authorizeRecordAccess');

router.use(authMiddleware);
router.use(organizationMiddleware);

// مسارات تحت سياق الحالة
router.get(
  '/cases/:caseId/operations',
  permissionMiddleware('CASE_VIEW'),
  authorizeRecordAccess('CASE'),
  OperationController.getByCase
);

router.post(
  '/cases/:caseId/operations',
  permissionMiddleware('CASE_UPDATE'),
  authorizeRecordAccess('CASE'),
  validateCreateOperation,
  OperationController.create
);

// مسارات مباشرة للإجراء الطبي
router.get(
  '/operations/:id',
  permissionMiddleware('CASE_VIEW'),
  OperationController.getById
);

router.patch(
  '/operations/:id',
  permissionMiddleware('CASE_UPDATE'),
  validateUpdateOperation,
  OperationController.update
);

module.exports = router;