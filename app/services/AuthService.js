const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../errors/ApiError');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/auth');

class AuthService {
  // تسجيل الدخول والتحقق من كلمة السر
  static async login(username, password) {
    const user = await User.findByUsername(username);
    if (!user) {
      throw ApiError.unauthorized('اسم المستخدم أو كلمة المرور غير صحيحة');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw ApiError.unauthorized('اسم المستخدم أو كلمة المرور غير صحيحة');
    }

    // إنشاء JWT Token يضم هويته ودوره والجهة التابع لها
    const payload = {
      user_id: user.user_id,
      username: user.username,
      full_name: user.full_name,
      role_code: user.role_code,
      organization_id: user.organization_id,
      org_type: user.org_type,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN || '12h' });

    return {
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        full_name: user.full_name,
        role_code: user.role_code,
        organization_id: user.organization_id,
        org_name: user.org_name,
      },
    };
  }

  // تسجيل حساب مستخدم جديد وتشفير كلمة السر
  static async registerUser(userData) {
    const existingUser = await User.findByUsername(userData.username);
    if (existingUser) {
      throw ApiError.badRequest('اسم المستخدم مسجل مسبقاً في النظام');
    }

    const saltRounds = 10;
    const password_hash = await bcrypt.hash(userData.password, saltRounds);

    const newUser = await User.create({
      ...userData,
      password_hash,
    });

    return newUser;
  }
}

module.exports = AuthService;