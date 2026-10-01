const express = require('express');
const router = express.Router();
const IncidentController = require('../controllers/IncidentController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.use(authMiddleware);

// استقبال بلاغ جديد
router.post(
  '/', 
  roleMiddleware(['DISPATCHER', 'RECEPTIONIST', 'ADMIN']), 
  IncidentController.createIncident
);

// استعراض البلاغات
router.get('/', IncidentController.getIncidents);

// جلب بلاغ محدد
router.get('/:incidentId', IncidentController.getIncidentById);

module.exports = router;