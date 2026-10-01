const express = require('express');
const router = express.Router();
const HandoverController = require('../controllers/HandoverController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.use(authMiddleware);

// تنفيذ محضر وإذن تسليم جثمان
router.post(
  '/', 
  roleMiddleware(['ADMIN', 'MORTUARY_OFFICER', 'FORENSIC_OFFICER']), 
  HandoverController.processHandover
);

module.exports = router;