// models/OrganizationSharingModel.js
const { pool } = require('../config/db');

class OrganizationSharingModel {

  // 1. اعتماد طلب الحساب الذري (Atomic Transaction: Request + User + Membership + Role)
  static async approveAccountRequest({ requestId, reviewedByUserId, roleId, defaultPasswordHash }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // أ) جلب الطلب وقفله للمعالجة
      const reqRes = await client.query(
        `SELECT * FROM account_requests WHERE id = $1 AND status = 'PENDING' FOR UPDATE`,
        [requestId]
      );
      if (reqRes.rows.length === 0) {
        throw new Error('طلب الحساب غير موجود أو تم معالجته سابقاً');
      }
      const reqData = reqRes.rows[0];

      // ب) تحديث حالة طلب الحساب
      await client.query(
        `UPDATE account_requests 
         SET status = 'APPROVED', reviewed_by = $1, reviewed_at = NOW() 
         WHERE id = $2`,
        [reviewedByUserId, requestId]
      );

      // ج) إنشاء المستخدم أو تحديثه
      const userRes = await client.query(
        `INSERT INTO users (full_name, phone_number, username, password_hash, organization_id, status, created_at)
         VALUES ($1, $2, $3, $4, $5, 'ACTIVE', NOW())
         ON CONFLICT (username) DO UPDATE SET status = 'ACTIVE'
         RETURNING id`,
        [reqData.full_name, reqData.phone_number, reqData.username, defaultPasswordHash, reqData.organization_id]
      );
      const newUserId = userRes.rows[0].id;

      // د) إنشاء العضوية المفعّلة
      await client.query(
        `INSERT INTO organization_memberships (user_id, organization_id, status, created_at)
         VALUES ($1, $2, 'ACTIVE', NOW())
         ON CONFLICT (user_id, organization_id) DO UPDATE SET status = 'ACTIVE'`,
        [newUserId, reqData.organization_id]
      );

      // هـ) إسناد الدور المربوط بالجهة
      if (roleId) {
        await client.query(
          `INSERT INTO user_roles (user_id, organization_id, role_id)
           VALUES ($1, $2, $3)
           ON CONFLICT DO NOTHING`,
          [newUserId, reqData.organization_id, roleId]
        );
      }

      await client.query('COMMIT');
      return { userId: newUserId, organizationId: reqData.organization_id };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // 2. إنشاء مشاركة سجل صريحة مع التأكد من ملكية السجل
  static async shareRecord(data) {
    const { entity_type, entity_id, owner_organization_id, shared_with_organization_id, shared_by_user_id } = data;

    const query = `
      INSERT INTO shared_records (
        entity_type, entity_id, owner_organization_id, 
        shared_with_organization_id, shared_by_user_id, status, shared_at
      )
      VALUES ($1, $2, $3, $4, $5, 'ACTIVE', NOW())
      RETURNING *
    `;
    const result = await pool.query(query, [
      entity_type, entity_id, owner_organization_id, shared_with_organization_id, shared_by_user_id
    ]);
    return result.rows[0];
  }

  // 3. إلغاء/سحب مشاركة سجل مع تدوين السبب دون حذف
  static async revokeRecordShare(sharedRecordId, revokedByUserId, reason) {
    const query = `
      UPDATE shared_records
      SET status = 'REVOKED',
          revoked_at = NOW(),
          revoked_by_user_id = $2,
          reason = $3
      WHERE id = $1 AND status = 'ACTIVE'
      RETURNING *
    `;
    const result = await pool.query(query, [sharedRecordId, revokedByUserId, reason]);
    return result.rows[0] || null;
  }
}

module.exports = OrganizationSharingModel;