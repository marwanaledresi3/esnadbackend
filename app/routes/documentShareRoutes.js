// routes/documentShareRoutes.js
const express = require('express');
const router = express.Router();

const DocumentShareController = require('../controllers/DocumentShareController');
const authMiddleware = require('../middlewares/authMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

router.use(authMiddleware);

router.get('/', DocumentShareController.getAll);
router.get('/shared-with-me', DocumentShareController.getSharedWithMe);
router.get('/:id', DocumentShareController.getById);
router.post('/', permissionMiddleware('DOCUMENT_SHARE'), DocumentShareController.create);
router.patch('/:id/revoke', permissionMiddleware('DOCUMENT_SHARE'), DocumentShareController.revoke);
router.delete('/:id', permissionMiddleware('DOCUMENT_SHARE'), DocumentShareController.delete);

module.exports = router;