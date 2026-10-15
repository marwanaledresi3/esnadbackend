// routes/caseDisabilityRoutes.js
const express = require('express');
const router = express.Router();

const CaseDisabilityController = require('../controllers/CaseDisabilityController');
const authMiddleware = require('../middlewares/authMiddleware');
const organizationMiddleware = require('../middlewares/organizationMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

router.use(authMiddleware);

// ── Sub-resource تحت /cases
router.get(
  '/cases/:caseId/disabilities',
  organizationMiddleware,
  permissionMiddleware('CASE_VIEW'),
  CaseDisabilityController.getByCaseId,
);

router.post(
  '/cases/:caseId/disabilities',
  organizationMiddleware,
  permissionMiddleware('CASE_UPDATE'),
  CaseDisabilityController.create,
);

// ── مباشر
router.get('/case-disabilities/stats', CaseDisabilityController.getStats);

router.put(
  '/case-disabilities/:id',
  organizationMiddleware,
  permissionMiddleware('CASE_UPDATE'),
  CaseDisabilityController.update,
);

router.delete(
  '/case-disabilities/:id',
  organizationMiddleware,
  permissionMiddleware('CASE_UPDATE'),
  CaseDisabilityController.delete,
);

module.exports = router;