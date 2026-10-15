// routes/vehicleDispatchOrderRoutes.js
const express = require('express');
const router = express.Router();

const Ctrl = require('../controllers/VehicleDispatchOrderController');
const authMiddleware = require('../middlewares/authMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

router.use(authMiddleware);

router.get('/', permissionMiddleware('DISPATCH_ORDER_VIEW'), Ctrl.getAll);
router.get('/:id', permissionMiddleware('DISPATCH_ORDER_VIEW'), Ctrl.getById);
router.post('/', permissionMiddleware('DISPATCH_ORDER_CREATE'), Ctrl.create);
router.patch('/:id/status', permissionMiddleware('DISPATCH_ORDER_UPDATE'), Ctrl.updateStatus);
router.post('/:id/events', permissionMiddleware('DISPATCH_ORDER_UPDATE'), Ctrl.addTripEvent);
router.delete('/:id', permissionMiddleware('DISPATCH_ORDER_CREATE'), Ctrl.delete);

module.exports = router;