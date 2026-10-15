const pool = require('../config/db');
const CaseDisability = require('../models/CaseDisability');
const DisabilityType = require('../models/DisabilityType');
const { logAudit } = require('../utils/auditLogger');

class CaseDisabilityService {
    static async createDisability(caseId, data, user) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Case check & Organization Scope
            const caseRes = await client.query('SELECT id, organization_id FROM cases WHERE id = $1', [caseId]);
            if (caseRes.rows.length === 0) throw { status: 404, message: 'الحالة غير موجودة' };

            if (user.role !== 'SUPER_ADMIN' && caseRes.rows[0].organization_id !== user.organization_id) {
                throw { status: 403, message: 'غير مصرح لك بإضافة إعاقة لهذه الحالة' };
            }

            // 2. DisabilityType Status check
            const disType = await DisabilityType.findById(data.disability_type_id);
            if (!disType || disType.status !== 'active') {
                throw { status: 400, message: 'نوع الإعاقة/العجز المحدد غير فعال' };
            }

            // 3. Create Record
            const disabilityData = {
                ...data,
                case_id: parseInt(caseId),
                created_by: user.id
            };
            const newDisability = await CaseDisability.create(disabilityData, client);

            // 4. Audit Log
            await logAudit({
                userId: user.id,
                action: 'DISABILITY_CREATE',
                entity: 'case_disabilities',
                entityId: newDisability.id,
                details: { case_id: caseId, disability_type_id: data.disability_type_id },
                client
            });

            await client.query('COMMIT');
            return newDisability;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    static async getDisabilityById(id, user) {
        const record = await CaseDisability.findById(id);
        if (!record) throw { status: 404, message: 'سجل الإعاقة غير موجود' };

        if (user.role !== 'SUPER_ADMIN' && record.organization_id !== user.organization_id) {
            throw { status: 403, message: 'غير مصرح لك بالوصول لهذا السجل' };
        }
        return record;
    }

    static async getDisabilitiesByCase(caseId, user) {
        const caseRes = await pool.query('SELECT organization_id FROM cases WHERE id = $1', [caseId]);
        if (caseRes.rows.length === 0) throw { status: 404, message: 'الحالة غير موجودة' };

        if (user.role !== 'SUPER_ADMIN' && caseRes.rows[0].organization_id !== user.organization_id) {
            throw { status: 403, message: 'غير مصرح لك بالوصول لبيانات هذه الحالة' };
        }

        return await CaseDisability.findByCaseId(caseId);
    }

    static async updateDisability(id, data, user) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const existing = await CaseDisability.findById(id);
            if (!existing) throw { status: 404, message: 'سجل الإعاقة غير موجود' };

            if (user.role !== 'SUPER_ADMIN' && existing.organization_id !== user.organization_id) {
                throw { status: 403, message: 'غير مصرح لك بتعديل بيانات هذا السجل' };
            }

            if (data.disability_type_id) {
                const disType = await DisabilityType.findById(data.disability_type_id);
                if (!disType || disType.status !== 'active') {
                    throw { status: 400, message: 'نوع الإعاقة غير فعال' };
                }
            }

            const updated = await CaseDisability.update(id, data, client);

            await logAudit({
                userId: user.id,
                action: 'DISABILITY_UPDATE',
                entity: 'case_disabilities',
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

module.exports = CaseDisabilityService;