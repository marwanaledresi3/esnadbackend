const express = require('express');
const router = express.Router();

const DashboardController = require('../controllers/DashboardController');
const authMiddleware = require('../middlewares/authMiddleware');
const organizationMiddleware = require('../middlewares/organizationMiddleware');

// حماية المسار وتحديد الجهة النشطة
router.get(
  '/',
  authMiddleware,
  organizationMiddleware,
  DashboardController.getDashboard
);


router.get('/summary',
  authMiddleware,
   DashboardController.getSummary
);

module.exports = router;