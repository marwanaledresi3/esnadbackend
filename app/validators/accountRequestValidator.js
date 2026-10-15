const { body, param } = require('express-validator');

exports.createAccountRequestValidation = [
  // الاسم الكامل
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('الاسم الكامل مطلوب')
    .isLength({ min: 3, max: 150 })
    .withMessage('الاسم الكامل يجب أن يكون بين 3 و150 حرفًا'),

  // اسم المستخدم
  body('username')
    .trim()
    .notEmpty()
    .withMessage('اسم المستخدم مطلوب')
    .isLength({ min: 3, max: 50 })
    .withMessage('اسم المستخدم يجب أن يكون بين 3 و50 حرفًا')
    .matches(/^[a-zA-Z0-9_.-]+$/)
    .withMessage('اسم المستخدم يحتوي على أحرف أو رموز غير مسموحة'),

  // كلمة المرور
  body('passwordHash')
    .notEmpty()
    .withMessage('كلمة المرور مطلوبة')
    .isLength({ min: 8, max: 128 })
    .withMessage('كلمة المرور يجب أن تكون بين 8 و128 حرفًا'),

  // رقم الهاتف
  body('phoneNumber')
    .trim()
    .notEmpty()
    .withMessage('رقم الهاتف مطلوب')
    .isLength({ max: 20 })
    .withMessage('رقم الهاتف طويل جدًا')
    .matches(/^\+?[0-9\s()-]+$/)
    .withMessage('صيغة رقم الهاتف غير صحيحة'),

  // // البريد الإلكتروني (اختياري)
  // body('email')
  //   .optional({ checkFalsy: true })
  //   .trim()
  //   .isEmail()
  //   .withMessage('البريد الإلكتروني غير صالح')
  //   .normalizeEmail(),

  // // المسمى الوظيفي (اختياري)
  // body('jobTitle')
  //   .optional({ checkFalsy: true })
  //   .trim()
  //   .isLength({ max: 100 })
  //   .withMessage('المسمى الوظيفي يجب ألا يتجاوز 100 حرف'),

  // معرّف المؤسسة
  body('organizationId')
    .notEmpty()
    .withMessage('معرّف المؤسسة مطلوب')
    .bail()
    .isUUID()
    .withMessage('معرّف المؤسسة غير صالح'),

  // معرّف المحافظة (اختياري)
  body('provinceId')
    .optional({ checkFalsy: true })
    .isUUID()
    .withMessage('معرّف المحافظة غير صالح'),

  // سبب طلب إنشاء الحساب
  body('requestReason')
    .trim()
    .notEmpty()
    .withMessage('سبب طلب إنشاء الحساب مطلوب')
    .isLength({ min: 10, max: 1000 })
    .withMessage('سبب الطلب يجب أن يكون بين 10 و1000 حرف'),
];

exports.approveAccountRequestValidation = [
  param('id').isUUID().withMessage('معرف الطلب غير صالح'),
  body('role_id').optional().isUUID().withMessage('معرف الدور غير صالح')
];