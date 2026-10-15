const { body, param } = require('express-validator');

exports.validateCreateDisability = [
    param('caseId').isInt().withMessage('رقم الحالة غير صحيح'),
    body('disability_type_id').isInt().withMessage('نوع الإعاقة/العجز مطلوب'),
    body('severity').optional().isIn(['mild', 'moderate', 'severe', 'total']).withMessage('درجة الشدة غير صحيحة'),
    body('diagnosed_at').optional({ nullable: true }).isISO8601().withMessage('تاريخ التشخيص غير صحيح'),
    body('notes').optional().isString().trim()
];

exports.validateUpdateDisability = [
    param('id').isInt().withMessage('رقم الإعاقة غير صحيح'),
    body('disability_type_id').optional().isInt(),
    body('severity').optional().isIn(['mild', 'moderate', 'severe', 'total']),
    body('diagnosed_at').optional({ nullable: true }).isISO8601(),
    body('notes').optional().isString().trim()
];