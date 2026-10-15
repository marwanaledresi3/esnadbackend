const {pool} = require('../config/db');
const TransportRequestItem = require('../models/TransportRequestItem');
const { logAudit } = require('../utils/auditLogger');

class TransportRequestItemService {
    static async getAllRequests({ userId, organizationId, status }) {
        const query = `
      SELECT * FROM transport_requests
      WHERE requester_organization_id = $1
      ${status ? 'AND status = $2' : ''}
    `;
        const params = [organizationId];
        if (status) params.push(status);

        const res = await pool.query(query, params);
        return res.rows;
    }

    static async addItem(requestId, data, user) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. التحقق من وجود طلب النقل وحالته
            const reqRes = await client.query('SELECT id, organization_id, status FROM transport_requests WHERE id = $1', [requestId]);
            if (reqRes.rows.length === 0) throw { status: 404, message: 'طلب النقل غير موجود' };

            const transportReq = reqRes.rows[0];

            if (user.role !== 'SUPER_ADMIN' && transportReq.organization_id !== user.organization_id) {
                throw { status: 403, message: 'غير مصرح لك بإضافة عناصر لهذا الطلب' };
            }

            // يمنع التعديل إذا تحول الطلب إلى مرحلة الاعتماد أو التنفيذ
            const lockedStatuses = ['approved', 'in_transit', 'completed', 'cancelled'];
            if (lockedStatuses.includes(transportReq.status)) {
                throw { status: 422, message: `لا يمكن تعديل عناصر طلب النقل لأنه في حالة: ${transportReq.status}` };
            }

            // 2. التحقق من وجود Case أو BodyCase وضمان التبعية للجهة
            if (data.case_id) {
                const cRes = await client.query('SELECT organization_id FROM cases WHERE id = $1', [data.case_id]);
                if (cRes.rows.length === 0) throw { status: 404, message: 'الحالة الطبية غير موجودة' };
                if (user.role !== 'SUPER_ADMIN' && cRes.rows[0].organization_id !== user.organization_id) {
                    throw { status: 403, message: 'الحالة المحددة تابعة لجهة أخرى' };
                }
            } else if (data.body_case_id) {
                const bcRes = await client.query('SELECT organization_id FROM body_cases WHERE id = $1', [data.body_case_id]);
                if (bcRes.rows.length === 0) throw { status: 404, message: 'سجل الجثمان غير موجود' };
                if (user.role !== 'SUPER_ADMIN' && bcRes.rows[0].organization_id !== user.organization_id) {
                    throw { status: 403, message: 'سجل الجثمان المحدد تابع لجهة أخرى' };
                }
            }

            // 3. إضافة العنصر
            const itemData = {
                transport_request_id: parseInt(requestId),
                case_id: data.case_id,
                body_case_id: data.body_case_id,
                notes: data.notes,
                created_by: user.id
            };

            const newItem = await TransportRequestItem.create(itemData, client);

            await logAudit({
                userId: user.id,
                action: 'TRANSPORT_ITEM_CREATE',
                entity: 'transport_request_items',
                entityId: newItem.id,
                details: { transport_request_id: requestId, case_id: data.case_id, body_case_id: data.body_case_id },
                client
            });

            await client.query('COMMIT');
            return newItem;
        } catch (error) {
            await client.query('ROLLBACK');
            if (error.code === '23505') { // Unique constraint violation
                throw { status: 409, message: 'تم إضافة هذه الحالة/الجثمان مسبقاً في نفس طلب النقل' };
            }
            throw error;
        } finally {
            client.release();
        }
    }

    static async getItemsByRequest(requestId, user) {
        const reqRes = await pool.query('SELECT organization_id FROM transport_requests WHERE id = $1', [requestId]);
        if (reqRes.rows.length === 0) throw { status: 404, message: 'طلب النقل غير موجود' };

        if (user.role !== 'SUPER_ADMIN' && reqRes.rows[0].organization_id !== user.organization_id) {
            throw { status: 403, message: 'غير مصرح لك بزيارة عناصر هذا الطلب' };
        }

        return await TransportRequestItem.findByRequestId(requestId);
    }

    static async getItemById(id, user) {
        const item = await TransportRequestItem.findById(id);
        if (!item) throw { status: 404, message: 'عنصر طلب النقل غير موجود' };

        if (user.role !== 'SUPER_ADMIN' && item.organization_id !== user.organization_id) {
            throw { status: 403, message: 'غير مصرح لك بزيارة هذا العنصر' };
        }
        return item;
    }

    static async removeItem(id, user) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const item = await TransportRequestItem.findById(id);
            if (!item) throw { status: 404, message: 'عنصر طلب النقل غير موجود' };

            if (user.role !== 'SUPER_ADMIN' && item.organization_id !== user.organization_id) {
                throw { status: 403, message: 'غير مصرح لك بإزالة عناصر من هذا الطلب' };
            }

            const lockedStatuses = ['approved', 'in_transit', 'completed', 'cancelled'];
            if (lockedStatuses.includes(item.request_status)) {
                throw { status: 422, message: 'لا يمكن إزالة العنصر بعد وصول طلب النقل لمرحلة الاعتماد أو التنفيذ' };
            }

            const deletedItem = await TransportRequestItem.delete(id, client);

            await logAudit({
                userId: user.id,
                action: 'TRANSPORT_ITEM_REMOVE',
                entity: 'transport_request_items',
                entityId: id,
                details: { transport_request_id: item.transport_request_id, case_id: item.case_id, body_case_id: item.body_case_id },
                client
            });

            await client.query('COMMIT');
            return deletedItem;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
    /**
   * 1. قبول طلب النقل بواسطة المستشفى
   */
  static async approveRequest(requestId, { userId, organizationId }) {
    const request = await TransportRequest.findById(requestId);
    if (!request) {
      throw ApiError.notFound('طلب النقل غير موجود');
    }

    // التأكد من أن المستشفى الحالي هو المستلم/الموجه إليه الطلب
    if (request.destination_organization_id !== organizationId && request.receiving_organization_id !== organizationId) {
      throw ApiError.forbidden('غير مصرح لمستشفاكم بقبول طلب نقل موجه لجهة أخرى');
    }

    if (request.status !== 'pending') {
      throw ApiError.badRequest(`لا يمكن قبول الطلب وهو في حالة (${request.status})`);
    }

    // تحديث حالة الطلب إلى approved
    const updatedRequest = await TransportRequest.updateStatus(requestId, {
      status: 'approved',
      userId
    });

    return updatedRequest;
  }

  /**
   * 2. رفض طلب النقل من قبل المستشفى مع تسجيل السبب
   */
  static async rejectRequest(requestId, { reason }, { userId, organizationId }) {
    if (!reason || reason.trim() === '') {
      throw ApiError.badRequest('يرجى توضيح سبب رفض طلب النقل');
    }

    const request = await TransportRequest.findById(requestId);
    if (!request) {
      throw ApiError.notFound('طلب النقل غير موجود');
    }

    if (request.destination_organization_id !== organizationId && request.receiving_organization_id !== organizationId) {
      throw ApiError.forbidden('غير مصرح لمستشفاكم بفض طلب نقل موجه لجهة أخرى');
    }

    if (request.status !== 'pending') {
      throw ApiError.badRequest(`لا يمكن رفض الطلب وهو في حالة (${request.status})`);
    }

    // تحديث حالة الطلب إلى rejected وتسجيل السبب
    const updatedRequest = await TransportRequest.updateStatus(requestId, {
      status: 'rejected',
      rejectionReason: reason,
      userId
    });

    return updatedRequest;
  }
}

module.exports = TransportRequestItemService;