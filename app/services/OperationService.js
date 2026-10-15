const pool = require('../config/db');
const Operation = require('../models/Operation');
const OperationType = require('../models/OperationType');
const { logAudit } = require('../utils/auditLogger');

class OperationService {
    static async createOperation(caseId, data, user) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. التحقق من وجود الحالة وصلاحية الوصول (Organization Scope)
            const caseRes = await client.query('SELECT id, organization_id FROM cases WHERE id = $1', [caseId]);
            if (caseRes.rows.length === 0) {
                throw { status: 404, message: 'الحالة الطبية غير موجودة' };
            }
            if (user.role !== 'SUPER_ADMIN' && caseRes.rows[0].organization_id !== user.organization_id) {
                throw { status: 403, message: 'ليس لديك صلاحية الوصول لهذه الحالة' };
            }

            // 2. التحقق من وجود الفعالية لـ OperationType
            const opType = await OperationType.findById(data.operation_type_id);
            if (!opType || opType.status !== 'active') {
                throw { status: 400, message: 'نوع العملية غير معروف أو غير فعال' };
            }

            // 3. إنشاء الإجراء الطبي
            const operationData = {
                ...data,
                case_id: parseInt(caseId),
                created_by: user.id
            };
            const newOp = await Operation.create(operationData, client);

            // 4. تسجيل التدقيق
            await logAudit({
                userId: user.id,
                action: 'OPERATION_CREATE',
                entity: 'operations',
                entityId: newOp.id,
                details: { case_id: caseId, operation_type_id: data.operation_type_id },
                client
            });

            await client.query('COMMIT');
            return newOp;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    static async getOperationById(id, user) {
        const operation = await Operation.findById(id);
        if (!operation) throw { status: 404, message: 'العملية الطبية غير موجودة' };

        if (user.role !== 'SUPER_ADMIN' && operation.organization_id !== user.organization_id) {
            throw { status: 403, message: 'غير مصرح لك بالوصول لبيانات هذه العملية' };
        }
        return operation;
    }

    static async getOperationsByCase(caseId, user) {
        const caseRes = await pool.query('SELECT organization_id FROM cases WHERE id = $1', [caseId]);
        if (caseRes.rows.length === 0) throw { status: 404, message: 'الحالة غير موجودة' };

        if (user.role !== 'SUPER_ADMIN' && caseRes.rows[0].organization_id !== user.organization_id) {
            throw { status: 403, message: 'غير مصرح لك بالوصول لبيانات هذه الحالة' };
        }

        return await Operation.findByCaseId(caseId);
    }

    static async updateOperation(id, data, user) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const existing = await Operation.findById(id);
            if (!existing) throw { status: 404, message: 'العملية الطبية غير موجودة' };

            if (user.role !== 'SUPER_ADMIN' && existing.organization_id !== user.organization_id) {
                throw { status: 403, message: 'تجاوز الصلاحيات: لا يمكنك تعديل عملية تابعة لجهة أخرى' };
            }

            if (data.operation_type_id) {
                const opType = await OperationType.findById(data.operation_type_id);
                if (!opType || opType.status !== 'active') {
                    throw { status: 400, message: 'نوع العملية المحدد غير فعال' };
                }
            }

            const updated = await Operation.update(id, data, client);

            await logAudit({
                userId: user.id,
                action: 'OPERATION_UPDATE',
                entity: 'operations',
                entityId: id,
                details: data,
                client
            });

            await client.query('COMMIT');
            return updated;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
}

module.exports = OperationService;