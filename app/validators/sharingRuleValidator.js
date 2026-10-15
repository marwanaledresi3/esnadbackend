const { body } = require('express-validator');

exports.createSharingRuleValidation = [
  body('organization_link_id').isUUID().withMessage('معرف علاقة الربط غير صالح'),
  body('entity_type')
    .isIn(['CASE', 'DOCUMENT', 'REPORT', 'FORENSIC_REQUEST', 'BODY_CASE', 'TRANSPORT_REQUEST'])
    .withMessage('نوع الكيان المسموح به غير صالح'),
  body('permission_type')
    .optional()
    .isIn(['VIEW', 'CREATE'])
    .withMessage('نوع الصلاحية غير صالح')
];