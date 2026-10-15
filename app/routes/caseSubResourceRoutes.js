// routes/caseSubResourceRoutes.js
const express = require('express');
const router = express.Router();

const Ctrl = require('../controllers/CaseSubResourceController');
const authMiddleware = require('../middlewares/authMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

router.use(authMiddleware);

// Events
router.get('/:caseId/events', permissionMiddleware('CASE_VIEW'), Ctrl.getEvents);
router.post('/:caseId/events', permissionMiddleware('CASE_UPDATE'), Ctrl.createEvent);
router.delete('/events/:id', permissionMiddleware('CASE_UPDATE'), Ctrl.deleteEvent);

// Diagnoses
router.get('/:caseId/diagnoses', permissionMiddleware('CASE_VIEW'), Ctrl.getDiagnoses);
router.post('/:caseId/diagnoses', permissionMiddleware('CASE_UPDATE'), Ctrl.createDiagnosis);
router.delete('/diagnoses/:id', permissionMiddleware('CASE_UPDATE'), Ctrl.deleteDiagnosis);

// Operations
router.get('/:caseId/operations', permissionMiddleware('CASE_VIEW'), Ctrl.getOperations);
router.post('/:caseId/operations', permissionMiddleware('CASE_UPDATE'), Ctrl.createOperation);
router.delete('/operations/:id', permissionMiddleware('CASE_UPDATE'), Ctrl.deleteOperation);

module.exports = router;