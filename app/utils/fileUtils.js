const fs = require('fs');
const path = require('path');
const { UPLOADS_DIR } = require('../config/constants');
const logger = require('./logger');

class FileUtils {
  // حفظ ملف مرفوع
  static async saveUploadedFile(file, subfolder = '') {
    try {
      const uploadPath = path.join(UPLOADS_DIR, subfolder);
      
      // إنشاء المجلد إذا لم يكن موجوداً
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }

      const fileName = `${Date.now()}-${file.originalname}`;
      const filePath = path.join(uploadPath, fileName);

      await fs.promises.writeFile(filePath, file.buffer);
      
      return {
        success: true,
        filePath,
        fileName
      };
    } catch (err) {
      logger.error(`فشل في حفظ الملف: ${err.message}`);
      return {
        success: false,
        error: err.message
      };
    }
  }

  // حذف ملف
  static async deleteFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        return true;
      }
      return false;
    } catch (err) {
      logger.error(`فشل في حذف الملف ${filePath}: ${err.message}`);
      return false;
    }
  }

  // التحقق من نوع الملف
  static checkFileType(file, allowedTypes) {
    const fileExt = path.extname(file.originalname).toLowerCase();
    const mimeType = file.mimetype;

    const isValidExt = allowedTypes.includes(fileExt);
    const isValidMime = allowedTypes.includes(mimeType);

    return isValidExt && isValidMime;
  }
}

module.exports = FileUtils;