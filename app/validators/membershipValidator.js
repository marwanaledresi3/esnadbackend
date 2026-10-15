const { body, param } = require('express-validator');

exports.updateMembershipValidation = [
  param('userId').isUUID().withMessage('معرف المستخدم غير صالح'),
  body('status')
    .isIn(['ACTIVE', 'SUSPENDED', 'ENDED'])
    .withMessage('حالة العضوية غير صالحة')
];