require('dotenv').config();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_default';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

class AuthConfig {
  // توليد رمز JWT جديد
  static generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });
  }

  // التحقق من صحة الرمز
  static verifyToken(token) {
    return jwt.verify(token, JWT_SECRET);
  }

  // تشفير كلمة المرور
  static async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  }

  // مقارنة كلمة المرور
  static async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }
}

module.exports = AuthConfig;