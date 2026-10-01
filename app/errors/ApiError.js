class ApiError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true; // لتمييز أخطاء العمليات المتوقعة عن أخطاء البرمجة (Bugs)

    Error.captureStackTrace(this, this.constructor);
  }

  // 400 Bad Request
  static badRequest(message = 'طلب غير صالح أو مدخلات غير مكتملة', errors = []) {
    return new ApiError(400, message, errors);
  }

  // 401 Unauthorized
  static unauthorized(message = 'غير مصرح بالوصول، يرجى تسجيل الدخول') {
    return new ApiError(401, message);
  }

  // 403 Forbidden
  static forbidden(message = 'ليس لديك الصلاحيات الكافية لتنفيذ هذا الإجراء') {
    return new ApiError(403, message);
  }

  // 404 Not Found
  static notFound(message = 'المورد المطلوب غير موجود') {
    return new ApiError(404, message);
  }

  // 409 Conflict
  static conflict(message = 'يوجد تعارض في البيانات الإدخالية') {
    return new ApiError(409, message);
  }

  // 500 Internal Server Error
  static internal(message = 'حدث خطأ داخلي في الخادم، يرجى المحاولة لاحقاً') {
    return new ApiError(500, message);
  }
}

module.exports = ApiError;