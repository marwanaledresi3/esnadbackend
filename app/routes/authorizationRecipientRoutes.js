// routes/authorizationRecipientRoutes.js
const express = require('express');
const router = express.Router();

const RecipientController = require('../controllers/RecipientController');
const authMiddleware = require('../middlewares/authMiddleware');
const organizationMiddleware = require('../middlewares/organizationMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

router.use(authMiddleware);

// ربط مستلم بتصريح
router.post(
  '/:authorizationId/recipient',
  organizationMiddleware,
  permissionMiddleware('AUTHORIZATION_ISSUE'),
  RecipientController.linkToAuthorization,
);

// إلغاء الربط
router.delete(
  '/:authorizationId/recipient',
  organizationMiddleware,
  permissionMiddleware('AUTHORIZATION_ISSUE'),
  RecipientController.unlinkFromAuthorization,
);

module.exports = router;