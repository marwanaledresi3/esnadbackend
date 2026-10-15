const express = require('express');
const router = express.Router();

const HandoverController = require('../controllers/HandoverController');
const authMiddleware = require('../middlewares/authMiddleware');
const organizationMiddleware = require('../middlewares/organizationMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

router.use(authMiddleware);
router.use(organizationMiddleware);

// تنفيذ محضر وإذن تسليم جثمان
router.post(
  '/',
  permissionMiddleware('BODY_HANDOVER'),
  HandoverController.processHandover
);

module.exports = router;