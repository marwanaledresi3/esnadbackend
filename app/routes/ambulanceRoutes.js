// routes/ambulanceRoutes.js
const express = require('express');
const router = express.Router();

const AmbulanceController = require('../controllers/AmbulanceController');
const authMiddleware = require('../middlewares/authMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

router.use(authMiddleware);

router.get('/', 
  AmbulanceController.getAll
);
router.get('/count',
   AmbulanceController.count
);
router.get('/:id', 
  AmbulanceController.getById
);
router.post('/',
   permissionMiddleware('VEHICLE_MANAGE'), 
   AmbulanceController.create
);
router.put('/:id', 
  permissionMiddleware('VEHICLE_MANAGE'),
   AmbulanceController.update
);
router.patch('/:id/status',
  permissionMiddleware('VEHICLE_MANAGE'),
   AmbulanceController.changeStatus
);

router.delete('/:id',
   permissionMiddleware('VEHICLE_MANAGE'), 
   AmbulanceController.delete
);

module.exports = router;