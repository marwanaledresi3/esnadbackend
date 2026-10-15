// routes/bodyReleaseOrderRoutes.js
const express = require('express');
const router = express.Router();

const BodyReleaseOrderController = require('../controllers/BodyReleaseOrderController');
const authMiddleware = require('../middlewares/authMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

router.use(authMiddleware);

router.get('/', permissionMiddleware('BODY_VIEW'), BodyReleaseOrderController.getAll);
router.get('/:id', permissionMiddleware('BODY_VIEW'), BodyReleaseOrderController.getById);
router.post('/', permissionMiddleware('BODY_RELEASE_ISSUE'), BodyReleaseOrderController.create);
router.patch('/:id/execute', permissionMiddleware('BODY_RELEASE_EXECUTE'), BodyReleaseOrderController.execute);
router.delete('/:id', permissionMiddleware('BODY_RELEASE_ISSUE'), BodyReleaseOrderController.delete);

module.exports = router;