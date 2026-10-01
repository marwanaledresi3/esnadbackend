class ApiResponse {
  /**
   * إرسال استجابة نجاح قياسية
   * @param {Object} res - كائن الاستجابة الخاص بـ Express
   * @param {string} message - رسالة توضيحية للمستخدم
   * @param {Object|Array|null} data - البيانات المراد إرجاعها
   * @param {number} statusCode - رمز حالة الـ HTTP (الافتراضي 200)
   */
  static success(res, message = 'تمت العملية بنجاح', data = null, statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * إرسال استجابة لإنشاء مورد بنجاح (201 Created)
   */
  static created(res, message = 'تم إنشاء المورد بنجاح', data = null) {
    return this.success(res, message, data, 201);
  }
}

module.exports = ApiResponse;