const { body, param } = require('express-validator');

exports.validateAddItem = [
    param('requestId').isInt().withMessage('رقم طلب النقل غير صحيح'),
    body('case_id').optional({ nullable: true }).isInt(),
    body('body_case_id').optional({ nullable: true }).isInt(),
    body().custom((body) => {
        const hasCase = body.case_id !== undefined && body.case_id !== null;
        const hasBodyCase = body.body_case_id !== undefined && body.body_case_id !== null;
        
        if (!hasCase && !hasBodyCase) {
            throw new Error('يجب تحديد إما حالة مريض (case_id) أو جثمان (body_case_id)');
        }
        if (hasCase && hasBodyCase) {
            throw new Error('لا يمكن اختيار حالة مريض وجثمان في نفس العنصر');
        }
        return true;
    }),
    body('notes').optional().isString().trim()
];