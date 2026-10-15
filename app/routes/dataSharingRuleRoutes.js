const express = require('express');
const router = express.Router();

const DataSharingRuleController = require('../controllers/DataSharingRuleController');
const authMiddleware = require('../middlewares/authMiddleware');
const organizationMiddleware = require('../middlewares/organizationMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');
const { createSharingRuleValidation } = require('../validators/sharingRuleValidator');

router.post(
  '/',
  authMiddleware,
  organizationMiddleware,
  permissionMiddleware('SHARING_APPROVE'),
  createSharingRuleValidation,
  DataSharingRuleController.upsertRule
);

module.exports = router;