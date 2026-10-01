const AuthService = require('../services/AuthService');
const User = require('../models/User');
const apiResponse = require('../utils/apiResponse');

class UserController {
  // إنشاء مستخدم جديد (متاح للمديرين فقط)
  static async createUser(req, res, next) {
    try {
      const newUser = await AuthService.registerUser(req.body);
      return apiResponse.success(res, 'تم إنشاء حساب المستخدم بنجاح', newUser, 201);
    } catch (error) {
      next(error);
    }
  }

  // عرض قائمة المستخدمين
  static async getUsers(req, res, next) {
    try {
      const { organization_id, role_code, limit, offset } = req.query;
      const users = await User.findAll({ organization_id, role_code, limit, offset });
      return apiResponse.success(res, 'قائمة المستخدمين', users);
    } catch (error) {
      next(error);
    }
  }

  // تفعيل أو تعطيل حساب
  static async toggleUserStatus(req, res, next) {
    try {
      const { userId } = req.params;
      const { is_active } = req.body;
      const updatedUser = await User.updateStatus(userId, is_active);
      return apiResponse.success(res, 'تم تحديث حالة الحساب بنجاح', updatedUser);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UserController;