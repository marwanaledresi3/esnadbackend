const { body, param } = require('express-validator');

exports.shareRecordValidation = [
  body('entity_type')
    .isIn(['CASE', 'DOCUMENT', 'REPORT', 'FORENSIC_REQUEST', 'BODY_CASE', 'TRANSPORT_REQUEST'])
    .withMessage('نوع الكيان غير صالح'),
  body('entity_id').isUUID().withMessage('معرف السجل غير صالح'),
  body('target_organization_id').isUUID().withMessage('معرف الجهة المستلمة غير صالح')
];

exports.revokeShareValidation = [
  param('shareId').isUUID().withMessage('معرف السجل المشارك غير صالح'),
  body('reason').notEmpty().withMessage('سبب سحب المشاركة وجوبي ولا يمكن تركه فارغاً')
];