const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ApiError = require('../errors/ApiError');

// التأكد من وجود مجلد رفع الملفات محلياً
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 1. إعداد مسار واسم تخزين الملفات
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // توليد اسم فريد يمنع التضارب: timestamp-uniqueSuffix.ext
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// 2. تصفية أنواع الملفات المقبولة (صور + ملفات مستندات PDF/Word)
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      ApiError.badRequest('نوع الملف غير مدعوم! يسمح فقط برفع الصور ومستندات PDF/Word'),
      false
    );
  }
};

// 3. ضبط حدود حجم الملفات (الحد الأقصى 10 ميجابايت)
const uploadMiddleware = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

module.exports = uploadMiddleware;