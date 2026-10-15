const { pool } = require('../config/db');
const OrganizationMembership = require('../models/OrganizationMembership');
const auditLogger = require('../utils/auditLogger');
const ApiError = require('../errors/ApiError');

class OrganizationMembershipService {
  static async updateMembershipStatus({ targetUserId, targetOrgId, newStatus, actingUserId, actingOrgId, isSystemAdmin }) {
    if (!isSystemAdmin && targetOrgId !== actingOrgId) {
      throw ApiError.forbidden('لا يمكنك تعديل عضوية مستخدم خارج نطاق جهتك');
    }

    const currentMembership = await OrganizationMembership.findActiveMembership(targetUserId, targetOrgId);
    if (!currentMembership && newStatus !== 'active') {
      throw ApiError.notFound('لا توجد عضوية نشطة لهؤلاء البيانات لتعديلها');
    }

    const updated = await OrganizationMembership.updateStatus(targetUserId, targetOrgId, newStatus);

    await auditLogger.log({
      userId: actingUserId,
      organizationId: actingOrgId,
      actionType: `MEMBERSHIP_STATUS_${newStatus}`,
      entityType: 'ORGANIZATION_MEMBERSHIP',
      entityId: updated.id,
      oldValues: { status: currentMembership?.status },
      newValues: { status: newStatus }
    });

    return updated;
  }
}

module.exports = OrganizationMembershipService;