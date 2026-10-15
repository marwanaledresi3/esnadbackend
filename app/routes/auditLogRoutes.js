// routes/auditLogRoutes.js
const express = require('express');
const router = express.Router();

const AuditLogController = require('../controllers/AuditLogController');
const authMiddleware = require('../middlewares/authMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

router.use(authMiddleware);

// كل المسارات تتطلب صلاحية AUDIT_VIEW
router.use(permissionMiddleware('AUDIT_VIEW'));

router.get('/', AuditLogController.getAll);
router.get('/stats', AuditLogController.getStats);
router.get('/actions', AuditLogController.getDistinctActions);
router.get('/entity-types', AuditLogController.getDistinctEntityTypes);
router.delete('/cleanup', AuditLogController.cleanup);
router.get('/:id', AuditLogController.getById);

module.exports = router;