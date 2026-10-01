const winston = require('winston');
const { combine, timestamp, printf, colorize, json } = winston.format;
const path = require('path');
const fs = require('fs');
const { LOGS_DIR } = require('../config/constants');
//const defaultLogDir = LOGS_DIR || path.join(__dirname, 'logs');
// إنشاء مجلد السجلات إذا لم يكن موجوداً
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR);
}

// تنسيق السجلات في وضع التطوير
const devFormat = printf(({ level, message, timestamp, stack }) => {
  let log = `${timestamp} [${level}]: ${message}`;
  if (stack) {
    log += `\n${stack}`;
  }
  return log;
});

// تهيئة نظام التسجيل
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    process.env.NODE_ENV === 'development' 
      ? combine(colorize(), devFormat)
      : json()
  ),
  transports: [
    // تسجيل الأخطاء في ملف منفصل
    new winston.transports.File({
      filename: path.join(LOGS_DIR, 'error.log'),
      level: 'error',
      handleExceptions: true
    }),
    
    // تسجيل جميع الأحداث في ملف آخر
    new winston.transports.File({
      filename: path.join(LOGS_DIR, 'combined.log')
    }),
    
    // إظهار السجلات في الكونسول في وضع التطوير
    ...(process.env.NODE_ENV === 'development' ? [
      new winston.transports.Console({
        handleExceptions: true
      })
    ] : [])
  ],
  exitOnError: false
});

// دفق السجلات للوصول إليها في الواجهة إذا لزم الأمر
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

module.exports = logger;