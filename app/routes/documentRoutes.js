// routes/documentRoutes.js
const express = require('express');
const router = express.Router();

const DocumentController = require('../controllers/DocumentController');
const authMiddleware = require('../middlewares/authMiddleware');
const { upload } = require('../middlewares/uploadMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

router.use(authMiddleware);

// قائمة المستندات
router.get('/', DocumentController.getAll);

// مستند واحد
router.get('/:id', DocumentController.getById);

// تحميل الملف
router.get('/:id/download', DocumentController.download);

// رفع مستند جديد
router.post(
  '/',
  upload.single('file'),
  permissionMiddleware('DOCUMENT_UPLOAD'),
  DocumentController.create,
);

// تحديث
router.put('/:id', permissionMiddleware('DOCUMENT_UPLOAD'), DocumentController.update);

// حذف
router.delete('/:id', permissionMiddleware('DOCUMENT_DELETE'), DocumentController.delete);

// ربط بكيان
router.post('/:id/link', DocumentController.link);

// إلغاء ربط
router.delete('/links/:linkId', DocumentController.unlink);

module.exports = router;