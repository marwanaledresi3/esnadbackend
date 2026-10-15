const express = require('express');
const router = express.Router();

const IncidentController = require('../controllers/IncidentController');
const authMiddleware = require('../middlewares/authMiddleware');
const organizationMiddleware = require('../middlewares/organizationMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');
const { authorizeRecordAccess } = require('../middlewares/authorizeRecordAccess');

router.use(authMiddleware);
router.use(organizationMiddleware);

// استقبال بلاغ/حالة جديدة
router.post(
  '/',
  permissionMiddleware('CASE_CREATE'),
  IncidentController.createIncident
);

// استعراض البلاغات
router.get(
  '/',
  permissionMiddleware('CASE_VIEW'),
  IncidentController.getIncidents
);

// جلب بلاغ محدد
router.get(
  '/:id',
  permissionMiddleware('CASE_VIEW'),
  authorizeRecordAccess('CASE'),
  IncidentController.getIncidentById
);

module.exports = router;