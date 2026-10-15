// validators/lookupValidator.js
const { body, param, validationResult } = require('express-validator');

const validTypes = [
  'provinces',
  'case-event-types',
  'diagnosis-types',
  'authorization-types',
  'document-types',
  'report-types',
  'notification-types',
  'operation-types',
  'disability-types',
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }
  next();
};

exports.validateLookupType = [
  param('type')
    .isIn(validTypes)
    .withMessage('نوع الدليل المرجعي المطلوبة غير صالحة'),
  validate,
];

exports.validateCreateLookup = [
  param('type').isIn(validTypes),
  body('code').trim().notEmpty().withMessage('الرمز (code) مطلوب').isUppercase().withMessage('الرمز يجب أن يكون بالحروف الكبيرة'),
  body('name').trim().notEmpty().withMessage('الاسم العرض (name) مطلوب'),
  body('description').optional().trim(),
  validate,
];

exports.validateUpdateLookup = [
  param('type').isIn(validTypes),
  param('id').isUUID().withMessage('معرف العنصر غیر صالح'),
  body('name').optional().trim().notEmpty(),
  body('status').optional().isIn(['active', 'inactive']).withMessage('الحالة يجب أن تكون active أو inactive'),
  validate,
];