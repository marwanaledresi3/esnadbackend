const { body } = require('express-validator');

exports.createLinkValidation = [
  body('source_organization_id').isUUID().withMessage('معرف الجهة المصدر غير صالح'),
  body('target_organization_id').isUUID().withMessage('معرف الجهة المستهدفة غير صالح'),
  body('link_type')
    .isIn(['ADMINISTRATIVE', 'REFERRAL', 'COORDINATION', 'SUPERVISION', 'OTHER'])
    .withMessage('نوع العلاقة غير صالح')
];