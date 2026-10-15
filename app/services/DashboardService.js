// services/DashboardService.js
const Dashboard = require('../models/Dashboard');

class DashboardService {
  static async getSummary(organizationId) {
    return await Dashboard.getSummary(organizationId);
  }
  static async getDashboardData(user) {
    const userId = user.id;
    const orgId = user.organization_id;
    const permissions = user.permissions || [];
    const isSystemAdmin = user.role_code === 'SYSTEM_ADMIN';

    // 1. جلب بيانات الملف الشخصي والجهة
    const profile = await Dashboard.getUserProfile(userId);
    if (!profile) {
      throw new Error('المستخدم غير موجود أو غير فعال.');
    }
    const userPermissions = await Dashboard.getUserPermissions(userId);
    if (!userPermissions) {
      throw new Error('فشل في جلب صلاحيات المستخدم.');
    }

    // 2. جلب الإحصائيات
    const summary = await Dashboard.getSummaryStats(userId, orgId, isSystemAdmin);

    // 3. جلب الإجراءات المعلقة
    const pendingActions = await Dashboard.getPendingActions(userId, orgId, isSystemAdmin);
    summary.pending_actions_count = pendingActions.length;

    // 4. بناء قائمة الإجراءات السريعة بناءً على الصلاحيات الفعلية
    const quickActions = this.getQuickActionsByPermissions(permissions, isSystemAdmin);

    // 5. جلب السجل المختصر للنشاطات
    const recentActivities = await Dashboard.getRecentActivities(userId, orgId, isSystemAdmin);

    return {
      user: {
        id: profile.id,
        full_name: profile.full_name,
        username: profile.username,
        userPermissions
      },
      organization: {
        id: profile.org_id || null,
        name: profile.org_name || 'غير محدد',
      },
      role: {
        id: profile.role_id,
        name: profile.role_name,
      },
      
      summary,
      quick_actions: quickActions,
      pending_actions: pendingActions,
      recent_activities: recentActivities,
    };
  }

  static getQuickActionsByPermissions(permissions, isSystemAdmin) {
    const availableActions = [
      {
        key: 'cases',
        title: 'إدارة الحالات',
        permission: 'cases.view',
      },
      {
        key: 'transport',
        title: 'طلبات النقل',
        permission: 'transport.view',
      },
      {
        key: 'forensics',
        title: 'الطب الشرعي',
        permission: 'forensics.view',
      },
      {
        key: 'accounts',
        title: 'إدارة الحسابات',
        permission: 'users.manage',
      },
    ];

    if (isSystemAdmin) return availableActions;

    return availableActions.filter(action =>
      permissions.includes(action.permission)
    );
  }
}

module.exports = DashboardService;