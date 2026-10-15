// routes/bodyHandoverRoutes.js
const express = require('express');
const router = express.Router();

const BodyHandoverController = require('../controllers/BodyHandoverController');
const authMiddleware = require('../middlewares/authMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

router.use(authMiddleware);

router.get('/', permissionMiddleware('BODY_VIEW'), BodyHandoverController.getAll);
router.get('/:id', permissionMiddleware('BODY_VIEW'), BodyHandoverController.getById);
router.post('/', permissionMiddleware('BODY_HANDOVER'), BodyHandoverController.create);
router.delete('/:id', permissionMiddleware('BODY_HANDOVER'), BodyHandoverController.delete);

module.exports = router;