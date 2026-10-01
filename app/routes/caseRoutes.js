const express = require('express');
const router = express.Router();
const CaseController = require('../controllers/CaseController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const uploadMiddleware = require('../middlewares/uploadMiddleware');

// حماية كافة المسارات بالمصادقة
router.use(authMiddleware);

// تسجيل حالة جديدة (يدعم إرفاق صورة)
router.post(
  '/', 
  roleMiddleware(['DISPATCHER', 'RECEPTIONIST', 'PARAMEDIC', 'ADMIN']), 
  uploadMiddleware.single('photo'), 
  CaseController.createCase
);

// جلب تفاصيل الحالة و الـ Timeline
router.get('/:caseId', CaseController.getCaseDetails);

// تدوين حدث مساري في الـ Timeline
router.post(
  '/:caseId/events', 
  roleMiddleware(['DISPATCHER', 'DOCTOR', 'FORENSIC_OFFICER', 'ADMIN']), 
  CaseController.addEvent
);

module.exports = router;