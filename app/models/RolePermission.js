
// models/RolePermission.js

const { pool } = require('../config/db');

class RolePermission {
  // إسناد صلاحية إلى دور
  static async assign({ role_id, permission_id }, client = pool) {
    const query = `
      INSERT INTO public.role_permissions (
        role_id,
        permission_id
      )
      VALUES ($1, $2)
      ON CONFLICT (role_id, permission_id) DO NOTHING
      RETURNING *
    `;

    const result = await client.query(query, [
      role_id,
      permission_id,
    ]);

    if (result.rows[0]) {
      return result.rows[0];
    }

    // الربط موجود مسبقًا
    const existing = await client.query(
      `
        SELECT role_id, permission_id
        FROM public.role_permissions
        WHERE role_id = $1
          AND permission_id = $2
      `,
      [role_id, permission_id]
    );

    return existing.rows[0] || null;
  }

  // جلب جميع الصلاحيات المسندة إلى دور
  static async findByRoleId(roleId) {
    const query = `
      SELECT
        rp.role_id,
        rp.permission_id,
        p.code,
        p.name,
        p.description
      FROM public.role_permissions AS rp
      INNER JOIN public.permissions AS p
        ON p.id = rp.permission_id
      WHERE rp.role_id = $1
      ORDER BY p.name ASC
    `;

    const result = await pool.query(query, [roleId]);
    return result.rows;
  }

  // إلغاء صلاحية من دور
  static async remove(roleId, permissionId) {
    const query = `
      DELETE FROM public.role_permissions
      WHERE role_id = $1
        AND permission_id = $2
      RETURNING role_id, permission_id
    `;

    const result = await pool.query(query, [
      roleId,
      permissionId,
    ]);

    return result.rows[0] || null;
  }

  // استبدال جميع صلاحيات دور بقائمة جديدة
  static async replaceForRole(roleId, permissionIds) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // التأكد من وجود الدور
      const role = await client.query(
        `SELECT id FROM public.roles WHERE id = $1 FOR UPDATE`,
        [roleId]
      );

      if (!role.rows[0]) {
        const error = new Error('الدور غير موجود');
        error.statusCode = 404;
        throw error;
      }

      // التحقق من وجود جميع الصلاحيات قبل حذف أي ربط
      const uniqueIds = [...new Set(permissionIds)];

      if (uniqueIds.length > 0) {
        const permissions = await client.query(
          `
            SELECT id
            FROM public.permissions
            WHERE id = ANY($1::uuid[])
          `,
          [uniqueIds]
        );

        if (permissions.rows.length !== uniqueIds.length) {
          const error = new Error(
            'توجد صلاحية واحدة أو أكثر غير موجودة'
          );
          error.statusCode = 400;
          throw error;
        }
      }

      await client.query(
        `
          DELETE FROM public.role_permissions
          WHERE role_id = $1
        `,
        [roleId]
      );

      for (const permissionId of uniqueIds) {
        await client.query(
          `
            INSERT INTO public.role_permissions (
              role_id,
              permission_id
            )
            VALUES ($1, $2)
          `,
          [roleId, permissionId]
        );
      }

      const result = await client.query(
        `
          SELECT
            rp.role_id,
            p.id AS permission_id,
            p.code,
            p.name,
            p.description
          FROM public.role_permissions AS rp
          INNER JOIN public.permissions AS p
            ON p.id = rp.permission_id
          WHERE rp.role_id = $1
          ORDER BY p.name ASC
        `,
        [roleId]
      );

      await client.query('COMMIT');
      return result.rows;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = RolePermission;
