// routes/deathRecordRoutes.js
const express = require('express');
const router = express.Router();

const DeathRecordController = require('../controllers/DeathRecordController');
const authMiddleware = require('../middlewares/authMiddleware');
const organizationMiddleware = require('../middlewares/organizationMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

router.use(authMiddleware);

router.get('/', organizationMiddleware, permissionMiddleware('CASE_VIEW'), DeathRecordController.getAll);
router.get('/count', DeathRecordController.count);
router.get('/:id', organizationMiddleware, permissionMiddleware('CASE_VIEW'), DeathRecordController.getById);
router.post('/', organizationMiddleware, permissionMiddleware('CASE_UPDATE'), DeathRecordController.create);
router.put('/:id', organizationMiddleware, permissionMiddleware('CASE_UPDATE'), DeathRecordController.update);
router.delete('/:id', organizationMiddleware, permissionMiddleware('CASE_UPDATE'), DeathRecordController.delete);

module.exports = router;