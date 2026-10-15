// routes/forensicRequestRoutes.js
const express = require('express');
const router = express.Router();

const ForensicRequestController = require('../controllers/ForensicRequestController');
const authMiddleware = require('../middlewares/authMiddleware');
const organizationMiddleware = require('../middlewares/organizationMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

router.use(authMiddleware);

router.get('/', organizationMiddleware, permissionMiddleware('FORENSIC_VIEW'), ForensicRequestController.getAll);
router.get('/:id', organizationMiddleware, permissionMiddleware('FORENSIC_VIEW'), ForensicRequestController.getById);
router.post('/', organizationMiddleware, permissionMiddleware('FORENSIC_CREATE'), ForensicRequestController.create);
router.put('/:id', organizationMiddleware, permissionMiddleware('FORENSIC_CREATE'), ForensicRequestController.update);
router.patch('/:id/status', organizationMiddleware, ForensicRequestController.changeStatus);
router.patch('/:id/authorize', organizationMiddleware, permissionMiddleware('FORENSIC_AUTHORIZE'), ForensicRequestController.authorize);
router.patch('/:id/complete', organizationMiddleware, permissionMiddleware('FORENSIC_EXAM_COMPLETE'), ForensicRequestController.complete);
router.delete('/:id', organizationMiddleware, permissionMiddleware('FORENSIC_CREATE'), ForensicRequestController.delete);

// Examinations
// router.post('/:id/examinations', ForensicRequestController.addExamination);
router.get(
  '/:id/examinations',
  organizationMiddleware,
  permissionMiddleware('FORENSIC_VIEW'),
  ForensicRequestController.getExaminations,
);

router.post(
  '/:id/examinations',
  organizationMiddleware,
  permissionMiddleware('FORENSIC_CREATE'),
  ForensicRequestController.addExamination,
);

router.put(
  '/examinations/:examId',
  organizationMiddleware,
  permissionMiddleware('FORENSIC_CREATE'),
  ForensicRequestController.updateExamination,
);

router.delete(
  '/examinations/:examId',
  organizationMiddleware,
  permissionMiddleware('FORENSIC_CREATE'),
  ForensicRequestController.deleteExamination,
);
module.exports = router;