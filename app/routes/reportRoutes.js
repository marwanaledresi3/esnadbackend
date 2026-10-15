// routes/reportRoutes.js
const express = require('express');
const router = express.Router();

const ReportController = require('../controllers/ReportController');
const authMiddleware = require('../middlewares/authMiddleware');
const organizationMiddleware = require('../middlewares/organizationMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

router.use(authMiddleware);

// ==================== Reports ====================
router.get('/', organizationMiddleware, permissionMiddleware('REPORT_VIEW'), ReportController.getAll);
router.get('/shared-with-me', ReportController.getSharedWith);
router.get('/preview/:code', permissionMiddleware('REPORT_CREATE'), ReportController.preview);
router.get('/:id', organizationMiddleware, permissionMiddleware('REPORT_VIEW'), ReportController.getById);
router.post('/', organizationMiddleware, permissionMiddleware('REPORT_CREATE'), ReportController.create);
router.delete('/:id', organizationMiddleware, permissionMiddleware('REPORT_CREATE'), ReportController.delete);

// Shares
router.post('/:id/share', organizationMiddleware, permissionMiddleware('REPORT_VIEW'), ReportController.share);
router.patch('/shares/:shareId/revoke', organizationMiddleware, ReportController.revokeShare);

// ==================== Requests ====================
router.get('/requests/all', organizationMiddleware, ReportController.getAllRequests);
router.post('/requests', organizationMiddleware, ReportController.createRequest);
router.patch('/requests/:id/status', organizationMiddleware, ReportController.updateRequestStatus);
router.delete('/requests/:id', organizationMiddleware, ReportController.deleteRequest);

module.exports = router;

