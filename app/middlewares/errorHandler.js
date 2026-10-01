const ApiError = require('../errors/ApiError');

const errorHandler = (err, req, res, next) => {
  let error = err;

  // إذا لم يكن الخطأ مخصصاً من ApiError، نتحقق من نوعه ونقوم بتحويله
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || error.status || 500;
    const message = error.message || 'حدث خطأ غير متوقع في الخادم';
    error = new ApiError(statusCode, message, [], false);
  }

  // معالجة أخطاء تعارض قيود قاعدة البيانات (PostgreSQL Error Codes)
  if (err.code === '23505') { // Unique constraint violation
    error = ApiError.conflict('قيمة المورد المرفقة مسجلة مسبقاً في النظام');
  } else if (err.code === '23503') { // Foreign key violation
    error = ApiError.badRequest('البيانات المرتبطة غير موجودة أو معطوبة');
  }

  const responsePayload = {
    success: false,
    message: error.message,
    errors: error.errors && error.errors.length > 0 ? error.errors : undefined,
    timestamp: new Date().toISOString()
  };

  // إظهار التفاصيل البرمجية للخطأ (Stack Trace) فقط في بيئة التطوير
  if (process.env.NODE_ENV === 'development') {
    responsePayload.stack = err.stack;
  }

  return res.status(error.statusCode).json(responsePayload);
};

module.exports = errorHandler;