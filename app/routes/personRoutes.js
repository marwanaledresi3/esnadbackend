const express = require('express');
const router = express.Router();
const PersonController = require('../controllers/PersonController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.use(authMiddleware);

// البحث عن شخص برقم الهوية أو الرقم الموحد
router.get('/search', PersonController.getPersonByIdentification);

// عرض قائمة مجهولي الهوية
router.get('/unidentified', PersonController.getUnidentifiedPersons);

// تحديث وتثبيت هوية شخص مجهول
router.patch(
  '/:personId/identify', 
  roleMiddleware(['ADMIN', 'RECEPTIONIST', 'FORENSIC_OFFICER']), 
  PersonController.identifyPerson
);

module.exports = router;