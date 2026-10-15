const OrganizationLink = require('../models/OrganizationLink');
const auditLogger = require('../utils/auditLogger');
const ApiError = require('../errors/ApiError');

class OrganizationLinkService {
  static async createLink({ sourceOrganizationId, targetOrganizationId, linkType, actingUser }) {
    if (sourceOrganizationId === targetOrganizationId) {
      throw ApiError.badRequest('لا يمكن إنشاء علاقة ربط بين الجهة ونفسها');
    }

    const existingLink = await OrganizationLink.findActiveLink(sourceOrganizationId, targetOrganizationId);
    if (existingLink) {
      throw ApiError.badRequest('توجد علاقة ربط فعالة ومسجلة بين هاتين الجهتين بالفعل');
    }

    const link = await OrganizationLink.create({
      sourceOrganizationId,
      targetOrganizationId,
      linkType,
      createdByUserId: actingUser.id
    });

    await auditLogger.log({
      userId: actingUser.id,
      organizationId: actingUser.currentOrganizationId,
      actionType: 'ORGANIZATION_LINK_CREATED',
      entityType: 'ORGANIZATION_LINK',
      entityId: link.id,
      newValues: link
    });

    return link;
  }

  static async approveLink({ linkId, actingUser }) {
    if (!actingUser.is_system_admin) {
      throw ApiError.forbidden('اعتماد روابط الجهات محصور بمدير النظام السيادي');
    }

    const approvedLink = await OrganizationLink.approveLink(linkId, actingUser.id);
    if (!approvedLink) {
      throw ApiError.notFound('علاقة الربط غير موجودة أو معالجة سابقاً');
    }

    await auditLogger.log({
      userId: actingUser.id,
      organizationId: actingUser.currentOrganizationId,
      actionType: 'ORGANIZATION_LINK_APPROVED',
      entityType: 'ORGANIZATION_LINK',
      entityId: linkId,
      newValues: approvedLink
    });

    return approvedLink;
  }
}

module.exports = OrganizationLinkService;