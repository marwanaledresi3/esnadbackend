// routes/attachmentRoutes.js
const express = require('express');
const router = express.Router();
const AttachmentController = require('../controllers/AttachmentController');
const authMiddleware = require('../middlewares/authMiddleware');
const uploadMiddleware = require('../middlewares/uploadMiddleware');

router.use(authMiddleware);

router.post('/upload', uploadMiddleware.single('file'), AttachmentController.uploadAttachment);
router.get('/case/:caseId', AttachmentController.getCaseAttachments);

module.exports = router;