const express = require('express');
const router = express.Router();
const ReportController = require('../controllers/ReportController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.use(authMiddleware);

// تحميل إذن التسليم كـ PDF
router.get('/handover-permit/:caseId', ReportController.downloadHandoverPermit);

// لوحة الإحصائيات للرؤساء والمديرين
router.get('/dashboard-stats', roleMiddleware(['ADMIN', 'SUPERVISOR']), ReportController.getDashboardStats);

module.exports = router;