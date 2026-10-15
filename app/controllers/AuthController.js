const AuthService = require('../services/AuthService');
const apiResponse = require('../utils/apiResponse');

class AuthController {
  static async login(req, res, next) {
    try {
      const { username, password } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const result = await AuthService.login(
        username,
        password,
        ipAddress,
        userAgent
      );

      return apiResponse.success(res, 'تم تسجيل الدخول بنجاح', result);
    } catch (error) {
      next(error);
    }
  }

  static async me(req, res, next) {
    try {
      const user = await AuthService.getCurrentUser(req.user.id);
      return apiResponse.success(res, 'بيانات المستخدم الحالي', user);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;