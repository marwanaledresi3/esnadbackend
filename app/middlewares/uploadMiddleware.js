// middlewares/uploadMiddleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// مجلد الرفع
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'documents');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// تخزين الملفات
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const unique = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${unique}${ext}`);
  },
});

// فلترة الملفات المسموحة
const fileFilter = (req, file, cb) => {
  const allowed = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/jpg',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('نوع الملف غير مدعوم'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 },   // 20 MB
});

module.exports = { upload, UPLOAD_DIR };