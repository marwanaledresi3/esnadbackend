
const { pool } = require('../config/db');
const AccountRequest = require('../models/AccountRequest');
const OrganizationMembership = require('../models/OrganizationMembership');
const { logAudit } = require('../utils/auditLogger');
const ApiError = require('../errors/ApiError');

class AccountRequestService {

  // جلب قائمة طلبات الحسابات
  static async getRequestsList({ organizationId, status }) {
    return AccountRequest.getRequestsList({
      organizationId,
      status
    });
  }

  // تقديم طلب حساب جديد
  static async submitRequest(data) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. إنشاء طلب الحساب داخل المعاملة
      const request = await AccountRequest.create(data, client);

      // 2. تسجيل التدقيق داخل المعاملة نفسها
     
      await logAudit({
        client,
        userId: null,
        organizationId: data.organizationId,
        action: 'ACCOUNT_REQUEST_CREATED',
        entityType: 'ACCOUNT_REQUEST',
        entityId: request.id,
        result: 'success',
        newValues: {
          id: request.id,
          username: data.username,
          organizationId: data.organizationId
        }
      });


      await client.query('COMMIT');

      return request;

    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Submit request rollback failed:', rollbackError);
      }

      throw error;

    } finally {
      client.release();
    }
  }

  // الموافقة على طلب الحساب
  static async approveRequest({
    requestId,
    reviewedByUserId,
    reviewerOrgId,
    roleId,
    isSystemAdmin
  }) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. جلب الطلب وقفل صفه لمنع اعتماده مرتين
      const accountReq = await AccountRequest.findByIdForUpdate(
        requestId,
        client
      );

      if (!accountReq) {
        throw ApiError.notFound('طلب الحساب غير موجود');
      }

      if (accountReq.status !== 'pending') {
        throw ApiError.badRequest(
          'تمت معالجة طلب الحساب هذا سابقاً'
        );
      }

      // 2. التحقق من صلاحية الجهة
      if (
        !isSystemAdmin &&
        accountReq.organization_id !== reviewerOrgId
      ) {
        throw ApiError.forbidden(
          'لا تملك صلاحية اعتماد طلب حساب لجهة أخرى'
        );
      }

      // 3. تحديث حالة الطلب
      await AccountRequest.updateStatus(
        requestId,
        'approved',
        reviewedByUserId,
        null,
        client
      );

      // 4. إنشاء المستخدم
      const userRes = await client.query(
        `INSERT INTO users (
          full_name,
          phone,
          username,
          password_hash,
          email,
          organization_id,
          status,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'active', NOW())
        RETURNING id, username`,
        [
          accountReq.full_name,
          accountReq.phone,
          accountReq.requested_username,
          accountReq.password_hash,
          accountReq.email,
          accountReq.organization_id
        ]
      );

      const newUser = userRes.rows[0];

      // 5. إنشاء العضوية
      const membership = await OrganizationMembership.create(
          client,
  {
    userId: newUser.id,
    organizationId: accountReq.organization_id,
    status: 'active'
  }
      );

      // 6. إسناد الدور عند تحديده
      if (roleId) {
        await client.query(
          `INSERT INTO user_roles (
            user_id,
            organization_id,
            role_id,
            created_at
          )
          VALUES ($1, $2, $3, NOW())`,
          [
            newUser.id,
            accountReq.organization_id,
            roleId
          ]
        );
      }

      // 7. تسجيل التدقيق داخل المعاملة
      
await logAudit({
  client,
  userId: reviewedByUserId,
  organizationId: accountReq.organization_id,
  action: 'ACCOUNT_REQUEST_APPROVED',
  entityType: 'ACCOUNT_REQUEST',
  entityId: requestId,
  result: 'success',
  oldValues: {
    status: 'pending'
  },
  newValues: {
    status: 'approved',
    createdUserId: newUser.id,
    membershipId: membership.id
  }
});


      // 8. تثبيت جميع العمليات
      await client.query('COMMIT');

      return {
        userId: newUser.id,
        membershipId: membership.id
      };

    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Approve request rollback failed:', rollbackError);
      }

      throw error;

    } finally {
      client.release();
    }
  }

  // رفض طلب الحساب
  static async rejectRequest({
    requestId,
    reviewedByUserId,
    reviewerOrgId,
    rejectionReason,
    isSystemAdmin
  }) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. قفل الطلب قبل فحص حالته
      const accountReq = await AccountRequest.findByIdForUpdate(
        requestId,
        client
      );

      if (!accountReq) {
        throw ApiError.notFound('طلب الحساب غير موجود');
      }

      if (accountReq.status !== 'pending') {
        throw ApiError.badRequest(
          'تمت معالجة طلب الحساب هذا سابقاً'
        );
      }

      // 2. التحقق من الصلاحيات
      if (
        !isSystemAdmin &&
        accountReq.organization_id !== reviewerOrgId
      ) {
        throw ApiError.forbidden(
          'لا تملك صلاحية رفض طلب حساب لجهة أخرى'
        );
      }

      // 3. تحديث الحالة وسبب الرفض
      const updated = await AccountRequest.updateStatus(
        requestId,
        'rejected',
        reviewedByUserId,
        rejectionReason,
        client
      );

      // 4. تسجيل التدقيق
      
await logAudit({
  client,
  userId: reviewedByUserId,
  organizationId: accountReq.organization_id,
  action: 'ACCOUNT_REQUEST_REJECTED',
  entityType: 'ACCOUNT_REQUEST',
  entityId: requestId,
  result: 'success',
  oldValues: {
    status: 'pending'
  },
  newValues: {
    status: 'rejected',
    rejectionReason
  }
});

      // 5. تثبيت العملية
      await client.query('COMMIT');

      return updated;

    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Reject request rollback failed:', rollbackError);
      }

      throw error;

    } finally {
      client.release();
    }
  }
}

module.exports = AccountRequestService;
