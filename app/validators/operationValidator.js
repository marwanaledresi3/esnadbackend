const { body, param } = require('express-validator');

exports.validateCreateOperation = [
    param('caseId').isInt().withMessage('رقم الحالة غير صحيح'),
    body('operation_type_id').isInt().withMessage('نوع العملية مطلوب وغير صحيح'),
    body('started_at').isISO8601().withMessage('تاريخ ووقت بداية العملية غير صحيح'),
    body('ended_at').optional({ nullable: true }).isISO8601().custom((value, { req }) => {
        if (value && new Date(value) < new Date(req.body.started_at)) {
            throw new Error('تاريخ الانتهاء يجب أن يكون بعد أو يساو تاريخ البداية');
        }
        return true;
    }),
    body('event_id').optional({ nullable: true }).isInt(),
    body('performed_by').optional().isString().trim(),
    body('facility_name').optional().isString().trim(),
    body('result_notes').optional().isString().trim()
];

exports.validateUpdateOperation = [
    param('id').isInt().withMessage('رقم العملية غير صحيح'),
    body('operation_type_id').optional().isInt(),
    body('started_at').optional().isISO8601(),
    body('ended_at').optional({ nullable: true }).isISO8601().custom((value, { req }) => {
        if (value && req.body.started_at && new Date(value) < new Date(req.body.started_at)) {
            throw new Error('تاريخ الانتهاء يجب أن يكون بعد تاريخ البداية');
        }
        return true;
    }),
    body('performed_by').optional().isString().trim(),
    body('facility_name').optional().isString().trim(),
    body('result_notes').optional().isString().trim()
];