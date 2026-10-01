const { HTTP_STATUS } = require('../config/constants');
const logger = require('../utils/logger');

// معالج الأخطاء المركزي
const errorHandler = (err, req, res, next) => {
  // تسجيل الخطأ
  logger.error(`Error: ${err.message}`, {
    url: req.originalUrl,
    method: req.method,
    body: req.body,
    stack: err.stack
  });

  // تحديد كود الحالة والرسالة
  const statusCode = err.status || HTTP_STATUS.INTERNAL_ERROR;
  const message = err.message || 'حدث خطأ في الخادم';

  // إرسال الاستجابة
  res.status(statusCode).json({
    success: false,
    message,
    errors: err.errors || undefined,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

// معالج لطلبات غير موجودة
const notFound = (req, res, next) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: 'مسار API غير موجود',
    requestedUrl: req.originalUrl
  });
};

// التحقق من صحة البيانات
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'بيانات غير صالحة',
        errors
      });
    }

    // استبدال body بالبيانات المفلترة
    req.body = value;
    next();
  };
};

module.exports = {
  errorHandler,
  notFound,
  validateRequest
};