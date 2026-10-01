const express = require('express');
const router = express.Router();
const ForensicController = require('../controllers/ForensicController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const uploadMiddleware = require('../middlewares/uploadMiddleware');

router.use(authMiddleware);

// تقديم طلب فحص شرعي
router.post(
  '/requests', 
  roleMiddleware(['ADMIN', 'FORENSIC_OFFICER', 'RECEPTIONIST']), 
  ForensicController.createRequest
);

// عرض فحوصات حالة محددة
router.get('/case/:caseId', ForensicController.getRequestsByCase);

// تسجيل نتائج التقرير والصفة التشريحية (يدعم إرفاق المستندات)
router.post(
  '/requests/:forensicRequestId/report', 
  roleMiddleware(['ADMIN', 'FORENSIC_OFFICER']), 
  uploadMiddleware.single('attachment'), 
  ForensicController.submitReport
);

module.exports = router;