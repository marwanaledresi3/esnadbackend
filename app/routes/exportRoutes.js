// routes/exportRoutes.js
const express = require('express');
const router = express.Router();

const ExportController = require('../controllers/ExportController');
const authMiddleware = require('../middlewares/authMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

router.use(authMiddleware);

// ══════════════════════════════════════════════
// الحالات
// ══════════════════════════════════════════════
router.get(
  '/cases/pdf',
  permissionMiddleware('CASE_VIEW'),
  ExportController.exportCasesPdf,
);

router.get(
  '/cases/excel',
  permissionMiddleware('CASE_VIEW'),
  ExportController.exportCasesExcel,
);

// ══════════════════════════════════════════════
// الجثامين
// ══════════════════════════════════════════════
router.get(
  '/body-cases/pdf',
  permissionMiddleware('BODY_VIEW'),
  ExportController.exportBodyCasesPdf,
);

router.get(
  '/body-cases/excel',
  permissionMiddleware('BODY_VIEW'),
  ExportController.exportBodyCasesExcel,
);

// ══════════════════════════════════════════════
// الوفيات
// ══════════════════════════════════════════════
router.get(
  '/deaths/pdf',
  permissionMiddleware('CASE_VIEW'),
  ExportController.exportDeathsPdf,
);

router.get(
  '/deaths/excel',
  permissionMiddleware('CASE_VIEW'),
  ExportController.exportDeathsExcel,
);

// ══════════════════════════════════════════════
// التصاريح
// ══════════════════════════════════════════════
router.get(
  '/authorizations/pdf',
  permissionMiddleware('AUTHORIZATION_VIEW'),
  ExportController.exportAuthorizationsPdf,
);

router.get(
  '/authorizations/excel',
  permissionMiddleware('AUTHORIZATION_VIEW'),
  ExportController.exportAuthorizationsExcel,
);

module.exports = router;