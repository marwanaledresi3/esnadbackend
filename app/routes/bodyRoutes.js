const express = require('express');
const router = express.Router();
const BodyController = require('../controllers/BodyController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.use(authMiddleware);

// إيداع جثمان بالثلاجة
router.post(
  '/receive', 
  roleMiddleware(['ADMIN', 'MORTUARY_OFFICER', 'RECEPTIONIST']), 
  BodyController.receiveBody
);

// استعلام عن موقع الجثمان
router.get('/case/:caseId', BodyController.getBodyLocation);

module.exports = router;