const AuthService = require('../services/AuthService');
const apiResponse = require('../utils/apiResponse');

class AuthController {
  static async login(req, res, next) {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ success: false, message: 'يرجى إدخال اسم المستخدم وكلمة المرور' });
      }

      const result = await AuthService.login(username, password);
      return apiResponse.success(res, 'تم تسجيل الدخول بنجاح', result);
    } catch (error) {
      next(error);
    }
  }

  static async me(req, res, next) {
    try {
      return apiResponse.success(res, 'بيانات المستخدم الحالي', req.user);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;