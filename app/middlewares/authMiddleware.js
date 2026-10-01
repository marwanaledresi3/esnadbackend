const jwt = require('jsonwebtoken');
const ApiError = require('../errors/ApiError');

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // التحقق من وجود الترويسة وبدئها بـ Bearer
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('يرجى تسجيل الدخول للوصول لهذا المورد');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw ApiError.unauthorized('رمز التوثيق مفقود');
    }

    // فك وتشفير الرمز باستخدام المفتاح السري
    const secret = process.env.JWT_SECRET || 'super_secret_jwt_key';
    const decoded = jwt.verify(token, secret);

    // إرفاق بيانات المستخدم المحفوظة بالتوكن بالطلب
    req.user = {
      user_id: decoded.user_id,
      email: decoded.email,
      role: decoded.role,
      organization_id: decoded.organization_id || null
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(ApiError.unauthorized('رمز التوثيق غير صالح'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('انتهت صلاحية الجلسة، يرجى إعادة تسجيل الدخول'));
    }
    next(error);
  }
};

module.exports = authMiddleware;