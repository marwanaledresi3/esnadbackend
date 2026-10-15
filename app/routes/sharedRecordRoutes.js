const express = require('express');
const router = express.Router();
const SharedRecordController = require('../controllers/SharedRecordController');
const authMiddleware = require('../middlewares/authMiddleware');
const organizationMiddleware = require('../middlewares/organizationMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');
const { shareRecordValidation, revokeShareValidation } = require('../validators/sharedRecordValidator');

router.post(
  '/',
  authMiddleware,
  organizationMiddleware,
  permissionMiddleware('SHARING_CREATE'),
  shareRecordValidation,
  SharedRecordController.share
);

router.post(
  '/:shareId/revoke',
  authMiddleware,
  organizationMiddleware,
  permissionMiddleware('SHARING_CREATE'),
  revokeShareValidation,
  SharedRecordController.revoke
);

module.exports = router;