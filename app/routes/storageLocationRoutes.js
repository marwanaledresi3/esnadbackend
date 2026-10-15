// routes/storageLocationRoutes.js
const express = require('express');
const router = express.Router();

const StorageLocationController = require('../controllers/StorageLocationController');
const authMiddleware = require('../middlewares/authMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

router.use(authMiddleware);

router.get('/', StorageLocationController.getAll);
router.get('/count', StorageLocationController.count);
router.get('/:id', StorageLocationController.getById);
router.post('/', permissionMiddleware('BODY_CREATE'), StorageLocationController.create);
router.put('/:id', permissionMiddleware('BODY_CREATE'), StorageLocationController.update);
router.patch('/:id/status', permissionMiddleware('BODY_CREATE'), StorageLocationController.changeStatus);
router.delete('/:id', permissionMiddleware('BODY_CREATE'), StorageLocationController.delete);

module.exports = router;