// models/Dashboard.js
const { pool } = require('../config/db');

class Dashboard {
  // جلب بيانات المستخدم مع الجهة والدور
  static async getUserProfile(userId) {
    const query = `
      SELECT
            u.id,
            u.full_name,
            u.username,
            u.email,
            u.status,

            r.id AS role_id,
            r.name AS role_name,

            ur.organization_id AS org_id,
            o.name AS org_name

        FROM users u

        LEFT JOIN user_roles ur
            ON ur.user_id = u.id

        LEFT JOIN roles r
            ON r.id = ur.role_id

        LEFT JOIN organizations o
            ON o.id = ur.organization_id

        WHERE u.id = $1
        

        LIMIT 1;
    `;
    
    const rows  = await pool.query(query, [userId]);
    

    return rows.rows[0] || null;
  }
  static async getUserPermissions(userId) {
    const permissionsQuery = `
      SELECT DISTINCT
        p.id,
        p.name
      FROM user_roles ur

      JOIN role_permissions rp
        ON rp.role_id = ur.role_id

      JOIN permissions p
        ON p.id = rp.permission_id

      WHERE ur.user_id = $1

      ORDER BY p.name;
    `;
    const permissions = await pool.query(permissionsQuery, [userId]);
    return permissions.rows;
  }

  // جلب الإحصائيات مع مراعاة عزل الجهات (Organization Scope)
 static async getSummaryStats(userId, orgId, isSystemAdmin) {
  // 1. عدد الحالات
  // لا نستخدم organization_id هنا إلا إذا كان موجوداً فعلاً في cases
  const casesQuery = `
    SELECT COUNT(*)::int AS count
    FROM cases
  `;

  const casesRes = await pool.query(casesQuery);

  // 2. عدد طلبات النقل
  const transportQuery = `
    SELECT COUNT(*)::int AS count
    FROM transport_requests
  `;

  const transportRes = await pool.query(transportQuery);

  // 3. عدد الإشعارات غير المقروءة للمستخدم
  const unreadNotificationsQuery = `
    SELECT COUNT(*)::int AS count
    FROM notifications
    WHERE user_id = $1
      AND is_read = false
  `;

  const unreadRes = await pool.query(
    unreadNotificationsQuery,
    [userId]
  );

  return {
    cases_count: casesRes.rows[0]?.count || 0,

    transport_requests_count:
      transportRes.rows[0]?.count || 0,

    pending_actions_count: 0,

    unread_notifications_count:
      unreadRes.rows[0]?.count || 0,
  };
}

  // جلب طلبات المعالجة المعلقة
  static async getPendingActionsss(userId, orgId, isSystemAdmin) {
    const pendingActions = [];

    // مثال: طلبات إنشاء الحسابات بانتظار المراجعة (إذا كان مسؤول)
    if (isSystemAdmin) {
      const query = `
        SELECT id, full_name, created_at 
        FROM users 
        WHERE status = 'pending_approval' 
        LIMIT 5
      `;
      const { rows } = await pool.query(query);
      rows.forEach(row => {
        pendingActions.push({
          type: 'account_request',
          id: row.id,
          title: `طلب إنشاء حساب بانتظار المراجعة: ${row.full_name}`,
          created_at: row.created_at
        });
      });
    }

    return pendingActions;
  }
/**
 * جلب المهام المعلقة من عدة جداول
 */
static async getPendingActions({
  organization_id = null,
  user_id = null,
  role = null,
  isSystemAdmin = false,
} = {}) {
  const actions = [];

  // 1. طلبات الحسابات المعلقة
  if (isSystemAdmin) {
    const { rows } = await pool.query(`
      SELECT
        id,
        full_name,
        requested_username,
        submitted_at
      FROM account_requests
      WHERE status = 'pending'
      ORDER BY submitted_at DESC
      LIMIT 20
    `);

    rows.forEach((r) => {
      actions.push({
        id: r.id,
        title: 'طلب حساب جديد',
        subtitle: `${r.full_name} (${r.requested_username})`,
        type: 'account_request',
        route: '/account-requests',
        created_at: r.submitted_at,
      });
    });
  }

  // 2. طلبات النقل المعلقة
  const transportQuery = `
    SELECT
      id,
      request_number,
      transport_type,
      requested_at
    FROM transport_requests
    WHERE status = 'pending'
    ORDER BY requested_at DESC
    LIMIT 20
  `;

  const { rows: transportRequests } = await pool.query(transportQuery);

  transportRequests.forEach((r) => {
    actions.push({
      id: r.id,
      title: 'طلب نقل بانتظار الاعتماد',
      subtitle: `#${r.request_number} - ${r.transport_type}`,
      type: 'transport_approval',
      route: '/transport',
      created_at: r.requested_at,
    });
  });

  // 3. الفحوصات بانتظار التصريح
  const forensicQuery = `
    SELECT
      fr.id,
      fr.request_number,
      bc.body_number,
      fr.requested_at
    FROM forensic_requests fr
    LEFT JOIN body_cases bc
      ON bc.id = fr.body_case_id
    WHERE fr.status = 'awaiting_authorization'
    ORDER BY fr.requested_at DESC
    LIMIT 20
  `;

  const { rows: forensicRequests } = await pool.query(forensicQuery);

  forensicRequests.forEach((r) => {
    actions.push({
      id: r.id,
      title: 'فحص شرعي بانتظار التصريح',
      subtitle: `#${r.request_number} - جثمان ${r.body_number || '—'}`,
      type: 'forensic_approval',
      route: '/forensic-requests',
      created_at: r.requested_at,
    });
  });
// 5. تصاريح قاربت على الانتهاء
const { rows: expiringAuths } = await pool.query(`
  SELECT id, authorization_number, valid_until
  FROM authorizations
  WHERE status = 'active'
    AND valid_until BETWEEN NOW() AND NOW() + INTERVAL '3 days'
  ORDER BY valid_until ASC
  LIMIT 10
`);

expiringAuths.forEach((r) => {
  actions.push({
    id: r.id,
    title: 'تصريح قارب على الانتهاء',
    subtitle: `#${r.authorization_number} - ينتهي ${new Date(r.valid_until).toLocaleDateString('ar')}`,
    type: 'authorization_expiring',
    route: '/authorizations',
    created_at: r.valid_until,
  });
});

// 6. مهام توصيل متأخرة
const { rows: lateMissions } = await pool.query(`
  SELECT id, dispatch_order_number, expected_return_at
  FROM vehicle_dispatch_orders
  WHERE status IN ('dispatched', 'in_progress')
    AND expected_return_at < NOW()
  ORDER BY expected_return_at ASC
  LIMIT 10
`);

lateMissions.forEach((r) => {
  actions.push({
    id: r.id,
    title: 'مهمة توصيل متأخرة',
    subtitle: `#${r.dispatch_order_number} - كان يجب أن تعود ${new Date(r.expected_return_at).toLocaleDateString('ar')}`,
    type: 'late_mission',
    route: '/vehicle-dispatch-orders',
    created_at: r.expected_return_at,
  });
});

// 7. جثامين بانتظار التسليم (مع تصريح نشط)
const { rows: readyForHandover } = await pool.query(`
  SELECT bc.id, bc.body_number, bc.received_at
  FROM body_cases bc
  WHERE bc.custody_status = 'preserved'
    AND EXISTS (
      SELECT 1 FROM authorizations a
      INNER JOIN authorization_targets t ON t.authorization_id = a.id
      WHERE t.target_type = 'body_case'
        AND t.target_id = bc.id
        AND a.status = 'active'
    )
  ORDER BY bc.received_at ASC
  LIMIT 10
`);

readyForHandover.forEach((r) => {
  actions.push({
    id: r.id,
    title: 'جثمان جاهز للتسليم',
    subtitle: `#${r.body_number} - لديه تصريح نشط`,
    type: 'ready_for_handover',
    route: '/body-cases',
    created_at: r.received_at,
  });
});
  // 4. ترتيب المهام من الأحدث إلى الأقدم
  actions.sort((a, b) => {
    const dateA = a.created_at
      ? new Date(a.created_at).getTime()
      : 0;

    const dateB = b.created_at
      ? new Date(b.created_at).getTime()
      : 0;

    return dateB - dateA;
  });

  return actions;
}
  // جلب النشاطات الأخيرة من Audit Log
  static async getRecentActivities(userId, orgId, isSystemAdmin) {
    let query = `
      SELECT id, entity_type AS title, created_at 
      FROM audit_logs 
    `;
    const params = [];

    if (!isSystemAdmin && orgId) {
      query += ` WHERE organization_id = $1`;
      params.push(orgId);
    }

    query += ` ORDER BY created_at DESC LIMIT 5`;

    const { rows } = await pool.query(query, params);
    return rows;
  }
  
  static async getSummary(organizationId = null) {
    const orgFilter = organizationId ? 'AND organization_id = $1' : '';
    const bodyOrgFilter = organizationId
      ? 'AND current_organization_id = $1'
      : '';
    const params = organizationId ? [organizationId] : [];

    const cases = await pool.query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE case_status = 'new')::int AS new_count,
         COUNT(*) FILTER (WHERE case_status = 'open')::int AS open_count,
         COUNT(*) FILTER (WHERE case_status = 'closed')::int AS closed_count
       FROM cases WHERE 1=1 ${orgFilter}`,
      params,
    );

    const bodyCases = await pool.query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE custody_status = 'preserved')::int AS preserved_count,
         COUNT(*) FILTER (WHERE custody_status = 'handed_over')::int AS handed_over_count
       FROM body_cases WHERE 1=1 ${bodyOrgFilter}`,
      params,
    );

    const forensicRequests = await pool.query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE status = 'awaiting_authorization')::int AS awaiting_count,
         COUNT(*) FILTER (WHERE status = 'completed')::int AS completed_count
       FROM forensic_requests`,
    );

    const authorizations = await pool.query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE status = 'active')::int AS active_count,
         COUNT(*) FILTER (WHERE status = 'revoked')::int AS revoked_count
       FROM authorizations`,
    );

    const transportRequests = await pool.query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE status = 'pending')::int AS pending_count,
         COUNT(*) FILTER (WHERE status = 'completed')::int AS completed_count
       FROM transport_requests`,
    );

    const reports = await pool.query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE generated_at >= NOW() - INTERVAL '30 days')::int AS this_month
       FROM reports`,
    );

    return {
      cases: cases.rows[0],
      body_cases: bodyCases.rows[0],
      forensic_requests: forensicRequests.rows[0],
      authorizations: authorizations.rows[0],
      transport_requests: transportRequests.rows[0],
      reports: reports.rows[0],
    };
  }

  static async getStats({ isSystemAdmin = false } = {}) {
  const cases = await pool.query(`
    SELECT COUNT(*)::int AS total_cases FROM cases
  `);

  const transports = await pool.query(`
    SELECT COUNT(*)::int AS active_transports
    FROM transport_requests
    WHERE status IN ('pending', 'approved', 'assigned', 'in_progress')
  `);

  const accountReqs = await pool.query(`
    SELECT COUNT(*)::int AS pending_account_requests
    FROM account_requests
    WHERE status = 'pending'
  `);

  const notifications = await pool.query(`
    SELECT COUNT(*)::int AS unread_notifications
    FROM notifications
    WHERE is_read = false
  `);

  // ✅ استخدم دالتك الموجودة
  const pendingActions = await Dashboard.getPendingActions({ isSystemAdmin });

  return {
    total_cases: cases.rows[0].total_cases,
    active_transports: transports.rows[0].active_transports,
    pending_account_requests: accountReqs.rows[0].pending_account_requests,
    unread_notifications: notifications.rows[0].unread_notifications,
    pending_actions_count: pendingActions.length,
  };
}
}

module.exports = Dashboard;
