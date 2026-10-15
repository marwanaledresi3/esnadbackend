// routes/sharedRecordRoutes.js
const express = require('express');
const router = express.Router();

const SharedRecordController = require('../controllers/SharedRecordController');
const authMiddleware = require('../middlewares/authMiddleware');
const organizationMiddleware = require('../middlewares/organizationMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

router.use(authMiddleware);

router.get('/', SharedRecordController.getAll);
router.get('/shared-with-me', SharedRecordController.getSharedWithMe);
router.get('/:id', SharedRecordController.getById);

// المشاركة تتطلب صلاحية SHARING_CREATE
router.post(
  '/',
  organizationMiddleware,
  permissionMiddleware('SHARING_CREATE'),
  SharedRecordController.create,
);

router.patch(
  '/:id/revoke',
  organizationMiddleware,
  permissionMiddleware('SHARING_CREATE'),
  SharedRecordController.revoke,
);

router.delete(
  '/:id',
  organizationMiddleware,
  permissionMiddleware('SHARING_CREATE'),
  SharedRecordController.delete,
);

module.exports = router;