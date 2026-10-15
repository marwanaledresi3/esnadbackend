const express = require('express');
const router = express.Router();
const OrganizationMembershipController = require('../controllers/OrganizationMembershipController');
const authMiddleware = require('../middlewares/authMiddleware');
const organizationMiddleware = require('../middlewares/organizationMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');
const { updateMembershipValidation } = require('../validators/membershipValidator');

router.patch(
  '/users/:userId/status',
  authMiddleware,
  organizationMiddleware,
  permissionMiddleware('USER_SUSPEND'),
  updateMembershipValidation,
  OrganizationMembershipController.updateStatus
);

module.exports = router;