const ApiError = require('../errors/ApiError');

/**
 * ميدلوير للتحقق من صلاحيات الأدوّار
 * @param {Array<string>|string} allowedRoles - الأدوار المسموح لها بعبور المسار
 */
const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return next(ApiError.unauthorized('معلومات التوثيق غير مكتملة'));
    }

    // تحويل القيمة لمصفوفة إذا كُتبت كـ string منفرد
    const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    // التحقق من وجود دور المستخدم بين الأدوار المسموح بها
    if (!rolesArray.includes(req.user.role)) {
      return next(
        ApiError.forbidden('ليس لديك الصلاحية الكافية لتنفيذ هذا الإجراء')
      );
    }

    next();
  };
};

module.exports = roleMiddleware;